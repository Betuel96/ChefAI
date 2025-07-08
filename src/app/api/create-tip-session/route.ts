
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const TIP_AMOUNT_CENTS = 200; // $2.00
const PLATFORM_FEE_CENTS = 50; // $0.50 (25% fee)

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || 'http://localhost:3000';
  
  const { tipperId, creatorId, postId, postContent, locale } = await req.json();

  if (!tipperId || !creatorId || !postId) {
    return NextResponse.json({ error: 'Missing data to process tip.' }, { status: 400 });
  }

  if (!db) {
     return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
  }

  try {
    // 1. Get the creator's Stripe Connect account ID
    const creatorDocRef = doc(db, 'users', creatorId);
    const creatorDocSnap = await getDoc(creatorDocRef);

    if (!creatorDocSnap.exists() || !creatorDocSnap.data()?.stripeConnectAccountId) {
      return NextResponse.json({ error: 'Creator account not set up for payments.' }, { status: 400 });
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
              name: `Tip for post: "${postContent.substring(0, 50)}..."`,
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
      success_url: `${origin}/${locale}/post/${postId}?tip_success=true`,
      cancel_url: `${origin}/${locale}/post/${postId}`,
       metadata: {
        tipperId,
        creatorId,
        postId,
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error creating Stripe tip session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
