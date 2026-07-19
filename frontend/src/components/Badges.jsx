export function StatusBadge({ status }) {
  const label = status.replace('_', ' ');
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return <span className={`priority-${priority}`}>{priority}</span>;
}
