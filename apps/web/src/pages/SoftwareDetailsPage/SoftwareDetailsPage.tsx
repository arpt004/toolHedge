import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { SITE_NAME, SITE_TAGLINE } from "../../config/site";
import { Software } from "../../types/software";
import { SoftwareLogo } from "../../components/SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../../components/PricingBadge/PricingBadge";
import { PlatformList } from "../../components/PlatformList/PlatformList";
import { MetadataLinks } from "../../components/MetadataLinks/MetadataLinks";
import { VisitSiteLink } from "../../components/VisitSiteLink/VisitSiteLink";
import { StatePanel } from "../../components/StatePanel/StatePanel";
import { PricingPlans } from "../../components/PricingPlans/PricingPlans";
import "./SoftwareDetailsPage.css";

export function SoftwareDetailsPage() {
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
  useEffect(() => {
    const name = software?.name ?? "Software details";
    document.title = `${name} | ${SITE_NAME}`;
    const description = software?.tagline ?? SITE_TAGLINE;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [software]);

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
  return (
    <main className="detail-wrap">
      <Link className="back-link" to="/">
        ← Back to software
      </Link>
      <article className="detail-panel">
        <div className="detail-top">
          <SoftwareLogo software={software} large />
          <div>
            <PricingBadge pricingType={software.pricingType} />
            <h1>{software.name}</h1>
            <p className="detail-tagline">{software.tagline}</p>
          </div>
        </div>
        <div className="detail-content">
          <section>
            <h2>About {software.name}</h2>
            <p>{software.description}</p>
          </section>
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
          <PricingPlans software={software} />
          {/* Future Like and Review section; intentionally not rendered in browse-only scope. */}
          <div className="detail-actions">
            <VisitSiteLink url={visitUrl} />
            <Link className="button button-secondary" to="/">
              Browse more software
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
