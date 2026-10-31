import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SITE_NAME, SITE_TAGLINE } from "../../config/site";
import "./Header.css";

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedSlugs?: string[];
}

export function Header({
  query,
  onQueryChange,
  selectedSlugs = [],
}: HeaderProps) {
  const [value, setValue] = useState(query);
  const location = useLocation();
  useEffect(() => setValue(query), [query]);
  useEffect(() => {
    const timer = window.setTimeout(() => onQueryChange(value), 300);
    return () => window.clearTimeout(timer);
  }, [value, location.pathname, onQueryChange]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onQueryChange(value);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label={`${SITE_NAME} home`}>
          <span className="wordmark-icon" aria-hidden="true">
            t
          </span>
          <span>{SITE_NAME}</span>
        </Link>
        <form className="search-form" role="search" onSubmit={submit}>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            aria-label="Search software"
            placeholder="Search software..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </form>
        <nav className="header-nav" aria-label="Main navigation">
          <Link
            className="header-compare-link"
            to={
              selectedSlugs.length
                ? `/compare?apps=${encodeURIComponent(selectedSlugs.join(","))}`
                : "/compare"
            }
          >
            Compare
            {selectedSlugs.length > 0 && <span>{selectedSlugs.length}</span>}
          </Link>
          <Link className="header-admin-link" to="/admin" aria-label="Admin login">
            Admin
          </Link>
        </nav>
      </div>
      <div className="header-mobile-tagline">{SITE_TAGLINE}</div>
    </header>
  );
}
