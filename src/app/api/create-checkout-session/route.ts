
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { auth } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const origin = headers().get('origin') || 'http://localhost:9002';
  
  // This is a simplified check. In a real app, you'd use a more robust
  // way to get the current user, perhaps from a session cookie or token.
  // For this example, we assume if the request is made, the user is logged in
  // on the client-side, which should be protected.
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no autenticado.' }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Add your Stripe Price ID to .env
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
      metadata: {
        userId: userId,
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'No se pudo crear la sesión de pago.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error al crear la sesión de Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 5