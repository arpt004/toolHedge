import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { SITE_NAME, SITE_TAGLINE } from "../../config/site";
import { Software } from "../../types/software";
import { useDocumentSeo, useJsonLd } from "../../hooks/seo";
import { SoftwareLogo } from "../../components/SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../../components/PricingBadge/PricingBadge";
import { PlatformList } from "../../components/PlatformList/PlatformList";
import { MetadataLinks } from "../../components/MetadataLinks/MetadataLinks";
import { VisitSiteLink } from "../../components/VisitSiteLink/VisitSiteLink";
import { StatePanel } from "../../components/StatePanel/StatePanel";
import { PricingPlans } from "../../components/PricingPlans/PricingPlans";
import { RatingSummary } from "../../components/RatingSummary/RatingSummary";
import { KeyTakeaways } from "../../components/KeyTakeaways/KeyTakeaways";
import { AudienceList } from "../../components/AudienceList/AudienceList";
import { CapabilityList } from "../../components/CapabilityList/CapabilityList";
import { ProsConsList } from "../../components/ProsConsList/ProsConsList";
import { UseCaseList } from "../../components/UseCaseList/UseCaseList";
import { FaqAccordion } from "../../components/FaqAccordion/FaqAccordion";
import { ReviewList } from "../../components/ReviewList/ReviewList";
import { RelatedSoftwareGrid } from "../../components/RelatedSoftwareGrid/RelatedSoftwareGrid";
import { PlanRecommendationList } from "../../components/PlanRecommendationList/PlanRecommendationList";
import { TechnicalDetails } from "../../components/TechnicalDetails/TechnicalDetails";
import { SectionNav } from "../../components/SectionNav/SectionNav";
import { ShareActions } from "../../components/ShareActions/ShareActions";
import "./SoftwareDetailsPage.css";

const linkTypeLabel: Record<string, string> = { DEMO: "View demo", SIGNUP: "Sign up free" };

function buildJsonLd(software: Software) {
  const applicationCategory = software.categories[0]?.name;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: software.name,
    description: software.description,
    url: window.location.href,
    ...(applicationCategory ? { applicationCategory } : {}),
  };
  if (software.pricingSummary?.startingPrice) {
    data.offers = {
      "@type": "Offer",
      price: software.pricingSummary.startingPrice.amount,
      priceCurrency: software.pricingSummary.startingPrice.currency,
    };
  }
  if (software.reviewSummary && software.reviewSummary.count > 0 && software.reviewSummary.average) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: software.reviewSummary.average,
      reviewCount: software.reviewSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (software.company) {
    data.publisher = { "@type": "Organization", name: software.company.name };
  }
  return data;
}

