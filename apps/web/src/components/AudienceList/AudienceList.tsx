import { Audience } from "../../types/software";
import "./AudienceList.css";

export function AudienceList({ audiences }: { audiences: Audience[] }) {
  if (!audiences.length) return null;
  return (
    <ul className="audience-list">
      {audiences.map((audience) => (
        <li key={audience.slug} className="audience-chip">
          {audience.name}
        </li>
      ))}
    </ul>
  );
}
