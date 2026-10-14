import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { SITE_NAME, SITE_TAGLINE } from "../config/site";
import { Software } from "../types/software";
import { pricingLabel, SoftwareLogo } from "./SoftwareCard";
import { PricingPlans } from "./PricingPlans";

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
        <section className="state-panel detail-error">
          <span className="empty-icon">!</span>
          <h1>We couldn’t find that software</h1>
          <p>It may have moved, or the link may be incorrect.</p>
          <Link className="button button-primary" to="/">
            Browse software
          </Link>
        </section>
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
            <span
              className={`pricing-badge pricing-${software.pricingType.toLowerCase()}`}
            >
              {pricingLabel(software.pricingType)}
            </span>
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
            <div className="metadata-links">
              {software.categories.map((category) => (
                <Link
                  key={category.slug}
                  className="metadata-chip"
                  to={`/?category=${encodeURIComponent(category.slug)}`}
                >
                  {category.icon} {category.name}
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2>Tags</h2>
            <div className="metadata-links">
              {software.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  className="metadata-chip"
                  to={`/?tag=${encodeURIComponent(tag.slug)}`}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2>Available on</h2>
            <div className="platform-list">
              {software.platforms.map((platform) => (
                <span key={platform} className="platform-chip">
                  {platform}
                </span>
              ))}
            </div>
          </section>
          <PricingPlans software={software} />
          {/* Future Like and Review section; intentionally not rendered in browse-only scope. */}
          <div className="detail-actions">
            <a
              className="button button-primary"
              href={visitUrl || "#"}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={(event) => {
                if (!visitUrl) event.preventDefault();
              }}
            >
              Visit site <span aria-hidden="true">↗</span>
            </a>
            <Link className="button button-secondary" to="/">
              Browse more software
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
