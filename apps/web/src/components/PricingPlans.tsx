import { useMemo, useState } from "react";
import { Plan, Software } from "../types/software";
import { formatInterval, formatPrice } from "../utils/pricing";

interface PricingPlansProps {
  software: Software;
}

type IntervalOption = {
  key: string;
  unit: NonNullable<Plan["prices"][number]["interval"]>["unit"];
  count: number;
};

export function PricingPlans({ software }: PricingPlansProps) {
  const plans = software.plans ?? [];
  const options = useMemo<IntervalOption[]>(() => {
    const intervals = new Map<string, IntervalOption>();
    for (const price of plans.flatMap((plan) => plan.prices)) {
      if (price.billing !== "RECURRING" || !price.interval) continue;
      const key = `${price.interval.unit}/${price.interval.count}`;
      intervals.set(key, { key, ...price.interval });
    }
    return [...intervals.values()].sort((a, b) => {
      const duration = (value: IntervalOption) =>
        ({ DAY: 1, WEEK: 7, MONTH: 30.4375, YEAR: 365.25 })[value.unit] *
        value.count;
      return duration(a) - duration(b);
    });
  }, [plans]);
  const [selected, setSelected] = useState("");
  const selectedKey = options.some((option) => option.key === selected)
    ? selected
    : (options.find((option) => option.unit === "MONTH" && option.count === 1)
        ?.key ??
      options[0]?.key ??
      "");

  if (!plans.length)
    return (
      <section className="pricing-section">
        <h2>Pricing</h2>
        <p>Pricing information is not available yet.</p>
      </section>
    );

  return (
    <section className="pricing-section" aria-labelledby="pricing-heading">
      <div className="pricing-section-heading">
        <div>
          <h2 id="pricing-heading">Pricing</h2>
          <p>Choose a plan that fits the way you work.</p>
        </div>
        {options.length > 1 && (
          <label className="billing-selector">
            <span>Billing period</span>
            <select
              value={selectedKey}
              onChange={(event) => setSelected(event.target.value)}
              aria-label="Billing period"
            >
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {formatInterval(option.unit, option.count).replace("/", "")}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="plan-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            options={options}
            selectedKey={selectedKey}
            websiteUrl={software.affiliateUrl || software.websiteUrl}
            pricingUrl={software.pricingUrl}
          />
        ))}
      </div>
      <div className="pricing-disclosure">
        <span>
          {software.pricingVerifiedAt
            ? `Prices last checked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${software.pricingVerifiedAt.slice(0, 10)}T00:00:00Z`))}`
            : "Prices not verified yet"}
        </span>
        {software.pricingUrl && (
          <a
            href={software.pricingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            See official pricing ↗
          </a>
        )}
        <p>Prices change often. Confirm on the vendor&apos;s site.</p>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  options,
  selectedKey,
  websiteUrl,
  pricingUrl,
}: {
  plan: Plan;
  options: IntervalOption[];
  selectedKey: string;
  websiteUrl: string | null;
  pricingUrl: string | null;
}) {
  const selectedPrice = plan.prices.find(
    (price) =>
      price.billing === "RECURRING" &&
      price.interval &&
      `${price.interval.unit}/${price.interval.count}` === selectedKey,
  );
  const fallbackPrice =
    plan.prices.find((price) => price.billing !== "RECURRING") ??
    plan.prices[0];
  const displayPrice = selectedPrice ?? fallbackPrice;
  const contactSales =
    plan.pricingModel === "CUSTOM" ||
    (plan.prices.length > 0 &&
      plan.prices.every((price) => price.amount === null));
  const href = websiteUrl || pricingUrl;
  return (
    <article
      className={`plan-card${plan.isRecommended ? " plan-card-recommended" : ""}`}
    >
      {plan.isRecommended && (
        <span className="recommended-badge">Recommended</span>
      )}
      <div className="plan-card-title">
        <h3>{plan.name}</h3>
        {plan.isFree && <span className="plan-status-badge">Free</span>}
        {plan.trialDays && (
          <span className="trial-badge">{plan.trialDays}-day free trial</span>
        )}
      </div>
      {plan.description && (
        <p className="plan-description">{plan.description}</p>
      )}
      <div className="plan-price">
        {contactSales ? (
          <>
            <strong>Contact sales</strong>
            <span>Custom pricing</span>
          </>
        ) : displayPrice?.amount === 0 ? (
          <>
            <strong>Free</strong>
            <span></span>
          </>
        ) : displayPrice?.amount !== null &&
          displayPrice?.amount !== undefined ? (
          <>
            <strong>
              {formatPrice(displayPrice.amount, displayPrice.currency)}
            </strong>
            <span>
              {formatInterval(
                displayPrice.interval?.unit ?? null,
                displayPrice.interval?.count ?? null,
                displayPrice.billing,
              )}
            </span>
          </>
        ) : (
          <>
            <strong>Unknown</strong>
            <span>
              {displayPrice
                ? formatInterval(
                    displayPrice.interval?.unit ?? null,
                    displayPrice.interval?.count ?? null,
                    displayPrice.billing,
                  )
                : ""}
            </span>
          </>
        )}
      </div>
      {displayPrice?.note && (
        <p className="plan-price-note">{displayPrice.note}</p>
      )}
      {!selectedPrice &&
        displayPrice?.billing === "RECURRING" &&
        options.length > 1 && (
          <small className="plan-fallback-note">
            Available billing:{" "}
            {formatInterval(
              displayPrice.interval?.unit ?? null,
              displayPrice.interval?.count ?? null,
            )}
          </small>
        )}
      {displayPrice?.savingsVsMonthlyPercent !== null &&
        displayPrice?.savingsVsMonthlyPercent !== undefined &&
        displayPrice.savingsVsMonthlyPercent > 0 &&
        displayPrice.billing === "RECURRING" &&
        displayPrice.interval?.unit === "YEAR" && (
          <span className="plan-savings">
            Save {displayPrice.savingsVsMonthlyPercent}%
          </span>
        )}
      {plan.seatsNote && <p className="plan-seats-note">{plan.seatsNote}</p>}
      <ul className="plan-highlights">
        {plan.highlights.map((highlight, index) => (
          <li key={`${plan.slug}-${index}`}>{highlight}</li>
        ))}
      </ul>
      {href && (
        <a
          className="button button-secondary plan-visit"
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          Visit site ↗
        </a>
      )}
    </article>
  );
}
