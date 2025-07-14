
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = new Headers(req.headers).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error al verificar el webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`✅ Webhook recibido: ${event.type}`);

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // This now only handles subscription events
    if (session.mode === 'subscription') {
      const userId = session.metadata?.userId;
      const priceId = session.metadata?.priceId;

      if (!userId || !priceId) {
        console.error('❌ Error: Faltan metadatos de usuario o del plan en la sesión de Stripe.');
        return new NextResponse('Webhook Error: Faltan metadatos de usuario o del plan.', { status: 400 });
      }
      
      console.log(`⏳ Procesando suscripción para el usuario: ${userId} con el plan ${priceId}`);

      try {
        if (!db) throw new Error('Firestore no está inicializado.');
        
        const userDocRef = doc(db, 'users', userId);
        
        let subscriptionTier: 'pro' | 'voice+' | null = null;
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            subscriptionTier = 'pro';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_VOICE_PLUS_PRICE_ID) {
            subscriptionTier = 'voice+';
        }

        if (subscriptionTier) {
          await updateDoc(userDocRef, {
              isPremium: true,
              subscriptionTier: subscriptionTier,
          });
          console.log(`✅ Usuario ${userId} actualizado a ${subscriptionTier}.`);
        } else {
          console.error(`❌ Error: priceId ${priceId} no reconocido.`);
        }

      } catch (error) {
        console.error('❌ Error al actualizar el documento del usuario en Firestore:', error);
        return new NextResponse('Webhook Error: No se pudo actualizar el usuario.', { status: 500 });
      }
    }
  }

  // Handle Stripe Connect account updates
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const accountId = account.id;

    if (account.charges_enabled && account.details_submitted) {
      console.log(`✅ Cuenta de Connect ${accountId} completamente habilitada.`);
      try {
        if (!db) throw new Error('Firestore no está inicializado.');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('stripeConnectAccountId', '==', accountId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await updateDoc(userDoc.ref, { canMonetize: true });
            console.log(`✅ Usuario ${userDoc.id} ahora puede monetizar.`);
        } else {
            console.warn(`⚠️ No se encontró ningún usuario para la cuenta de Connect ${accountId}.`);
        }

      } catch (error) {
         console.error('❌ Error al actualizar el estado de monetización del usuario:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
