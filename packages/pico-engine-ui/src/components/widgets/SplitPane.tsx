import * as React from "react";

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  /** Persist width in localStorage */
  storageKey?: string;
  defaultLeftRatio?: number;
  minPanePx?: number;
}

/** Handle flex basis (12px) + horizontal margins (10px each side). */
const HANDLE_SLOT_PX = 32;

const SplitPane: React.FC<Props> = ({
  left,
  right,
  storageKey,
  defaultLeftRatio = 0.5,
  minPanePx = 180,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [leftPx, setLeftPx] = React.useState<number | null>(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {
      /* ignore */
    }
    return null;
  });
  const [dragging, setDragging] = React.useState(false);
  const leftPxRef = React.useRef(leftPx);
  React.useEffect(() => {
    leftPxRef.current = leftPx;
  }, [leftPx]);

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxLeft = rect.width - HANDLE_SLOT_PX - minPanePx;
      const next = Math.min(
        maxLeft,
        Math.max(minPanePx, e.clientX - rect.left)
      );
      leftPxRef.current = next;
      setLeftPx(next);
    };
    const onUp = () => {
      setDragging(false);
      if (storageKey && leftPxRef.current != null) {
        try {
          localStorage.setItem(
            storageKey,
            String(Math.round(leftPxRef.current))
          );
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, minPanePx, storageKey]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || leftPx == null) return;
    const clamp = () => {
      const rect = el.getBoundingClientRect();
      const maxLeft = rect.width - HANDLE_SLOT_PX - minPanePx;
      if (leftPxRef.current != null && leftPxRef.current > maxLeft) {
        const next = Math.max(minPanePx, maxLeft);
        leftPxRef.current = next;
        setLeftPx(next);
      }
    };
    const ro = new ResizeObserver(clamp);
    ro.observe(el);
    return () => ro.disconnect();
  }, [leftPx, minPanePx]);

  React.useEffect(() => {
    if (leftPx != null || !containerRef.current) return;
    const el = containerRef.current;
    const apply = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) {
        setLeftPx(
          Math.max(
            minPanePx,
            Math.min(w - HANDLE_SLOT_PX - minPanePx, w * defaultLeftRatio)
          )
        );
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [defaultLeftRatio, leftPx, minPanePx]);

  const leftStyle: React.CSSProperties =
    leftPx != null
      ? { width: leftPx, flexShrink: 0 }
      : { flex: 1, minWidth: minPanePx };

  const rightStyle: React.CSSProperties =
    leftPx != null
      ? { flex: 1, minWidth: minPanePx }
      : { flex: 1, minWidth: minPanePx };

  return (
    <div
      ref={containerRef}
      className={
        "split-pane d-flex align-items-stretch" +
        (dragging ? " split-pane-dragging" : "")
      }
    >
      <div className="split-pane-left overflow-auto" style={leftStyle}>
        {left}
      </div>
      <div
        className="split-pane-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize columns"
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
      />
      <div className="split-pane-right overflow-auto" style={rightStyle}>
        {right}
      </div>
    </div>
  );
};

export default SplitPane;
