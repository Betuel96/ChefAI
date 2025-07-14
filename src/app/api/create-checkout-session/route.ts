
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const origin = new Headers(req.headers).get('origin') || 'http://localhost:3000';
  
  const { userId, priceId, locale } = await req.json();

  if (!userId || !priceId) {
    return NextResponse.json({ error: 'User or plan not specified.' }, { status: 400 });
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
      success_url: `${origin}/${locale}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/settings`,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
