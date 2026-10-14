import {
  CSSProperties,
  FormEvent,
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { SITE_NAME } from "../config/site";
import { CompareRow, Comparison, Plan, PlanPrice, SoftwareSuggestion } from "../types/software";
import { pricingLabel, SoftwareLogo } from "./SoftwareCard";
import { formatInterval, formatPrice } from "../utils/pricing";

type PriceView = "listed" | "month" | "year";

function costValue(price: PlanPrice, view: PriceView) {
  if (price.amount === null) return null;
  if (price.billing !== "RECURRING" || view === "listed") {
    return `${formatPrice(price.amount, price.currency)}${price.billing === "RECURRING" ? formatInterval(price.interval?.unit ?? null, price.interval?.count ?? null, price.billing) : ` · ${formatInterval(null, null, price.billing)}`}`;
  }
  const amount = view === "month" ? price.monthlyEquivalent : price.yearlyEquivalent;
  return amount === null ? null : `${formatPrice(amount, price.currency)}/${view}`;
}

function planPriceFor(plan: Plan, view: PriceView) {
  const prices = plan.prices.map((price, index) => ({ price, index, amount: view === "month" ? price.monthlyEquivalent : view === "year" ? price.yearlyEquivalent : price.amount }))
    .filter(item => item.amount !== null)
    .sort((left, right) => left.amount! - right.amount!);
  if (prices.length) return prices[0];
  return plan.prices[0] ? { price: plan.prices[0], index: 0, amount: null } : null;
}

function PlanComparison({ plans, view }: { plans: Plan[]; view: PriceView }) {
  if (!plans.length) return <span className="compare-unknown">Unknown</span>;
  return <div className="compare-plan-list">{plans.map(plan => {
    const hasCustom = plan.pricingModel === "CUSTOM";
    const hasOneTime = plan.prices.some(price => price.billing === "ONE_TIME");
    const hasLifetime = plan.prices.some(price => price.billing === "LIFETIME");
    return <div className="compare-plan-entry" key={plan.slug}>
      <div className="compare-plan-title"><strong>{plan.name}</strong>{plan.isFree && <span className="plan-status-badge">Free</span>}{plan.trialDays && <span className="trial-badge">{plan.trialDays}-day trial</span>}{hasOneTime && <span className="plan-status-badge">One-time</span>}{hasLifetime && <span className="plan-status-badge">Lifetime</span>}</div>
      {hasCustom || !plan.prices.length ? <span>Contact sales</span> : plan.isFree ? <span>Free</span> : <div className="compare-plan-prices">{plan.prices.map((price, index) => <div key={`${plan.slug}-${index}`}>{price.amount === null ? <span className="compare-unknown">Unknown</span> : costValue(price, view)}{price.note && <small>{price.note}</small>}</div>)}</div>}
    </div>;
  })}</div>;
}

const parseApps = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean)
    : [];

