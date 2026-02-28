import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
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
