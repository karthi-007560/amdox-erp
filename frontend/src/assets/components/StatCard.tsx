
import "./StatCard.css";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  description?: string;
};

export default function StatCard({
  title,
  value,
  change,
  description,
 
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
      </div>

      <div className="stat-card-value">{value}</div>

      <div className="stat-card-footer">
        {change && <span className="stat-card-change">{change}</span>}
        {description && (
          <span className="stat-card-description">{description}</span>
        )}
      </div>
    </article>
  );
}
