import Stripe from 'stripe';

let stripeClient: Stripe | undefined;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });

  return stripeClient;
}

export const PLANS = {
  FREE: {
    name: 'Gratuit',
    maxSpots: 50,
    maxCatchesPerMonth: 10,
    features: ['Accès carte', '50 spots visibles', '10 prises/mois'],
  },
  PREMIUM: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    price: 4.99,
    features: [
      'Spots illimités',
      'Spots secrets/premium',
      'Reconnaissance poisson par photo',
      'Pas de publicité',
      'Export données',
      'Alertes personnalisées',
    ],
  },
} as const;
