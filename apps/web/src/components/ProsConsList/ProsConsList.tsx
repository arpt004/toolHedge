import { ProCon } from "../../types/software";
import "./ProsConsList.css";

export function ProsConsList({ items }: { items: ProCon[] }) {
  const pros = items.filter((item) => item.type === "PRO");
  const cons = items.filter((item) => item.type === "CON");
  if (!pros.length && !cons.length) return null;
  return (
    <div className="pros-cons-grid">
      {pros.length > 0 && (
        <div className="pros-cons-column pros-column">
          <h3>Pros</h3>
          <ul>
            {pros.map((item, index) => (
              <li key={index}>
                <span>{item.description}</span>
                {item.category && <small>{item.category}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {cons.length > 0 && (
        <div className="pros-cons-column cons-column">
          <h3>Cons</h3>
          <ul>
            {cons.map((item, index) => (
              <li key={index}>
                <span>{item.description}</span>
                {item.category && <small>{item.category}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
