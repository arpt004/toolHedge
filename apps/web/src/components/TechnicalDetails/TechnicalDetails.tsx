import { Software } from "../../types/software";
import "./TechnicalDetails.css";

const linkLabels: Record<string, string> = {
  DOCS: "Documentation",
  DEMO: "Demo",
  SIGNUP: "Sign up",
  SUPPORT: "Support",
  PRIVACY: "Privacy policy",
  TOS: "Terms of service",
  API_DOCS: "API documentation",
  CHANGELOG: "Changelog",
};
const socialLabels: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  YOUTUBE: "YouTube",
  DISCORD: "Discord",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
};
const deploymentLabels: Record<string, string> = {
  CLOUD: "Cloud",
  ON_PREMISES: "On-premises",
  SELF_HOSTED: "Self-hosted",
  HYBRID: "Hybrid",
};

function humanizeKey(key: string) {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function formatAttributeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function TechnicalDetails({ software }: { software: Software }) {
  const resourceLinks = (software.links ?? []).filter((link) => link.type in linkLabels);
  const socialLinks = (software.links ?? []).filter((link) => link.type in socialLabels);
  const attributeEntries = Object.entries(software.categoryAttributes ?? {}).filter(
    ([, value]) => formatAttributeValue(value) !== null,
  );
  const facts: Array<{ label: string; value: string }> = [];
  if (software.deploymentOptions?.length)
    facts.push({
      label: "Deployment",
      value: software.deploymentOptions.map((option) => deploymentLabels[option] ?? option).join(", "),
    });
  if (software.supportedLanguages?.length)
    facts.push({ label: "Languages", value: software.supportedLanguages.join(", ") });
  if (software.supportedRegions?.length)
    facts.push({ label: "Regions", value: software.supportedRegions.join(", ") });
  if (software.isOpenSource) facts.push({ label: "Open source", value: "Yes" });
  if (software.licenseType) facts.push({ label: "License", value: software.licenseType });
  if (software.headquarters) facts.push({ label: "Headquarters", value: software.headquarters });
  if (software.lastVerifiedAt)
    facts.push({ label: "Last verified", value: formatDate(software.lastVerifiedAt) });
  if (software.lastMajorUpdateAt)
    facts.push({ label: "Last major update", value: formatDate(software.lastMajorUpdateAt) });
  if (software.launchDate) facts.push({ label: "Launched", value: formatDate(software.launchDate) });

  const hasAnything =
    facts.length > 0 ||
    attributeEntries.length > 0 ||
    resourceLinks.length > 0 ||
    socialLinks.length > 0 ||
    Boolean(software.company);

  if (!hasAnything) return null;

  return (
    <div className="tech-details">
      {(facts.length > 0 || attributeEntries.length > 0) && (
        <dl className="tech-fact-list">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
          {attributeEntries.map(([key, value]) => (
            <div key={key}>
              <dt>{humanizeKey(key)}</dt>
              <dd>{formatAttributeValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {software.company && (
        <div className="tech-company">
          <h3>{software.company.name}</h3>
          {software.company.description && <p>{software.company.description}</p>}
          <div className="tech-company-meta">
            {software.company.headquarters && <span>{software.company.headquarters}</span>}
            {software.company.foundedYear && <span>Founded {software.company.foundedYear}</span>}
            {software.company.websiteUrl && (
              <a href={software.company.websiteUrl} target="_blank" rel="noopener noreferrer">
                Company site ↗
              </a>
            )}
          </div>
        </div>
      )}
      {(resourceLinks.length > 0 || socialLinks.length > 0) && (
        <div className="tech-links">
          {resourceLinks.map((link) => (
            <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.type}>
              {link.label ?? linkLabels[link.type]} ↗
            </a>
          ))}
          {socialLinks.map((link) => (
            <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.type}>
              {link.label ?? socialLabels[link.type]} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
