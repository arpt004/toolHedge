import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Software } from "../types/software";
import { pricingLabel, SoftwareLogo } from "./SoftwareCard";
import { getPricingDisplay } from "../utils/pricing";

export function SoftwareModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const [software, setSoftware] = useState<Software | null>(null);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
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
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="software-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <button
          className="modal-close"
          aria-label="Close preview"
          onClick={onClose}
          ref={closeRef}
        >
          ×
        </button>
        {software ? (
          <>
            <div className="modal-heading">
              <SoftwareLogo software={software} large />
              <div>
                <span
                  className={`pricing-badge pricing-${software.pricingType.toLowerCase()}`}
                >
                  {pricingLabel(software.pricingType)}
                </span>
                <h2 id="modal-title">{software.name}</h2>
                <p>{software.tagline}</p>
                {getPricingDisplay(software) && (
                  <p className="modal-price-line">
                    {getPricingDisplay(software)}
                    {software.pricingSummary?.hasFreeTrial && (
                      <span className="trial-badge">Free trial</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <p className="modal-description">{software.description}</p>
            <h3 className="section-label">Categories</h3>
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
            <h3 className="section-label metadata-section-label">Tags</h3>
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
            <h3 className="section-label">Available on</h3>
            <div className="platform-list modal-platforms">
              {software.platforms.map((platform) => (
                <span key={platform} className="platform-chip">
                  {platform}
                </span>
              ))}
            </div>
            {/* Future Like and Review controls belong here; intentionally not rendered in browse-only scope. */}
            <div className="modal-actions">
              <a
                className="button button-primary"
                href={software.affiliateUrl || software.websiteUrl || "#"}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={(event) => {
                  if (!software.affiliateUrl && !software.websiteUrl)
                    event.preventDefault();
                }}
              >
                Visit site <span aria-hidden="true">↗</span>
              </a>
              <Link
                className="button button-secondary"
                to={`/software/${software.slug}`}
              >
                More details
              </Link>
            </div>
          </>
        ) : error ? (
          <div className="modal-message">
            <span className="empty-icon">!</span>
            <h2 id="modal-title">Couldn’t load software</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div className="modal-message">
            <span className="spinner" />
            <p>Loading software…</p>
          </div>
        )}
      </div>
    </div>
  );
}
