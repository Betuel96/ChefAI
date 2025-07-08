
// src/app/api/create-connect-account/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || 'http://localhost:3000';
  const { userId, locale } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'User not specified.' }, { status: 400 });
  }
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const userData = userDocSnap.data();
    let accountId = userData.stripeConnectAccountId;

    // Create a new Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: userData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      // Save the account ID to the user's document
      await updateDoc(userDocRef, { stripeConnectAccountId: accountId });
    }
    
    // Create an account link for the user to complete onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/${locale}/settings`,
      return_url: `${origin}/${locale}/settings?stripe_connect_return=true`,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
