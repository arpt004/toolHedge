import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Category, Software } from "../../types/software";
import { StatePanel } from "../../components/StatePanel/StatePanel";
import { BrowsePage } from "../BrowsePage/BrowsePage";

export function CategoryRoute({
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
        <StatePanel headingTag="h1" heading="Category not found">
          <Link className="button button-primary" to="/">
            Browse software
          </Link>
        </StatePanel>
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
