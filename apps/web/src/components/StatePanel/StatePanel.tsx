import { ReactNode } from "react";
import "./StatePanel.css";

export function StatePanel({
  as = "section",
  className = "state-panel",
  icon,
  heading,
  headingTag = "h2",
  headingId,
  message,
  children,
}: {
  as?: "section" | "main" | "div";
  className?: string;
  icon?: ReactNode;
  heading: ReactNode;
  headingTag?: "h1" | "h2";
  headingId?: string;
  message?: ReactNode;
  children?: ReactNode;
}) {
  const Wrapper = as;
  const Heading = headingTag;
  return (
    <Wrapper className={className}>
      {icon && <span className="empty-icon">{icon}</span>}
      <Heading id={headingId}>{heading}</Heading>
      {message && <p>{message}</p>}
      {children}
    </Wrapper>
  );
}
