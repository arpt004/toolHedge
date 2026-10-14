import { SITE_NAME } from "../config/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <span className="footer-brand">{SITE_NAME}</span>
        <span> — software discovery, made simpler.</span>
      </div>
      <p>
        Some links are affiliate links. We may earn a commission at no extra
        cost to you.
      </p>
    </footer>
  );
}
