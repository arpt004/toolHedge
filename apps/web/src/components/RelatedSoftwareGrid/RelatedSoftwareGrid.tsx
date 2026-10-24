import { Link } from "react-router-dom";
import { SoftwareRelationship } from "../../types/software";
import { SoftwareLogo } from "../SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../PricingBadge/PricingBadge";
import "./RelatedSoftwareGrid.css";

export function RelatedSoftwareGrid({ items }: { items: SoftwareRelationship[] }) {
  if (!items.length) return null;
  return (
    <div className="related-grid">
      {items.map((item) => (
        <Link
          className="related-card"
          to={`/software/${item.software.slug}`}
          key={`${item.type}-${item.software.slug}`}
        >
          <SoftwareLogo software={item.software} />
          <div className="related-card-body">
            <div className="related-card-heading">
              <h3>{item.software.name}</h3>
              <PricingBadge pricingType={item.software.pricingType} />
            </div>
            <p>{item.software.tagline}</p>
            {item.reason && <small>{item.reason}</small>}
          </div>
        </Link>
      ))}
    </div>
  );
}
