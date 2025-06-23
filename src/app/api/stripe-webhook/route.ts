
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error al verificar el webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('❌ Error: No se encontró el userId en los metadatos de la sesión de Stripe.');
      return new NextResponse('Webhook Error: Faltan metadatos del usuario.', { status: 400 });
    }

    try {
      if (!db) throw new Error('Firestore no está inicializado.');
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        isPremium: true,
      });
      console.log(`✅ Usuario ${userId} actualizado a Pro.`);

    } catch (error) {
      console.error('❌ Error al actualizar el documento del usuario en Firestore:', error);
      return new NextResponse('Webhook Error: No se pudo actualizar el usuario.', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
