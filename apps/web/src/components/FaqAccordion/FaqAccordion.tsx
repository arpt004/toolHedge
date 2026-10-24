import { Faq } from "../../types/software";
import "./FaqAccordion.css";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <div className="faq-list">
      {faqs.map((faq, index) => (
        <details className="faq-item" key={index}>
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
