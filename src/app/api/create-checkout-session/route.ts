
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { auth } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const origin = headers().get('origin') || 'http://localhost:9002';
  
  const { userId, priceId } = await req.json();

  if (!userId || !priceId) {
    return NextResponse.json({ error: 'Usuario o plan no especificado.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings`,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'No se pudo crear la sesión de pago.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error al crear la sesión de Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
