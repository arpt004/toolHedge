import { useMemo, useState } from "react";
import { DynamicFilterOption } from "../../api/client";
import { Category, PricingType, SoftwareList } from "../../types/software";
import "./FilterPanel.css";

type Facets = SoftwareList["facets"];
const PRICING: Array<{ value: PricingType; label: string }> = [
  { value: "FREE", label: "Free" },
  { value: "FREEMIUM", label: "Freemium" },
  { value: "PAID", label: "Paid" },
  { value: "OPEN_SOURCE", label: "Open source" },
];
const PLATFORMS = ["Web", "Windows", "Mac", "Linux", "iOS", "Android"];

interface FilterPanelProps {
  facets: Facets;
  categories: Category[];
  pricing: string[];
  platforms: string[];
  tags: string[];
  onPricingChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onTagChange: (value: string) => void;
  mobile?: boolean;
  onClose?: () => void;
  dynamicFilters?: DynamicFilterOption[];
  attrValues?: Record<string, string>;
  onAttrChange?: (key: string, value: string | null) => void;
}

export function FilterPanel({
  facets,
  categories,
  pricing,
  platforms,
  tags,
  onPricingChange,
  onPlatformChange,
  onTagChange,
  mobile = false,
  onClose,
  dynamicFilters = [],
  attrValues = {},
  onAttrChange,
}: FilterPanelProps) {
  const [tagSearch, setTagSearch] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const matchingTags = useMemo(
    () =>
      facets.tags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
      ),
    [facets.tags, tagSearch],
  );
  const visibleTags =
    showAllTags || tagSearch ? matchingTags : matchingTags.slice(0, 10);
  const categoryCounts = new Map(
    facets.categories.map((item) => [item.slug, item.count]),
  );
  const platformCounts = new Map(
    facets.platforms.map((item) => [item.value, item.count]),
  );
  const pricingCounts = new Map(
    facets.pricing.map((item) => [item.value, item.count]),
  );
  const tagCounts = new Map(facets.tags.map((item) => [item.slug, item.count]));
  const selectedTags = tags
    .filter((slug) => !facets.tags.some((tag) => tag.slug === slug))
    .map((slug) => ({
      slug,
      name: slug
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      count: 0,
    }));
  const displayedTags = [
    ...visibleTags,
    ...selectedTags.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
    ),
  ];

  return (
    <aside
      className={`${mobile ? "filter-drawer" : "filter-sidebar"}${mobile ? " is-open" : ""}`}
      aria-label="Software filters"
    >
      {mobile && (
        <div className="drawer-heading">
          <h2>Filters</h2>
          <button
            className="drawer-close"
            aria-label="Close filters"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      )}
      <section className="filter-section">
        <h3>Pricing</h3>
        {PRICING.map((option) => (
          <label
            className={`filter-option${(pricingCounts.get(option.value) ?? 0) === 0 ? " is-dimmed" : ""}`}
            key={option.value}
          >
            <input
              type="checkbox"
              checked={pricing.includes(option.value)}
              onChange={() => onPricingChange(option.value)}
            />
            <span>{option.label}</span>
            <small>{pricingCounts.get(option.value) ?? 0}</small>
          </label>
        ))}
      </section>
      <section className="filter-section">
        <h3>Platform</h3>
        {PLATFORMS.map((platform) => (
          <label
            className={`filter-option${(platformCounts.get(platform) ?? 0) === 0 ? " is-dimmed" : ""}`}
            key={platform}
          >
            <input
              type="checkbox"
              checked={platforms.includes(platform)}
              onChange={() => onPlatformChange(platform)}
            />
            <span>{platform}</span>
            <small>{platformCounts.get(platform) ?? 0}</small>
          </label>
        ))}
      </section>
      <section className="filter-section filter-tags">
        <h3>Tags</h3>
        <input
          className="tag-search"
          placeholder="Find a tag..."
          aria-label="Search tags"
          value={tagSearch}
          onChange={(event) => setTagSearch(event.target.value)}
        />
        {displayedTags.map((tag) => (
          <label
            className={`filter-option${(tagCounts.get(tag.slug) ?? 0) === 0 ? " is-dimmed" : ""}`}
            key={tag.slug}
          >
            <input
              type="checkbox"
              checked={tags.includes(tag.slug)}
              onChange={() => onTagChange(tag.slug)}
            />
            <span>{tag.name}</span>
            <small>{tagCounts.get(tag.slug) ?? 0}</small>
          </label>
        ))}
        {!tagSearch && matchingTags.length > 10 && (
          <button
            className="show-tags"
            onClick={() => setShowAllTags((value) => !value)}
          >
            {showAllTags ? "Show fewer" : "Show more tags"}
          </button>
        )}
        {!matchingTags.length && <p className="no-tags">No matching tags</p>}
      </section>
      {dynamicFilters.map((filter) => (
        <section className="filter-section" key={filter.key}>
          <h3>{filter.label}</h3>
          {filter.type === "RANGE" ? (
            <div className="filter-range">
              <input
                type="number"
                aria-label={`${filter.label} minimum`}
                placeholder={filter.range ? String(filter.range.min) : "Min"}
                value={attrValues[`${filter.key}_min`] ?? ""}
                onChange={(event) => onAttrChange?.(`${filter.key}_min`, event.target.value || null)}
              />
              <span>–</span>
              <input
                type="number"
                aria-label={`${filter.label} maximum`}
                placeholder={filter.range ? String(filter.range.max) : "Max"}
                value={attrValues[`${filter.key}_max`] ?? ""}
                onChange={(event) => onAttrChange?.(`${filter.key}_max`, event.target.value || null)}
              />
            </div>
          ) : filter.type === "BOOLEAN" ? (
            <label className="filter-option">
              <input
                type="checkbox"
                checked={attrValues[filter.key] === "true"}
                onChange={(event) => onAttrChange?.(filter.key, event.target.checked ? "true" : null)}
              />
              <span>Yes</span>
            </label>
          ) : (
            (filter.options ?? []).map((option) => {
              const current = (attrValues[filter.key] ?? "").split(",").filter(Boolean);
              const checked = current.includes(option.value);
              return (
                <label className="filter-option" key={option.value}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? current.filter((v) => v !== option.value)
                        : [...current, option.value];
                      onAttrChange?.(filter.key, next.length ? next.join(",") : null);
                    }}
                  />
                  <span>{option.label}</span>
                  {option.count !== undefined && <small>{option.count}</small>}
                </label>
              );
            })
          )}
        </section>
      ))}
      <span className="sr-only">{categories.length} categories available</span>
    </aside>
  );
}
