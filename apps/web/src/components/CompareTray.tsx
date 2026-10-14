import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Software } from "../types/software";
import { SoftwareLogo } from "./SoftwareCard";

export function CompareTray({
  selectedSlugs,
  onRemove,
  notice,
}: {
  selectedSlugs: string[];
  onRemove: (slug: string) => void;
  notice: string;
}) {
  const [selected, setSelected] = useState<Software[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all(
      selectedSlugs.map((slug) => api.getSoftware(slug).catch(() => null)),
    ).then((results) => {
      if (active)
        setSelected(results.filter((item): item is Software => item !== null));
    });
    return () => {
      active = false;
    };
  }, [selectedSlugs.join(",")]);

  if (!selectedSlugs.length) return null;
  const destination = `/compare?apps=${encodeURIComponent(selectedSlugs.join(","))}`;
  return (
    <aside
      className="compare-tray"
      aria-label="Selected software for comparison"
    >
      <div className="compare-tray-items">
        {selected.map((software) => (
          <div className="tray-tool" key={software.slug}>
            <SoftwareLogo software={software} />
            <span>{software.name}</span>
            <button
              aria-label={`Remove ${software.name} from comparison`}
              onClick={() => onRemove(software.slug)}
            >
              ×
            </button>
          </div>
        ))}
        <span className="tray-counter">
          {selectedSlugs.length} / 4 selected
        </span>
      </div>
      <div className="compare-tray-action">
        {notice && (
          <span className="tray-notice" role="status">
            {notice}
          </span>
        )}
        <Link
          className="button button-primary"
          aria-disabled={selectedSlugs.length < 2}
          to={selectedSlugs.length >= 2 ? destination : "#"}
          onClick={(event) => {
            if (selectedSlugs.length < 2) event.preventDefault();
          }}
        >
          Compare tools
        </Link>
      </div>
    </aside>
  );
}
