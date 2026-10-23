import "./PlatformList.css";

export function PlatformList({
  platforms,
  limit,
  className,
}: {
  platforms: string[];
  limit?: number;
  className?: string;
}) {
  const visible = limit ? platforms.slice(0, limit) : platforms;
  const remaining = limit ? platforms.length - limit : 0;
  return (
    <div className={className ? `platform-list ${className}` : "platform-list"}>
      {visible.map((platform) => (
        <span key={platform} className="platform-chip">
          {platform}
        </span>
      ))}
      {remaining > 0 && (
        <span className="platform-chip">+{remaining}</span>
      )}
    </div>
  );
}
