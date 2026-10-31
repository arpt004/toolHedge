import { useCallback, useEffect, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { api } from "./api/client";
import { AdminApp } from "./admin/AdminApp";
import { Footer } from "./components/Footer/Footer";
import { CompareTray } from "./components/CompareTray/CompareTray";
import { Header } from "./components/Header/Header";
import { StatePanel } from "./components/StatePanel/StatePanel";
import { SoftwareModal } from "./components/SoftwareModal/SoftwareModal";
import { BrowsePage } from "./pages/BrowsePage/BrowsePage";
import { CategoryRoute } from "./pages/CategoryRoute/CategoryRoute";
import { ComparePage } from "./pages/ComparePage/ComparePage";
import { SoftwareDetailsPage } from "./pages/SoftwareDetailsPage/SoftwareDetailsPage";
import { Category, Software } from "./types/software";
import "./App.css";

export default function App() {
  const location = useLocation();
  // The admin panel is a fully separate shell (its own nav, no public
  // Header/Footer/CompareTray) — short-circuit before any of that renders.
  if (location.pathname.startsWith("/admin")) {
    return <AdminApp />;
  }
  return <PublicApp />;
}

function PublicApp() {
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
        <Route
          path="/software/:slug"
          element={
            <SoftwareDetailsPage
              selectedSlugs={selectedSlugs}
              onToggleCompare={toggleCompare}
            />
          }
        />
        <Route
          path="*"
          element={
            <StatePanel
              as="main"
              className="state-panel route-not-found"
              headingTag="h1"
              heading="Page not found"
            >
              <Link className="button button-primary" to="/">
                Explore software
              </Link>
            </StatePanel>
          }
        />
      </Routes>
      <Footer />
      {preview && location.pathname === "/" && (
        <SoftwareModal
          key={preview}
          slug={preview}
          onClose={closePreview}
          isCompared={selectedSlugs.includes(preview)}
          onToggleCompare={toggleCompare}
        />
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
