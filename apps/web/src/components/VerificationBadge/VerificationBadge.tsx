import "./VerificationBadge.css";

export function VerificationBadge({ verifiedAt }: { verifiedAt?: string | null }) {
  const title = verifiedAt
    ? `Verified software information — last checked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(verifiedAt))}`
    : "Verified software information";
  return (
    <span className="verification-badge" title={title}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M10 1.5 12.3 3l2.9-.4 1 2.7 2.5 1.5-.9 2.8.9 2.8-2.5 1.5-1 2.7-2.9-.4L10 18.5 7.7 17l-2.9.4-1-2.7-2.5-1.5.9-2.8-.9-2.8 2.5-1.5 1-2.7 2.9.4L10 1.5Z"
        />
        <path
          fill="white"
          d="m7.1 10.1 1.9 1.9 3.9-3.9"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fillOpacity="0"
        />
      </svg>
      <span className="sr-only">Verified software information</span>
    </span>
  );
}
