export function VisitSiteLink({
  url,
  className = "button button-primary",
  label = "Visit site",
}: {
  url: string | null | undefined;
  className?: string;
  label?: string;
}) {
  return (
    <a
      className={className}
      href={url || "#"}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={(event) => {
        if (!url) event.preventDefault();
      }}
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}
