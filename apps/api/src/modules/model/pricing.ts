export type BillingUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";
export type BillingType = "RECURRING" | "ONE_TIME" | "LIFETIME";
export type PricingModel = "FLAT" | "PER_USER" | "USAGE" | "CUSTOM";

export interface RawPlanPrice {
  billing: BillingType;
  interval?: { unit: BillingUnit; count: number } | null;
  amount: number | null;
  currency: string;
  note: string | null;
}
export type PlanType =
  | "FREE"
  | "TRIAL"
  | "PAID"
  | "ENTERPRISE"
  | "CUSTOM"
  | "CONTACT_SALES";

export interface RawPlan {
  slug: string;
  name: string;
  description: string | null;
  isFree: boolean;
  isRecommended: boolean;
  trialDays: number | null;
  pricingModel: PricingModel;
  seatsNote: string | null;
  highlights: string[];
  position?: number;
  prices: RawPlanPrice[];
  planType: PlanType;
  limits: unknown;
  isAvailable: boolean;
  lastVerifiedAt: Date | string | null;
  refundPolicyUrl: string | null;
}
export interface ApiPlanPrice extends RawPlanPrice {
  monthlyEquivalent: number | null;
  yearlyEquivalent: number | null;
  savingsVsMonthlyPercent: number | null;
  label: string;
}
export interface ApiPlan extends Omit<RawPlan, "prices"> {
  prices: ApiPlanPrice[];
}
export interface PricingSummary {
  hasFreePlan: boolean;
  hasFreeTrial: boolean;
  trialDays: number | null;
  startingPrice: null | {
    amount: number;
    currency: string;
    intervalLabel: string;
    monthlyEquivalent: number;
    planName: string;
  };
  billingOptions: string[];
  hasCustomPricing: boolean;
  hasOneTimeOrLifetime: boolean;
}

const intervalBaseDays: Record<BillingUnit, number> = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30.4375,
  YEAR: 365.25,
};
const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function formatIntervalLabel(
  price: Pick<RawPlanPrice, "billing" | "interval">,
): string {
  if (price.billing === "ONE_TIME") return "one-time";
  if (price.billing === "LIFETIME") return "lifetime";
  if (!price.interval) return "recurring";
  const { unit, count } = price.interval;
  const singular = unit.toLowerCase();
  if (count === 1) return `/${singular}`;
  return `/${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function enrichPricing(plans: RawPlan[]) {
  const monthlyByPlanAndCurrency = new Map<string, number>();
  for (const plan of plans) {
    for (const price of plan.prices) {
      if (
        price.billing === "RECURRING" &&
        price.amount !== null &&
        price.interval?.unit === "MONTH" &&
        price.interval.count === 1
      ) {
        monthlyByPlanAndCurrency.set(
          `${plan.slug}:${price.currency}`,
          price.amount,
        );
      }
    }
  }

  const enrichedPlans: ApiPlan[] = plans
    .map((plan) => ({
      ...plan,
      prices: plan.prices.map((price) => {
        let monthlyEquivalent: number | null = null;
        let yearlyEquivalent: number | null = null;
        let savingsVsMonthlyPercent: number | null = null;
        if (
          price.billing === "RECURRING" &&
          price.amount !== null &&
          price.interval
        ) {
          const intervalDays =
            intervalBaseDays[price.interval.unit] * price.interval.count;
          monthlyEquivalent = round2((price.amount / intervalDays) * 30.4375);
          yearlyEquivalent = round2((price.amount / intervalDays) * 365.25);
          if (price.interval.unit === "YEAR" && price.interval.count === 1) {
            const monthly = monthlyByPlanAndCurrency.get(
              `${plan.slug}:${price.currency}`,
            );
            if (monthly !== undefined && monthly > 0) {
              savingsVsMonthlyPercent = round2(
                (1 - price.amount / (monthly * 12)) * 100,
              );
            }
          }
        }
        return {
          ...price,
          monthlyEquivalent,
          yearlyEquivalent,
          savingsVsMonthlyPercent,
          label: formatIntervalLabel(price),
        };
      }),
    }))
    .sort((left, right) => {
      if (left.isFree !== right.isFree) return left.isFree ? -1 : 1;
      const leftPrice = left.prices
        .map((price) => price.monthlyEquivalent)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b)[0];
      const rightPrice = right.prices
        .map((price) => price.monthlyEquivalent)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b)[0];
      if (
        leftPrice !== undefined &&
        rightPrice !== undefined &&
        leftPrice !== rightPrice
      )
        return leftPrice - rightPrice;
      if (leftPrice !== undefined && rightPrice === undefined) return -1;
      if (rightPrice !== undefined && leftPrice === undefined) return 1;
      return (left.position ?? 0) - (right.position ?? 0);
    });

  const recurringPrices = plans.flatMap((plan) =>
    plan.prices.filter(
      (price) => price.billing === "RECURRING" && price.interval,
    ),
  );
  const billingOptions = [
    ...new Set(
      recurringPrices.map(
        (price) => `${price.interval!.unit}/${price.interval!.count}`,
      ),
    ),
  ].sort((left, right) => {
    const days = (value: string) => {
      const [unit, count] = value.split("/") as [BillingUnit, string];
      return intervalBaseDays[unit] * Number(count);
    };
    return days(left) - days(right);
  });
  const paidRecurring = enrichedPlans.flatMap((plan) =>
    plan.prices
      .filter(
        (price) =>
          !plan.isFree &&
          price.billing === "RECURRING" &&
          price.amount !== null &&
          price.amount > 0 &&
          price.monthlyEquivalent !== null,
      )
      .map((price) => ({ plan, price })),
  );
  paidRecurring.sort(
    (left, right) =>
      left.price.monthlyEquivalent! - right.price.monthlyEquivalent!,
  );
  const cheapest = paidRecurring[0];
  const trialDays =
    plans
      .map((plan) => plan.trialDays)
      .filter((days): days is number => days !== null && days > 0)
      .sort((a, b) => b - a)[0] ?? null;
  const summary: PricingSummary = {
    hasFreePlan: plans.some((plan) => plan.isFree),
    hasFreeTrial: trialDays !== null,
    trialDays,
    startingPrice: cheapest
      ? {
          amount: cheapest.price.amount!,
          currency: cheapest.price.currency,
          intervalLabel: cheapest.price.label,
          monthlyEquivalent: cheapest.price.monthlyEquivalent!,
          planName: cheapest.plan.name,
        }
      : null,
    billingOptions,
    hasCustomPricing: plans.some((plan) => plan.pricingModel === "CUSTOM"),
    hasOneTimeOrLifetime: plans.some((plan) =>
      plan.prices.some((price) => price.billing !== "RECURRING"),
    ),
  };
  return { plans: enrichedPlans, pricingSummary: summary };
}

export function demoDataAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.SHOW_DEMO_DATA === "true"
  );
}
