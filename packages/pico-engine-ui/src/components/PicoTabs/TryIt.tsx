import * as React from "react";
import { apiGet, apiPost } from "../../api";
import { flushFailureMessage, installFailureMessage } from "../../installFlushErrors";
import { fetchMeshOAuthEnabled } from "../../oauthApi";
import picoPageStore from "../../stores/picoPageStore";
import { PicoBox } from "../../types/PicoBox";
import TabPageHeader from "../widgets/TabPageHeader";

/** A file in a demo's folder (GET /api/try-it). */
interface TryItFile {
  rid: string;
  file: string;
  url: string;
  path: string;
}

/** A runnable cookbook demo: one bootstrap ruleset (GET /api/try-it). */
interface TryItDemo {
  rid: string;
  name?: string;
  description?: string;
  folder: string;
  url: string;
  path: string;
  docs: string;
  /** What to look for and try (demos/<folder>/try-it.md). */
  notes?: string;
  files: TryItFile[];
}

/** What a bootstrap ruleset's tryIt() returns. */
interface TryItStatus {
  ready: boolean;
  stage?: string;
  links?: Array<{ label: string; url: string }>;
}

/** A child of this pico running a demo (it has a try_it channel). */
interface RunningDemo {
  uiEci: string;
  name: string;
  rid: string;
  status: TryItStatus | null;
  error?: string;
  /** Pathnames (/krl/demos/…) of the demo files installed on this child. */
  installedPaths: string[];
}

