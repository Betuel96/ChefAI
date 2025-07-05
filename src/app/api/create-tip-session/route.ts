
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const TIP_AMOUNT_CENTS = 200; // $2.00
const PLATFORM_FEE_CENTS = 50; // $0.50 (25% fee)

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || 'http://localhost:9002';
  
  const { tipperId, creatorId, postId, postContent } = await req.json();

  if (!tipperId || !creatorId || !postId) {
    return NextResponse.json({ error: 'Faltan datos para procesar la propina.' }, { status: 400 });
  }

  if (!db) {
     return NextResponse.json({ error: 'La base de datos no está inicializada.' }, { status: 500 });
  }

  try {
    // 1. Get the creator's Stripe Connect account ID
    const creatorDocRef = doc(db, 'users', creatorId);
    const creatorDocSnap = await getDoc(creatorDocRef);

    if (!creatorDocSnap.exists() || !creatorDocSnap.data()?.stripeConnectAccountId) {
      return NextResponse.json({ error: 'La cuenta del creador no está configurada para recibir pagos.' }, { status: 400 });
    }
    const creatorStripeAccountId = creatorDocSnap.data()?.stripeConnectAccountId;

    // 2. Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Propina para la publicación: "${postContent.substring(0, 50)}..."`,
              images: ['https://placehold.co/128x128/f7a849/333333?text=ChefAI'],
            },
            unit_amount: TIP_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: PLATFORM_FEE_CENTS,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
      },
      success_url: `${origin}/post/${postId}?tip_success=true`,
      cancel_url: `${origin}/post/${postId}`,
       metadata: {
        tipperId,
        creatorId,
        postId,
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'No se pudo crear la sesión de pago.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error al crear la sesión de propina en Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
