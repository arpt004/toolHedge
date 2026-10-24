import { useState } from "react";
import "./ShareActions.css";

export function ShareActions({ name, tagline }: { name: string; tagline: string }) {
  const [status, setStatus] = useState("");

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: tagline, url });
      } catch {
        /* user cancelled share sheet */
      }
      return;
    }
    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Link copied");
    } catch {
      setStatus("Couldn't copy link");
    }
    window.setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="share-actions">
      <button className="button button-secondary" onClick={share} aria-label="Share this software">
        Share
      </button>
      <button className="button button-secondary" onClick={copyLink} aria-label="Copy link to this page">
        Copy link
      </button>
      <span className="share-status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
