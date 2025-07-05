// src/app/api/create-connect-account/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || 'http://localhost:9002';
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no especificado.' }, { status: 400 });
  }
  if (!db) {
    return NextResponse.json({ error: 'La base de datos no está inicializada.' }, { status: 500 });
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
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
      refresh_url: `${origin}/settings`,
      return_url: `${origin}/settings?stripe_connect_return=true`,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Error al crear la cuenta de Stripe Connect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