interface Props {
  pico: PicoBox;
  isTabActive?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `code` and **bold** in a line of try-it.md. */
function notesInline(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** try-it.md: paragraphs and "- " lists, with `code` and **bold**. Nothing else is interpreted. */
function TryItNotes({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="small try-it-notes">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*- /.test(line) || /^\s{2,}\S/.test(line))) {
          const items: string[] = [];
          for (const line of lines) {
            if (/^\s*- /.test(line)) items.push(line.replace(/^\s*- /, ""));
            else items[items.length - 1] += " " + line.trim();
          }
          return (
            <ul key={i}>
              {items.map((item, j) => (
                <li key={j}>{notesInline(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{notesInline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

async function runningDemoFor(
  childUiEci: string,
  demos: TryItDemo[]
): Promise<RunningDemo | null> {
  const info = await apiGet(`/c/${childUiEci}/query/io.picolabs.pico-engine-ui/pico`);
  const channel = ((info?.channels || []) as Array<{ id: string; tags: string[] }>).find(
    (c) => (c.tags || []).includes("try_it")
  );
  if (!channel) return null;
  const rulesets = (info?.rulesets || []) as Array<{ rid: string; url?: string }>;
  const rid = demos.map((d) => d.rid).find((r) => rulesets.some((rs) => rs.rid === r));
  if (!rid) return null;
  const installedPaths = rulesets
    .map((rs) => pathnameOf(rs.url || ""))
    .filter((p) => p.startsWith("/krl/demos/"));
  const box = await apiGet(`/c/${childUiEci}/query/io.picolabs.pico-engine-ui/box`);
  const name = box?.name || rid;
  try {
    const status = (await apiGet(`/c/${channel.id}/query/${rid}/tryIt`)) as TryItStatus;
    return { uiEci: childUiEci, name, rid, status, installedPaths };
  } catch (err) {
    return { uiEci: childUiEci, name, rid, status: null, error: String(err), installedPaths };
  }
}

function SourceFile({
  file,
  running,
  onFlush,
  flushing,
}: {
  file: TryItFile;
  running: RunningDemo[];
  onFlush: (demo: RunningDemo, file: TryItFile) => void;
  flushing: string | null;
}) {
  const [source, setSource] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function toggle() {
    if (!open && source === null) {
      const res = await fetch(file.url, { credentials: "include" });
      setSource(res.ok ? await res.text() : `Could not load ${file.url} (HTTP ${res.status})`);
    }
    setOpen(!open);
  }

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(file.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the path is selectable */
    }
  }

  const installedOn = running.filter((r) => r.installedPaths.includes(pathnameOf(file.url)));

  return (
    <li className="list-group-item">
      <div className="d-flex align-items-center flex-wrap">
        <strong className="text-mono mr-2">{file.rid}</strong>
        <button type="button" className="btn btn-link btn-sm p-0 mr-2" onClick={() => void toggle()}>
          {open ? "Hide source" : "View source"}
        </button>
        {installedOn.map((demo) => (
          <button
            key={demo.uiEci}
            type="button"
            className="btn btn-outline-primary btn-sm mr-1"
            disabled={!!flushing}
            onClick={() => onFlush(demo, file)}
            title={`Re-read ${file.file} and reload it on ${demo.name}`}
          >
            {flushing === demo.uiEci + file.url
              ? "Flushing…"
              : installedOn.length > 1
                ? `Flush on ${demo.name}`
                : "Flush"}
          </button>
        ))}
      </div>
      <div className="d-flex align-items-center mt-1">
        <code className="small text-break mr-2">{file.path}</code>
        <button type="button" className="btn btn-outline-secondary btn-sm py-0" onClick={() => void copyPath()}>
          {copied ? "Copied" : "Copy path"}
        </button>
      </div>
      {open ? <pre className="try-it-source mt-2 mb-0">{source}</pre> : null}
    </li>
  );
}

function DemoModal({
  demo,
  running,
  busy,
  log,
  flushing,
  flushNote,
  onRun,
  onRemove,
  onFlush,
  onClose,
}: {
  demo: TryItDemo;
  running: RunningDemo[];
  busy: string | null;
  log: string[];
  flushing: string | null;
  flushNote: string | null;
  onRun: () => void;
  onRemove: (demo: RunningDemo) => void;
  onFlush: (demo: RunningDemo, file: TryItFile) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const installed = new Set(running.flatMap((r) => r.installedPaths));
  const files = demo.files.filter(
    (f) => f.rid === demo.rid || installed.has(pathnameOf(f.url))
  );

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal card shadow try-it-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-it-title"
      >
        <div className="card-header d-flex align-items-center justify-content-between py-2">
          <h2 id="try-it-title" className="h5 mb-0">
            {demo.name || demo.rid}
          </h2>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="card-body">
          <p>
            {demo.description}{" "}
            <a href={demo.docs} target="_blank" rel="noreferrer">
              Read more in the cookbook
            </a>
          </p>
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!!busy}
              onClick={onRun}
            >
              {busy === demo.rid ? "Running…" : "Run in a new child pico"}
            </button>
          </div>
          {log.length ? (
            <ul className="small text-muted">
              {log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}

          <h3 className="h6">Running here</h3>
          {running.length === 0 ? (
            <p className="text-muted small">Not running in this pico's children yet.</p>
          ) : (
            <ul className="list-group mb-3">
              {running.map((r) => (
                <li className="list-group-item" key={r.uiEci}>
                  <div className="d-flex align-items-start">
                    <div className="flex-grow-1">
                      <strong>{r.name}</strong>{" "}
                      <span className={r.status?.ready ? "badge badge-success" : "badge badge-secondary"}>
                        {r.status?.ready ? "ready" : r.status?.stage || "starting"}
                      </span>
                      {r.error ? <div className="small text-danger">{r.error}</div> : null}
                      {(r.status?.links || []).map((link) => (
                        <div key={link.url}>
                          <a href={link.url} target="_blank" rel="noreferrer">
                            {link.label}
                          </a>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={!!busy}
                      onClick={() => onRemove(r)}
                    >
                      {busy === r.uiEci ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {demo.notes ? (
            <>
              <h3 className="h6">What to look for and try</h3>
              <TryItNotes text={demo.notes} />
            </>
          ) : null}

          <h3 className="h6">The code</h3>
          <p className="small">
            These rulesets ship with the engine. Change one: edit the file at the path shown,
            click <strong>Flush</strong> to reload it on the running demo, then reload the
            view or query it again to see what changed. To contribute a change, make it in a
            clone of the pico-engine repository and open a pull request.
            {running.length === 0
              ? " Run the demo to see the rulesets its bootstrap installs."
              : null}
          </p>
          {flushNote ? <div className="alert alert-info py-1 small">{flushNote}</div> : null}
          <ul className="list-group">
            {files.map((file) => (
              <SourceFile
                key={file.url}
                file={file}
                running={running}
                onFlush={onFlush}
                flushing={flushing}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TryIt({ pico, isTabActive = true }: Props) {
  const [demos, setDemos] = React.useState<TryItDemo[]>([]);
  const [running, setRunning] = React.useState<RunningDemo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [log, setLog] = React.useState<string[]>([]);
  const [openRid, setOpenRid] = React.useState<string | null>(null);
  const [flushing, setFlushing] = React.useState<string | null>(null);
  const [flushNote, setFlushNote] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = ((await apiGet("/api/try-it"))?.demos || []) as TryItDemo[];
      setDemos(list);
      const box = await apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/box`);
      const found: RunningDemo[] = [];
      for (const child of (box?.children || []) as string[]) {
        const demo = await runningDemoFor(child, list);
        if (demo) found.push(demo);
      }
      setRunning(found);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [pico.eci]);

  React.useEffect(() => {
    if (isTabActive) void refresh();
  }, [isTabActive, refresh]);

  const [meshOAuth, setMeshOAuth] = React.useState(false);
  React.useEffect(() => {
    if (isTabActive) void fetchMeshOAuthEnabled().then(setMeshOAuth);
  }, [isTabActive]);

  // While a demo is still setting up, check again every second.
  React.useEffect(() => {
    if (!isTabActive || !running.some((r) => !r.status?.ready)) return;
    const timer = setTimeout(() => void refresh(), 1000);
    return () => clearTimeout(timer);
  }, [isTabActive, running, refresh]);

  async function run(demo: TryItDemo) {
    const say = (line: string) => setLog((prev) => [...prev, line]);
    setBusy(demo.rid);
    setLog([]);
    setError(null);
    try {
      const before = new Set<string>(pico.children || []);
      const name = demo.name || demo.rid;
      await apiPost(
        `/c/${pico.eci}/event/engine_ui/new/query/io.picolabs.pico-engine-ui/box`,
        { name, backgroundColor: "#c8e6c9" }
      );
      let child: string | undefined;
      for (let i = 0; i < 50 && !child; i++) {
        const box = await apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/box`);
        child = ((box?.children || []) as string[]).find((c) => !before.has(c));
        if (!child) await sleep(200);
      }
      if (!child) throw new Error("The new child pico did not appear.");
      say(`Created child pico "${name}".`);
      const waitBody = await apiPost(`/c/${child}/event-wait/engine_ui/install`, {
        url: demo.url,
      });
      const failed = installFailureMessage(waitBody);
      if (failed) throw new Error(failed);
      say(`Installed ${demo.rid}. It sets up the rest of the demo.`);
      await picoPageStore.fetchAll();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(demo: RunningDemo) {
    setBusy(demo.uiEci);
    setError(null);
    try {
      await apiGet(`/c/${pico.eci}/event-wait/engine_ui/del?eci=${demo.uiEci}`);
      await picoPageStore.fetchAll();
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  async function flush(demo: RunningDemo, file: TryItFile) {
    setFlushing(demo.uiEci + file.url);
    setFlushNote(null);
    try {
      const body = await apiPost(`/c/${demo.uiEci}/event-wait/engine_ui/flush`, {
        url: file.url,
      });
      const failed = flushFailureMessage(body);
      setFlushNote(
        failed
          ? `${file.rid} did not compile: ${failed}`
          : `Flushed ${file.rid} on ${demo.name}. Reload its view to see the change.`
      );
      await refresh();
    } catch (err) {
      setFlushNote(String(err));
    } finally {
      setFlushing(null);
    }
  }

  const openDemo = demos.find((d) => d.rid === openRid) || null;

  return (
    <div>
      <TabPageHeader
        title="Try It!"
        waiting={loading}
        onRefresh={() => void refresh()}
        hint="Demos that ship with the engine. Open one to run it in a new child of this pico and read its code."
      />
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {meshOAuth ? (
        <div className="alert alert-warning small">
          OAuth is turned on for this engine's mesh. The demos still install, but their pages
          and <code>curl</code> examples call the pico without an access token, so they may not
          load their data. The demos work best on an engine without OAuth, such as one running
          on your own machine.
        </div>
      ) : null}
      {demos.length === 0 && !loading ? (
        <p className="text-muted">This engine ships no runnable demos.</p>
      ) : null}
      <div className="list-group">
        {demos.map((demo) => {
          const count = running.filter((r) => r.rid === demo.rid).length;
          return (
            <button
              type="button"
              key={demo.rid}
              className="list-group-item list-group-item-action"
              onClick={() => {
                setLog([]);
                setFlushNote(null);
                setOpenRid(demo.rid);
              }}
            >
              <div className="d-flex align-items-center">
                <strong className="flex-grow-1">{demo.name || demo.rid}</strong>
                {count ? <span className="badge badge-success">{count} running</span> : null}
              </div>
              <div className="small text-muted">{demo.description}</div>
            </button>
          );
        })}
      </div>
      {openDemo ? (
        <DemoModal
          demo={openDemo}
          running={running.filter((r) => r.rid === openDemo.rid)}
          busy={busy}
          log={log}
          flushing={flushing}
          flushNote={flushNote}
          onRun={() => void run(openDemo)}
          onRemove={(r) => void remove(r)}
          onFlush={(r, f) => void flush(r, f)}
          onClose={() => setOpenRid(null)}
        />
      ) : null}
    </div>
  );
}
