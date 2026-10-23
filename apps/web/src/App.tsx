import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "./api/client";
import { Footer } from "./components/Footer";
import { ComparePage } from "./components/ComparePage";
import { CompareTray } from "./components/CompareTray";
import { FilterPanel } from "./components/FilterPanel";
import { Header } from "./components/Header";
import { SoftwareCard } from "./components/SoftwareCard";
import { SoftwareDetailsPage } from "./components/SoftwareDetailsPage";
import { SoftwareModal } from "./components/SoftwareModal";
import { SITE_NAME, SITE_TAGLINE } from "./config/site";
import {
  Category,
  PricingType,
  Software,
  SoftwareList,
} from "./types/software";

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

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", description);
}

function BrowsePage({
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
  const hasFilters = Boolean(
    query ||
    selectedCategories.length ||
    pricing.length ||
    platforms.length ||
    tags.length,
  );

  useEffect(() => {
    setMeta(
      pageCategory
        ? `Best ${pageCategory.name} software | ${SITE_NAME}`
        : `Discover software | ${SITE_NAME}`,
      pageCategory?.description ?? SITE_TAGLINE,
    );
  }, [pageCategory]);

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
  const clearFilters = () => {
    const params = new URLSearchParams(location.search);
    ["q", "category", "pricing", "platform", "tag", "page"].forEach((key) =>
      params.delete(key),
    );
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
        <div className="eyebrow">
          <span className="eyebrow-dot" /> A clearer way to choose
        </div>
        <h1>
          Find your next
          <br />
          <span className="text-hedge">favorite tool.</span>
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
              <button
                className="button button-secondary mobile-filter-button"
                onClick={() => setDrawerOpen(true)}
              >
                ☷ Filters
                {activeFilters.length > 0 && (
                  <span className="filter-count">{activeFilters.length}</span>
                )}
              </button>
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
            <section className="state-panel">
              <span className="empty-icon">!</span>
              <h2>We hit a snag</h2>
              <small className="api-error-reason">{error}</small>
              <button
                className="button button-secondary"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try again
              </button>
            </section>
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
            <section className="state-panel">
              <span className="empty-icon">⌕</span>
              <h2>
                {hasFilters
                  ? "No tools match these filters"
                  : "No software found"}
              </h2>
              <p>
                {hasFilters
                  ? "Try removing a filter or start over to see more tools."
                  : "Try a different search term, or clear your search to explore all tools."}
              </p>
              {hasFilters && (
                <button
                  className="button button-secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </section>
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

function CategoryRoute({
  categories,
  onSelect,
  selectedSlugs,
  onToggleCompare,
}: {
  categories: Category[];
  onSelect: (software: Software) => void;
  selectedSlugs: string[];
  onToggleCompare: (software: Software) => void;
}) {
  const { slug = "" } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    setCategory(null);
    setMissing(false);
    api
      .getCategory(slug)
      .then((value) => {
        if (active) setCategory(value);
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  if (missing)
    return (
      <main className="detail-wrap">
        <section className="state-panel">
          <h1>Category not found</h1>
          <Link className="button button-primary" to="/">
            Browse software
          </Link>
        </section>
      </main>
    );
  if (!category)
    return (
      <main className="detail-wrap">
        <div className="detail-skeleton" />
      </main>
    );
  return (
    <BrowsePage
      categories={categories}
      category={category}
      onSelect={onSelect}
      selectedSlugs={selectedSlugs}
      onToggleCompare={onToggleCompare}
    />
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const preview =
    location.pathname === "/" ? searchParams.get("preview") : null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        window.localStorage.getItem("toolhedge.compare") ?? "[]",
      );
      return Array.isArray(saved)
        ? [
            ...new Set(
              saved.filter(
                (slug): slug is string =>
                  typeof slug === "string" &&
                  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
              ),
            ),
          ].slice(0, 4)
        : [];
    } catch {
      return [];
    }
  });
  const [compareNotice, setCompareNotice] = useState("");
  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "toolhedge.compare",
        JSON.stringify(selectedSlugs),
      );
    } catch {
      /* Local persistence is optional. */
    }
  }, [selectedSlugs]);
  useEffect(() => {
    if (!searchParams.get("sort")) {
      const params = new URLSearchParams(searchParams);
      params.set("sort", "popular");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      );
    }
  }, [location.pathname, navigate, searchParams]);

  const updateQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      params.delete("preview");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      );
    },
    [location.pathname, navigate],
  );
  const openPreview = (software: Software) => {
    const params = new URLSearchParams(window.location.search);
    params.set("preview", software.slug);
    navigate({ pathname: "/", search: params.toString() });
  };
  const syncSelection = useCallback((slugs: string[]) => {
    setSelectedSlugs([...new Set(slugs)].slice(0, 4));
  }, []);
  const removeFromCompare = useCallback((slug: string) => {
    setSelectedSlugs((current) => current.filter((item) => item !== slug));
    setCompareNotice("");
  }, []);
  const toggleCompare = useCallback((software: Software) => {
    setSelectedSlugs((current) => {
      if (current.includes(software.slug))
        return current.filter((slug) => slug !== software.slug);
      if (current.length >= 4) {
        setCompareNotice("You can compare up to four tools at a time.");
        return current;
      }
      setCompareNotice("");
      return [...current, software.slug];
    });
  }, []);
  const closePreview = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("preview");
    navigate({ pathname: "/", search: params.toString() }, { replace: true });
  }, [navigate]);

  return (
    <div className="app-shell">
      <Header
        query={query}
        onQueryChange={updateQuery}
        selectedSlugs={selectedSlugs}
      />
      <Routes>
        <Route
          path="/"
          element={
            <BrowsePage
              categories={categories}
              onSelect={openPreview}
              selectedSlugs={selectedSlugs}
              onToggleCompare={toggleCompare}
            />
          }
        />
        <Route
          path="/category/:slug"
          element={
            <CategoryRoute
              categories={categories}
              onSelect={openPreview}
              selectedSlugs={selectedSlugs}
              onToggleCompare={toggleCompare}
            />
          }
        />
        <Route
          path="/compare"
          element={<ComparePage onSelectionChange={syncSelection} />}
        />
        <Route path="/software/:slug" element={<SoftwareDetailsPage />} />
        <Route
          path="*"
          element={
            <main className="state-panel route-not-found">
              <h1>Page not found</h1>
              <Link className="button button-primary" to="/">
                Explore software
              </Link>
            </main>
          }
        />
      </Routes>
      <Footer />
      {preview && location.pathname === "/" && (
        <SoftwareModal key={preview} slug={preview} onClose={closePreview} />
      )}
      {location.pathname !== "/compare" && (
        <CompareTray
          selectedSlugs={selectedSlugs}
          onRemove={removeFromCompare}
          notice={compareNotice}
        />
      )}
      {/* Future Login/Signup navigation slot intentionally renders nothing. */}
    </div>
  );
}
