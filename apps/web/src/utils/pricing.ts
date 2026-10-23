import { BillingType, BillingUnit, PlanPrice, PricingSummary, PricingType, Software } from '../types/software';

export function pricingLabel(pricingType: PricingType) {
  return {
    FREE: 'Free',
    FREEMIUM: 'Freemium',
    PAID: 'Paid',
    OPEN_SOURCE: 'Open source',
  }[pricingType];
}

export function formatPrice(amount: number, currency: string) {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatInterval(unit: BillingUnit | null, count: number | null, billing?: BillingType) {
  if (billing === 'ONE_TIME') return 'one-time';
  if (billing === 'LIFETIME') return 'lifetime';
  if (!unit || !count) return 'recurring';
  const labels: Record<BillingUnit, string> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };
  return count === 1 ? `/${labels[unit]}` : `/${count} ${labels[unit]}s`;
}

export function getPricingDisplay(software: Pick<Software, 'pricingType' | 'pricingSummary' | 'plans'>) {
  const summary = software.pricingSummary;
  if (!summary) return '';
  if (summary.startingPrice) return `From ${formatPrice(summary.startingPrice.monthlyEquivalent, summary.startingPrice.currency)}/mo`;
  if (summary.hasFreePlan) return software.pricingType === 'FREEMIUM' ? 'Free + paid plans' : 'Free';
  if (summary.hasCustomPricing) return 'Contact sales';
  const oneTime = software.plans?.flatMap(plan => plan.prices).find(price => (price.billing === 'ONE_TIME' || price.billing === 'LIFETIME') && price.amount !== null);
  return oneTime ? `${oneTime.billing === 'LIFETIME' ? 'Lifetime' : 'One-time'} ${formatPrice(oneTime.amount!, oneTime.currency)}` : '';
}

export function cheapestOnBasis(prices: PlanPrice[], basis: 'listed' | 'month' | 'year') {
  const candidates = prices.map((price, index) => {
    if (basis === 'listed') return price.amount === null ? null : { index, amount: price.amount, currency: price.currency };
    const amount = basis === 'month' ? price.monthlyEquivalent : price.yearlyEquivalent;
    return amount === null ? null : { index, amount, currency: price.currency };
  }).filter((item): item is { index: number; amount: number; currency: string } => item !== null);
  candidates.sort((a, b) => a.amount - b.amount);
  return candidates[0] ?? null;
}
