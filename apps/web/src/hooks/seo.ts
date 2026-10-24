import { useEffect } from "react";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useDocumentSeo({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  useEffect(() => {
    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", "website");
    const url = window.location.href;
    setMetaTag("property", "og:url", url);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description]);
}

const JSON_LD_ELEMENT_ID = "structured-data";

export function useJsonLd(data: Record<string, unknown> | null) {
  useEffect(() => {
    const existing = document.getElementById(JSON_LD_ELEMENT_ID);
    if (!data) {
      existing?.remove();
      return;
    }
    const script =
      (existing as HTMLScriptElement | null) ??
      (() => {
        const el = document.createElement("script");
        el.id = JSON_LD_ELEMENT_ID;
        el.type = "application/ld+json";
        document.head.appendChild(el);
        return el;
      })();
    script.textContent = JSON.stringify(data);
    return () => {
      script.remove();
    };
  }, [JSON.stringify(data)]);
}
