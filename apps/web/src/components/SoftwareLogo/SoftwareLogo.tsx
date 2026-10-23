import { Software } from "../../types/software";
import "./SoftwareLogo.css";

export function SoftwareLogo({
  software,
  large = false,
}: {
  software: Pick<Software, "logoUrl" | "name">;
  large?: boolean;
}) {
  return software.logoUrl ? (
    <img
      className={`software-logo${large ? " software-logo-large" : ""}`}
      src={software.logoUrl}
      alt=""
    />
  ) : (
    <span
      className={`software-logo software-logo-fallback${large ? " software-logo-large" : ""}`}
      aria-hidden="true"
    >
      {software.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
