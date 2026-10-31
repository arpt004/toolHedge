import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, DynamicFilterOption } from "../../api/client";
import { SoftwareCard } from "../../components/SoftwareCard/SoftwareCard";
import { FilterPanel } from "../../components/FilterPanel/FilterPanel";
import { StatePanel } from "../../components/StatePanel/StatePanel";
import { SITE_NAME, SITE_TAGLINE } from "../../config/site";
import { useDocumentSeo } from "../../hooks/seo";
import {
  Category,
  PricingType,
  Software,
  SoftwareList,
} from "../../types/software";
import "./BrowsePage.css";

const PAGE_SIZE = 12;
const pricingNames: Record<PricingType, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open source",
};
const parseValues = (value: string | null) =>
  value
    ? [
        ...new Set(
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : [];

export function BrowsePage({
  categories,
  category: pageCategory,
  onSelect,
  selectedSlugs,
  onToggleCompare,
}: {
  categories: Category[];
  category?: Category;
  onSelect: (software: Software) => void;
  selectedSlugs: string[];
  onToggleCompare: (software: Software) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "popular";
  const selectedCategories = pageCategory
    ? [pageCategory.slug]
    : parseValues(searchParams.get("category"));
  const pricing = parseValues(searchParams.get("pricing"));
  const platforms = parseValues(searchParams.get("platform"));
  const tags = parseValues(searchParams.get("tag"));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const attrs = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("attr_")) result[key.slice(5)] = value;
    }
    return result;
  }, [searchParams]);
  const attrsKey = JSON.stringify(attrs);
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilterOption[]>([]);
  const [items, setItems] = useState<Software[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<SoftwareList["facets"]>({
    categories: [],
    pricing: [],
    platforms: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const hasFilters = Boolean(
    query ||
    selectedCategories.length ||
    pricing.length ||
    platforms.length ||
    tags.length ||
    Object.keys(attrs).length,
  );

  useDocumentSeo({
    title: pageCategory
      ? `Best ${pageCategory.name} software | ${SITE_NAME}`
      : `Discover software | ${SITE_NAME}`,
    description: pageCategory?.description ?? SITE_TAGLINE,
  });

  useEffect(() => {
    let active = true;
    api
      .listFilters(selectedCategories[0])
      .then((result) => {
        if (active) setDynamicFilters(result);
      })
      .catch(() => {
        if (active) setDynamicFilters([]);
      });
    return () => {
      active = false;
    };
  }, [selectedCategories.join(",")]);

  useEffect(() => {
    let active = true;
    const isLoadMore = page > 1;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    setError("");
    api
      .listSoftware({
        q: query,
        sort,
        page,
        limit: PAGE_SIZE,
        category: selectedCategories,
        pricing,
        platform: platforms,
        tag: tags,
        attrs,
      })
      .then((result) => {
        if (!active) return;
        setItems((previous) =>
          isLoadMore ? [...previous, ...result.items] : result.items,
        );
        setTotal(result.total);
        setFacets(result.facets);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load software",
          );
          if (!isLoadMore) setItems([]);
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    query,
    sort,
    page,
    selectedCategories.join(","),
    pricing.join(","),
    platforms.join(","),
    tags.join(","),
    attrsKey,
    retryCount,
  ]);

  const updateParam = useCallback(
    (key: string, value: string | string[] | null, replace = false) => {
      const params = new URLSearchParams(location.search);
      if (value === null || value.length === 0) params.delete(key);
      else params.set(key, Array.isArray(value) ? value.join(",") : value);
      if (key !== "preview") params.delete("preview");
      if (key !== "page") params.delete("page");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const toggle = (key: string, current: string[], value: string) =>
    updateParam(
      key,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  const onPricingChange = (value: string) => toggle("pricing", pricing, value);
  const onPlatformChange = (value: string) =>
    toggle("platform", platforms, value);
  const onTagChange = (value: string) => toggle("tag", tags, value);
  const onAttrChange = (key: string, value: string | null) =>
    updateParam(`attr_${key}`, value);
  const clearFilters = () => {
    const params = new URLSearchParams(location.search);
    ["q", "category", "pricing", "platform", "tag", "page"].forEach((key) =>
      params.delete(key),
    );
    [...params.keys()].forEach((key) => {
      if (key.startsWith("attr_")) params.delete(key);
    });
    navigate({ pathname: "/", search: params.toString() });
    setDrawerOpen(false);
  };
  const chooseCategory = (slug: string | null) => {
    const params = new URLSearchParams(location.search);
    params.delete("page");
    if (slug) params.set("category", slug);
    else params.delete("category");
    navigate({ pathname: "/", search: params.toString() });
  };
  const categoryNames = new Map(
    categories.map((category) => [category.slug, category.name]),
  );
  const tagNames = new Map(facets.tags.map((tag) => [tag.slug, tag.name]));
  const activeFilters = useMemo(
    () => [
      ...selectedCategories.map((value) => ({
        key: "category",
        value,
        label: categoryNames.get(value) ?? value,
      })),
      ...pricing.map((value) => ({
        key: "pricing",
        value,
        label: pricingNames[value as PricingType] ?? value,
      })),
      ...platforms.map((value) => ({ key: "platform", value, label: value })),
      ...tags.map((value) => ({
        key: "tag",
        value,
        label: tagNames.get(value) ?? value,
      })),
    ],
    [
      selectedCategories.join(","),
      pricing.join(","),
      platforms.join(","),
      tags.join(","),
      categories,
      facets.tags,
    ],
  );
  const removeFilter = (key: string, value: string) => {
    if (pageCategory && key === "category") {
      navigate({ pathname: "/", search: location.search });
      return;
    }
    const values =
      key === "category"
        ? selectedCategories
        : key === "pricing"
          ? pricing
          : key === "platform"
            ? platforms
            : tags;
    updateParam(
      key,
      values.filter((item) => item !== value),
    );
  };

  return (
    <main className="main-content">
      <section className="hero">
        <div className="eyebrow">The smarter way to find software</div>
        <h1>
          Find your next
          <br />
          <span className="text-brand">favorite tool.</span>
        </h1>
        <p>{SITE_TAGLINE}</p>
      </section>
      <nav className="category-chips" aria-label="Software categories">
        <button
          className={
            !pageCategory && !selectedCategories.length
              ? "category-chip active"
              : "category-chip"
          }
          onClick={() => chooseCategory(null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            className={
              (pageCategory?.slug ?? selectedCategories[0]) === category.slug
                ? "category-chip active"
                : "category-chip"
            }
            onClick={() => chooseCategory(category.slug)}
          >
            <span>{category.icon}</span>
            {category.name}
            <small>
              {facets.categories.find((item) => item.slug === category.slug)
                ?.count ?? category.softwareCount}
            </small>
          </button>
        ))}
      </nav>
      {pageCategory && (
        <section className="category-intro">
          <span>{pageCategory.icon}</span>
          <div>
            <h2>{pageCategory.name} software</h2>
            <p>{pageCategory.description}</p>
          </div>
        </section>
      )}
      <div className="browse-layout">
        <FilterPanel
          facets={facets}
          categories={categories}
          pricing={pricing}
          platforms={platforms}
          tags={tags}
          onPricingChange={onPricingChange}
          onPlatformChange={onPlatformChange}
          onTagChange={onTagChange}
          dynamicFilters={dynamicFilters}
          attrValues={attrs}
          onAttrChange={onAttrChange}
        />
        <div className="browse-results">
          <div className="results-toolbar">
            <div>
              <h2>Explore software</h2>
              <p>
                {loading
                  ? "Finding useful tools…"
                  : `${total} ${total === 1 ? "tool" : "tools"} to explore`}
              </p>
            </div>
            <div className="toolbar-actions">
              {isMobile && (
                <button
                  className="button button-secondary mobile-filter-button"
                  onClick={() => setDrawerOpen(true)}
                >
                  ☷ Filters
                  {activeFilters.length > 0 && (
                    <span className="filter-count">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
              )}
              <label className="sort-control">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => updateParam("sort", event.target.value)}
                  aria-label="Sort software"
                >
                  <option value="popular">Most popular</option>
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className="active-filter-row" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <button
                  className="active-filter-chip"
                  key={`${filter.key}:${filter.value}`}
                  onClick={() => removeFilter(filter.key, filter.value)}
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button className="clear-filters" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
          {error && (
            <StatePanel icon="!" heading="We hit a snag">
              <small className="api-error-reason">{error}</small>
              <button
                className="button button-secondary"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try again
              </button>
            </StatePanel>
          )}
          {!error && loading && (
            <div className="software-grid">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="skeleton-card" key={index}>
                  <div className="skeleton-line skeleton-logo" />
                  <div className="skeleton-line skeleton-heading" />
                  <div className="skeleton-line skeleton-text" />
                  <div className="skeleton-line skeleton-chips" />
                </div>
              ))}
            </div>
          )}
          {!error && !loading && items.length > 0 && (
            <>
              <div className="software-grid">
                {items.map((software) => (
                  <SoftwareCard
                    key={software.id}
                    software={software}
                    onSelect={onSelect}
                    isCompared={selectedSlugs.includes(software.slug)}
                    onToggleCompare={onToggleCompare}
                  />
                ))}
              </div>
              {items.length < total && (
                <div className="load-more-wrap">
                  <button
                    className="button button-secondary"
                    disabled={loadingMore}
                    onClick={() => updateParam("page", String(page + 1))}
                  >
                    {loadingMore ? "Loading…" : "Load more software"}
                  </button>
                </div>
              )}
            </>
          )}
          {!error && !loading && !items.length && (
            <StatePanel
              icon="⌕"
              heading={
                hasFilters
                  ? "No tools match these filters"
                  : "No software found"
              }
              message={
                hasFilters
                  ? "Try removing a filter or start over to see more tools."
                  : "Try a different search term, or clear your search to explore all tools."
              }
            >
              {hasFilters && (
                <button
                  className="button button-secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </StatePanel>
          )}
        </div>
      </div>
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDrawerOpen(false);
          }}
        >
          <FilterPanel
            mobile
            facets={facets}
            categories={categories}
            pricing={pricing}
            platforms={platforms}
            tags={tags}
            onPricingChange={onPricingChange}
            onPlatformChange={onPlatformChange}
            onTagChange={onTagChange}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </main>
  );
}
