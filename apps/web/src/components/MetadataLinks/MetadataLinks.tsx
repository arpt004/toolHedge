import { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./MetadataLinks.css";

export function MetadataLinks({
  items,
  param,
}: {
  items: Array<{ slug: string; label: ReactNode }>;
  param: "category" | "tag";
}) {
  return (
    <div className="metadata-links">
      {items.map((item) => (
        <Link
          key={item.slug}
          className="metadata-chip"
          to={`/?${param}=${encodeURIComponent(item.slug)}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