export function ComparePage({
  onSelectionChange,
}: {
  onSelectionChange: (slugs: string[]) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const slugs = parseApps(searchParams.get("apps"));
  const appsKey = slugs.join(",");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [priceView, setPriceView] = useState<PriceView>("listed");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<SoftwareSuggestion[]>([]);
  const [searchError, setSearchError] = useState("");
  const [addingError, setAddingError] = useState("");

  useEffect(() => {
    const unique = [...new Set(slugs)];
    if (unique.length === slugs.length && slugs.length <= 4)
      onSelectionChange(slugs);
  }, [appsKey, onSelectionChange]);

  useEffect(() => {
    let active = true;
    if (slugs.length < 2) {
      setComparison(null);
      setError("");
      setLoading(false);
      document.title = `Compare software | ${SITE_NAME}`;
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError("");
    setComparison(null);
    api
      .compare(slugs)
      .then((result) => {
        if (!active) return;
        setComparison(result);
        setLoading(false);
        const names = result.apps.map((app) => app.name);
        document.title = `${names.length === 2 ? names.join(" vs ") : `${names[0]} vs ${names[1]}`} | ${SITE_NAME}`;
      })
      .catch((reason) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load comparison",
        );
        setLoading(false);
        document.title = `Compare software | ${SITE_NAME}`;
      });
    return () => {
      active = false;
    };
  }, [appsKey]);

  useEffect(() => {
    let active = true;
    const query = search.trim();
    if (!query) {
      setSuggestions([]);
      setSearchError("");
      return () => {
        active = false;
      };
    }
    const timer = window.setTimeout(() => {
      api
        .suggestSoftware(query)
        .then((items) => {
          if (active) {
            setSuggestions(items);
            setSearchError("");
          }
        })
        .catch((reason) => {
          if (active) {
            setSuggestions([]);
            setSearchError(
              reason instanceof Error ? reason.message : "Search unavailable",
            );
          }
        });
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const updateApps = (next: string[]) => {
    onSelectionChange(next);
    const params = new URLSearchParams(searchParams);
    if (next.length) params.set("apps", next.join(","));
    else params.delete("apps");
    setSearchParams(params);
    setAddingError("");
  };

  const addSuggestion = (suggestion: SoftwareSuggestion) => {
    if (slugs.includes(suggestion.slug)) {
      setAddingError(`${suggestion.name} is already in this comparison.`);
      return;
    }
    if (slugs.length >= 4) {
      setAddingError("Compare up to four tools at a time.");
      return;
    }
    updateApps([...slugs, suggestion.slug]);
    setSearch("");
    setSuggestions([]);
  };

  const visibleBasics = useMemo(
    () =>
      comparison?.basics.filter(
        (row) => !showDifferencesOnly || row.isDifferent,
      ) ?? [],
    [comparison, showDifferencesOnly],
  );
  const visibleSections = useMemo(
    () =>
      comparison?.sections
        .map((section) => ({
          ...section,
          rows: section.rows.filter(
            (row) => !showDifferencesOnly || row.isDifferent,
          ),
        }))
        .filter((section) => section.rows.length > 0) ?? [],
    [comparison, showDifferencesOnly],
  );
  const pricingRows = useMemo(() => {
    if (!comparison?.pricing) return [];
    return comparison.pricing.rows.map(row => {
      let values = row.values;
      if (row.slug === "starting-price") {
        values = comparison.pricing.plans.map(plans => {
          const available = plans.flatMap(plan => plan.isFree ? [] : plan.prices)
            .filter(price => price.billing === "RECURRING" && price.amount !== null)
            .sort((left, right) => {
              const leftAmount = priceView === "month" ? left.monthlyEquivalent : priceView === "year" ? left.yearlyEquivalent : left.monthlyEquivalent;
              const rightAmount = priceView === "month" ? right.monthlyEquivalent : priceView === "year" ? right.yearlyEquivalent : right.monthlyEquivalent;
              return (leftAmount ?? Number.POSITIVE_INFINITY) - (rightAmount ?? Number.POSITIVE_INFINITY);
            });
          const price = available[0];
          if (!price) return null;
          if (priceView === "month" && price.monthlyEquivalent !== null) return `${formatPrice(price.monthlyEquivalent, price.currency)}/month`;
          if (priceView === "year" && price.yearlyEquivalent !== null) return `${formatPrice(price.yearlyEquivalent, price.currency)}/year`;
          return costValue(price, "listed");
        });
      } else if (row.slug === "cheapest-yearly-cost") {
        values = comparison.pricing.plans.map(plans => {
          const yearly = plans.flatMap(plan => plan.isFree ? [] : plan.prices)
            .filter(price => price.billing === "RECURRING" && price.yearlyEquivalent !== null)
            .sort((left, right) => left.yearlyEquivalent! - right.yearlyEquivalent!)[0];
          if (!yearly) return null;
          if (priceView === "month") return `${formatPrice(yearly.yearlyEquivalent! / 12, yearly.currency)}/month`;
          if (priceView === "year") return `${formatPrice(yearly.yearlyEquivalent!, yearly.currency)}/year`;
          return `${formatPrice(yearly.yearlyEquivalent!, yearly.currency)}/year`;
        });
      }
      const knownValues = values.filter(value => value !== null);
      const isDifferent = knownValues.length > 1 && knownValues.some(value => JSON.stringify(value) !== JSON.stringify(knownValues[0]));
      return { ...row, values, isDifferent };
    });
  }, [comparison, priceView]);
  const visiblePricingRows = pricingRows.filter(row => !showDifferencesOnly || row.isDifferent);
  const cheapestStartingTool = useMemo(() => {
    if (!comparison?.pricing.comparableCurrency) return -1;
    const candidates = comparison.pricing.plans.map((plans, index) => {
      const price = plans.flatMap(plan => plan.isFree ? [] : plan.prices)
        .filter(item => item.billing === "RECURRING" && item.amount !== null)
        .sort((left, right) => {
          const leftValue = priceView === "year" ? left.yearlyEquivalent : left.monthlyEquivalent;
          const rightValue = priceView === "year" ? right.yearlyEquivalent : right.monthlyEquivalent;
          return (leftValue ?? Number.POSITIVE_INFINITY) - (rightValue ?? Number.POSITIVE_INFINITY);
        })[0];
      const amount = priceView === "listed" ? price?.monthlyEquivalent : priceView === "month" ? price?.monthlyEquivalent : price?.yearlyEquivalent;
      return amount === null || amount === undefined ? null : { index, amount };
    }).filter((item): item is { index: number; amount: number } => item !== null);
    return candidates.sort((left, right) => left.amount - right.amount)[0]?.index ?? -1;
  }, [comparison, priceView]);
  const gridStyle = {
    "--compare-columns": `minmax(170px, 1fr) repeat(${Math.max(slugs.length, 2)}, minmax(185px, 1fr))`,
  } as CSSProperties;

  const renderValue = (
    value: CompareRow["values"][number],
    row: CompareRow,
  ) => {
    if (value === null) return <span className="compare-unknown">Unknown</span>;
    if (row.type === "boolean")
      return (
        <span
          className={value ? "compare-bool-yes" : "compare-bool-no"}
          aria-label={value ? "Yes" : "No"}
        >
          {value ? "✓" : "—"}
        </span>
      );
    return String(value);
  };

  return (
    <main className="compare-page">
      <div className="compare-page-heading">
        <div>
          <span className="compare-kicker">SIDE BY SIDE</span>
          <h1>Compare software</h1>
          <p>See the details that matter, all in one place.</p>
        </div>
      </div>
      <section
        className="compare-add-panel"
        aria-label="Add software to comparison"
      >
        <div>
          <h2>Add a tool</h2>
          <p>
            {slugs.length >= 4
              ? "You’ve reached the four-tool comparison limit."
              : "Search the directory to add another tool."}
          </p>
        </div>
        <div className="suggest-search-wrap">
          <form
            className="suggest-search"
            onSubmit={(event: FormEvent) => event.preventDefault()}
          >
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search software to compare..."
              aria-label="Search software to add"
            />
          </form>
          {searchError && (
            <small className="suggest-error">{searchError}</small>
          )}
          {search && suggestions.length > 0 && (
            <div className="suggestion-list" role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  className="suggestion-item"
                  key={suggestion.slug}
                  onClick={() => addSuggestion(suggestion)}
                  disabled={
                    slugs.includes(suggestion.slug) || slugs.length >= 4
                  }
                >
                  <SoftwareLogo software={suggestion} />
                  <span>{suggestion.name}</span>
                  <small>
                    {slugs.includes(suggestion.slug) ? "Added" : "Add"}
                  </small>
                </button>
              ))}
            </div>
          )}
          {search && !searchError && !suggestions.length && (
            <div className="suggestion-list suggestion-empty">
              No matching software
            </div>
          )}
        </div>
        {addingError && (
          <p className="compare-add-error" role="status">
            {addingError}
          </p>
        )}
      </section>

      {slugs.length < 2 && (
        <section className="compare-empty state-panel">
          <span className="empty-icon">⇄</span>
          <h2>Pick at least two tools to compare</h2>
          <p>
            Select software from the directory, or search above to add it here.
          </p>
          {slugs.length === 1 && (
            <div className="single-compare-tool">
              <span>{slugs[0]}</span>
              <button
                onClick={() => updateApps([])}
                aria-label={`Remove ${slugs[0]}`}
              >
                ×
              </button>
            </div>
          )}
        </section>
      )}
      {loading && (
        <div
          className="detail-skeleton compare-loading"
          aria-label="Loading comparison"
        />
      )}
      {error && (
        <section className="state-panel compare-error">
          <span className="empty-icon">!</span>
          <h2>Couldn’t compare these tools</h2>
          <p>{error}</p>
        </section>
      )}
      {comparison && (
        <>
          <div className="compare-controls">
            <label>
              <input
                type="checkbox"
                checked={showDifferencesOnly}
                onChange={(event) =>
                  setShowDifferencesOnly(event.target.checked)
                }
              />{" "}
              Show differences only
            </label>
            <span>{comparison.apps.length} tools selected</span>
          </div>
          <div className="pricing-compare-toolbar">
            <div><h2>Pricing</h2><p>{comparison.pricing.comparableCurrency ? "Prices shown in a comparable currency." : "Currencies differ; starting prices are not ranked across currencies."}</p></div>
            <label className="price-view-control"><span>Show prices</span><select value={priceView} onChange={event => setPriceView(event.target.value as PriceView)} aria-label="Pricing display basis"><option value="listed">As listed</option><option value="month">Per month</option><option value="year">Per year</option></select></label>
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table" style={gridStyle}>
              <thead>
                <tr>
                    <th className=" comparison-corner">
                        Features
                    </th>

                    {comparison.apps.map((app) => (
                        <th className="compare-app-content" key={app.slug}>
                            <div className="compare-app-heading">
                                <button
                                    className="compare-remove-app"
                                    aria-label={`Remove ${app.name}`}
                                    onClick={() =>
                                    updateApps(slugs.filter((slug) => slug !== app.slug))
                                    }
                                >
                                    ×
                                </button>
                                <SoftwareLogo software={app} large />
                                <strong>{app.name}</strong>
                                <span
                                    className={`pricing-badge pricing-${app.pricingType.toLowerCase()}`}
                                >
                                    {pricingLabel(app.pricingType)}
                                </span>
                                <a
                                    className="button button-primary compare-visit"
                                    href={app.affiliateUrl || app.websiteUrl || "#"}
                                    target="_blank"
                                    rel="sponsored noopener noreferrer"
                                    onClick={(event) => {
                                    if (!app.affiliateUrl && !app.websiteUrl)
                                        event.preventDefault();
                                    }}
                                >
                                    Visit site ↗
                                </a>
                            </div>
                        </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr className="comparison-group-row"><th className="comparison-sticky-col" colSpan={comparison.apps.length + 1}>Pricing</th></tr>
                <tr className="comparison-plan-row"><th className="comparison-sticky-col">Plans</th>{comparison.pricing.plans.map((plans, index) => <td key={comparison.apps[index].slug}><PlanComparison plans={plans} view={priceView} /></td>)}</tr>
                {visiblePricingRows.map(row => <tr className={row.isDifferent ? "is-different" : ""} key={`pricing-${row.slug}`}><th className="comparison-sticky-col">{row.label}</th>{row.values.map((value, index) => <td className={row.slug === "starting-price" && comparison.pricing.comparableCurrency && cheapestStartingTool === index ? "compare-cheapest-price" : ""} key={comparison.apps[index].slug}>{renderValue(value, row)}</td>)}</tr>)}
                {visibleBasics.length > 0 && (
                  <>
                    <tr className="comparison-group-row">
                      <th
                        className="comparison-sticky-col"
                        colSpan={comparison.apps.length + 1}
                      >
                        Basics
                      </th>
                    </tr>
                    {visibleBasics.map((row) => (
                      <tr
                        className={row.isDifferent ? "is-different" : ""}
                        key={row.slug}
                      >
                        <th className="comparison-sticky-col">{row.label}</th>
                        {row.values.map((value, index) => (
                          <td key={comparison.apps[index].slug}>
                            {renderValue(value, row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
                {visibleSections.map((section) => (
                  <Fragment key={section.title}>
                    <tr className="comparison-group-row">
                      <th
                        className="comparison-sticky-col"
                        colSpan={comparison.apps.length + 1}
                      >
                        {section.title}
                      </th>
                    </tr>
                    {section.rows.map((row) => (
                      <tr
                        className={row.isDifferent ? "is-different" : ""}
                        key={row.slug}
                      >
                        <th className="comparison-sticky-col">{row.label}</th>
                        {row.values.map((value, index) => (
                          <td key={comparison.apps[index].slug}>
                            {renderValue(value, row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {!visiblePricingRows.length && !visibleBasics.length && !visibleSections.length && (
                  <tr>
                    <td
                      className="comparison-no-differences"
                      colSpan={comparison.apps.length + 1}
                    >
                      No differences found in the available feature data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="compare-disclaimer">
            Feature data is compiled by us and may be out of date. Check the
            vendor&apos;s site for the latest details.
          </p>
        </>
      )}
      <div className="compare-back">
        <Link to="/">← Back to software directory</Link>
      </div>
    </main>
  );
}
