interface Props {
  title: string;
  waiting?: boolean;
  onRefresh: () => void;
  hint?: string;
  className?: string;
}

/** Tab title + reload control (matches Logging tab). */
export default function TabPageHeader({
  title,
  waiting = false,
  onRefresh,
  hint,
  className,
}: Props) {
  return (
    <div className={className}>
      <div className="d-flex align-items-center mb-2">
        <h3 className="mb-0 mr-2">{title}</h3>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={waiting}
          onClick={onRefresh}
        >
          {waiting ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {hint ? <p className="small text-muted mb-2">{hint}</p> : null}
    </div>
  );
}
