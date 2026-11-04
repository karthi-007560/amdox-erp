
import type { ReactNode } from "react";
import "./SectionHeading.css";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export default function SectionHeading({
  title,
  subtitle,
  eyebrow,
  action,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div className="section-heading-copy">
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action && <div className="section-heading-action">{action}</div>}
    </div>
  );
}
