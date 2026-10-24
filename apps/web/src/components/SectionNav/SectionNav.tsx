import { useEffect, useState } from "react";
import "./SectionNav.css";

export interface SectionNavItem {
  id: string;
  label: string;
}

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-110px 0px -70% 0px", threshold: 0 },
    );
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="section-nav" aria-label="Page sections">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={item.id === activeId ? "section-nav-active" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