export function SoftwareDetailsPage({
  selectedSlugs,
  onToggleCompare,
}: {
  selectedSlugs: string[];
  onToggleCompare: (software: Software) => void;
}) {
  const { slug = "" } = useParams();
  const [software, setSoftware] = useState<Software | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSoftware(null);
    setError("");
    api
      .getSoftware(slug)
      .then((item) => {
        if (active) setSoftware(item);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : "Software not found",
          );
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useDocumentSeo({
    title: software ? `${software.name} | ${SITE_NAME}` : `Software details | ${SITE_NAME}`,
    description: software?.tagline ?? SITE_TAGLINE,
  });
  useJsonLd(software ? buildJsonLd(software) : null);

  const relationships = software?.relationships ?? [];
  const alternatives = useMemo(
    () => relationships.filter((item) => ["ALTERNATIVE", "COMPETITOR", "REPLACEMENT"].includes(item.type)),
    [relationships],
  );
  const similar = useMemo(() => relationships.filter((item) => item.type === "SIMILAR"), [relationships]);
  const stackFit = useMemo(
    () => relationships.filter((item) => ["COMPLEMENTARY", "INTEGRATION", "PREREQUISITE"].includes(item.type)),
    [relationships],
  );

  const sections = useMemo(() => {
    if (!software) return [];
    const hasTakeaway = Boolean(
      software.takeaway && Object.values(software.takeaway).some((value) => Boolean(value)),
    );
    const hasDetails = Boolean(
      software.company ||
        (software.links?.length ?? 0) > 0 ||
        (software.deploymentOptions?.length ?? 0) > 0 ||
        (software.supportedLanguages?.length ?? 0) > 0 ||
        (software.supportedRegions?.length ?? 0) > 0 ||
        software.licenseType ||
        software.isOpenSource ||
        software.lastVerifiedAt ||
        Object.keys(software.categoryAttributes ?? {}).length > 0,
    );
    return [
      {
        id: "ratings",
        label: "Ratings",
        content:
          (software.ratings?.length ?? 0) > 0 || (software.reviewSummary?.count ?? 0) > 0 ? (
            <RatingSummary ratings={software.ratings ?? []} reviewSummary={software.reviewSummary} />
          ) : null,
      },
      {
        id: "takeaways",
        label: "Key takeaways",
        content: hasTakeaway && software.takeaway ? <KeyTakeaways takeaway={software.takeaway} /> : null,
      },
      {
        id: "overview",
        label: "Overview",
        content: (
          <div className="detail-overview">
            <p>{software.description}</p>
            {software.overview && <p>{software.overview}</p>}
            {software.howItWorks && (
              <p>
                <strong>How it works: </strong>
                {software.howItWorks}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "audience",
        label: "Who's it for",
        content: (software.audiences?.length ?? 0) > 0 ? (
          <AudienceList audiences={software.audiences ?? []} />
        ) : null,
      },
      {
        id: "features",
        label: "Key features",
        content: (software.capabilities?.length ?? 0) > 0 ? (
          <CapabilityList capabilities={software.capabilities ?? []} />
        ) : null,
      },
      {
        id: "pricing",
        label: "Pricing",
        content: <PricingPlans software={software} />,
        skipWrapper: true,
      },
      {
        id: "plan-pick",
        label: "Which plan to pick",
        content: (software.planRecommendations?.length ?? 0) > 0 ? (
          <PlanRecommendationList recommendations={software.planRecommendations ?? []} />
        ) : null,
      },
      {
        id: "use-cases",
        label: "Use cases",
        content: (software.useCases?.length ?? 0) > 0 ? (
          <UseCaseList useCases={software.useCases ?? []} />
        ) : null,
      },
      {
        id: "stack-fit",
        label: "Fits your stack",
        content: stackFit.length > 0 ? <RelatedSoftwareGrid items={stackFit} /> : null,
      },
      {
        id: "pros-cons",
        label: "Pros & cons",
        content: (software.prosCons?.length ?? 0) > 0 ? (
          <ProsConsList items={software.prosCons ?? []} />
        ) : null,
      },
      {
        id: "reviews",
        label: "Reviews",
        content: (software.reviewSummary?.count ?? 0) > 0 ? <ReviewList slug={software.slug} /> : null,
      },
      {
        id: "alternatives",
        label: "Alternatives",
        content: alternatives.length > 0 ? <RelatedSoftwareGrid items={alternatives} /> : null,
      },
      {
        id: "similar",
        label: "Similar tools",
        content: similar.length > 0 ? <RelatedSoftwareGrid items={similar} /> : null,
      },
      {
        id: "faqs",
        label: "FAQs",
        content: (software.faqs?.length ?? 0) > 0 ? <FaqAccordion faqs={software.faqs ?? []} /> : null,
      },
      {
        id: "details",
        label: "Details",
        content: hasDetails ? <TechnicalDetails software={software} /> : null,
      },
    ];
  }, [software, alternatives, similar, stackFit]);
  const visibleSections = sections.filter((section) => section.content !== null);

  if (error)
    return (
      <main className="detail-wrap">
        <Link className="back-link" to="/">
          ← Back to software
        </Link>
        <StatePanel
          className="state-panel detail-error"
          icon="!"
          headingTag="h1"
          heading="We couldn’t find that software"
          message="It may have moved, or the link may be incorrect."
        >
          <Link className="button button-primary" to="/">
            Browse software
          </Link>
        </StatePanel>
      </main>
    );
  if (!software)
    return (
      <main className="detail-wrap">
        <div
          className="detail-skeleton"
          aria-label="Loading software details"
        />
      </main>
    );
  const visitUrl = software.affiliateUrl || software.websiteUrl;
  const demoOrSignup = (software.links ?? []).find((link) => link.type === "DEMO" || link.type === "SIGNUP");
  const isCompared = selectedSlugs.includes(software.slug);
  const primaryCategory = software.categories[0];

  return (
    <main className="detail-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        {primaryCategory && (
          <>
            <Link to={`/category/${primaryCategory.slug}`}>{primaryCategory.name}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{software.name}</span>
      </nav>
      <article className="detail-panel">
        <div className="detail-top">
          <SoftwareLogo software={software} large />
          <div className="detail-top-info">
            <div className="detail-top-badges">
              <PricingBadge pricingType={software.pricingType} />
              {software.status && software.status !== "ACTIVE" && (
                <span className="capability-badge">{software.status}</span>
              )}
            </div>
            <h1>{software.name}</h1>
            <p className="detail-tagline">{software.tagline}</p>
            {software.pricingSummary?.startingPrice && (
              <p className="detail-starting-price">
                From {software.pricingSummary.startingPrice.monthlyEquivalent}{" "}
                {software.pricingSummary.startingPrice.currency}/month
              </p>
            )}
          </div>
          <div className="detail-top-actions">
            <VisitSiteLink url={visitUrl} />
            {demoOrSignup && (
              <a
                className="button button-secondary"
                href={demoOrSignup.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {linkTypeLabel[demoOrSignup.type] ?? "Learn more"}
              </a>
            )}
            <button
              className="button button-secondary"
              onClick={() => onToggleCompare(software)}
              aria-pressed={isCompared}
            >
              {isCompared ? "✓ Added to compare" : "Add to compare"}
            </button>
            <ShareActions name={software.name} tagline={software.tagline} />
          </div>
        </div>
        <div className="detail-layout">
          <SectionNav items={visibleSections.map(({ id, label }) => ({ id, label }))} />
          <div className="detail-content">
            <section>
              <h2>Categories</h2>
              <MetadataLinks
                param="category"
                items={software.categories.map((category) => ({
                  slug: category.slug,
                  label: `${category.icon} ${category.name}`,
                }))}
              />
            </section>
            <section>
              <h2>Tags</h2>
              <MetadataLinks
                param="tag"
                items={software.tags.map((tag) => ({
                  slug: tag.slug,
                  label: `#${tag.name}`,
                }))}
              />
            </section>
            <section>
              <h2>Available on</h2>
              <PlatformList platforms={software.platforms} />
            </section>
            {visibleSections.map((section) =>
              section.skipWrapper ? (
                <div key={section.id} id={section.id} className="detail-section-anchor">
                  {section.content}
                </div>
              ) : (
                <section key={section.id} id={section.id}>
                  <h2>{section.label}</h2>
                  {section.content}
                </section>
              ),
            )}
          </div>
        </div>
        <div className="detail-actions">
          <Link className="button button-secondary" to="/">
            Browse more software
          </Link>
        </div>
      </article>
    </main>
  );
}
