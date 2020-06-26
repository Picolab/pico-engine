import * as React from "react";
import { PicoBox } from "../../types/PicoBox";
import { apiGet } from "../../api";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";

interface LogEntry {
  txnId: string;
  time: Date;
  msg: string;
}

interface LogEntryGroup {
  txnId: string;
  time: Date;
  header: string;
  entries: LogEntry[];
}

function logDetailsToHuman(entry: any): string {
  if (entry.msg === "txnQueued") {
    if (entry.txn && entry.txn.kind === "query" && entry.txn.query) {
      const query = entry.txn.query;
      const args = query.args || {};
      delete args._headers;
      return `QUERY ${query.eci} ${query.rid}/${query.name} ${JSON.stringify(
        args
      )}`;
    }
    if (entry.txn && entry.txn.kind === "event" && entry.txn.event) {
      const event = entry.txn.event;
      const attrs = event.data?.attrs || {};
      delete attrs._headers;
      return `EVENT ${event.eci} ${event.domain}:${event.name} ${JSON.stringify(
        attrs
      )}`;
    }
  }
  const other = Object.assign({}, entry);
  delete other.time;
  delete other.level;
  delete other.msg;
  delete other.txnId;
  return JSON.stringify(other);
}

async function getLogs(eci: string): Promise<LogEntryGroup[]> {
  const results = await apiGet(`/c/${eci}/query/io.picolabs.next/logs`);
  const groupBy: { [txn: string]: LogEntryGroup } = {};
  for (const result of results) {
    if (!result.txnId) {
      continue;
    }

    const entry: LogEntry = {
      txnId: result.txnId,
      time: new Date(result.time),
      msg: ""
    };
    entry.msg = `${entry.time.toISOString().split("T")[1]} [${result.level}] ${
      result.msg
    } ${logDetailsToHuman(result)}`;

    if (!groupBy[entry.txnId]) {
      groupBy[entry.txnId] = {
        txnId: entry.txnId,
        time: entry.time,
        header: entry.txnId,
        entries: []
      };
    }
    if (groupBy[entry.txnId].time > entry.time) {
      groupBy[entry.txnId].time = entry.time;
    }
    groupBy[entry.txnId].entries.push(entry);
  }
  const groups = Object.values(groupBy);
  groups.sort((a, b) => {
    return b.time.getTime() - a.time.getTime();
  });
  return groups.map(group => {
    group.entries.sort((a, b) => {
      return a.time.getTime() - b.time.getTime();
    });
    const first = group.entries[0];
    if (first && / txnQueued /.test(first.msg)) {
      group.header = first.msg.split(" txnQueued ")[1];
    }
    return group;
  });
}

const LogGroupUi: React.FC<{ group: LogEntryGroup }> = ({ group }) => {
  const [open, setOpen] = React.useState<boolean>(false);
  const id = `log-check-${group.txnId}`;
  return (
    <div>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={id}
          onChange={e => setOpen(e.target.checked)}
          checked={open}
        />
        <label className="form-check-label" htmlFor={id}>
          <span className="text-mono">
            {group.time.toISOString()} - {group.header}
          </span>
        </label>
      </div>
      {open && (
        <div style={{ marginLeft: "2em" }}>
          {group.entries.map((entry: any, index) => {
            return <pre key={index}>{entry.msg}</pre>;
          })}
        </div>
      )}
    </div>
  );
};

interface Props {
  pico: PicoBox;
}

export default function Logging({ pico }: Props) {
  const picoLogs = useAsyncLoader<LogEntryGroup[]>([], () => getLogs(pico.eci));

  React.useEffect(() => {
    picoLogs.load();
  }, [pico.eci]);

  return (
    <div>
      <h3>Logging</h3>
      <ErrorStatus error={picoLogs.error} />
      {picoLogs.waiting && "Loading..."}

      {picoLogs.data.map(group => {
        return <LogGroupUi key={group.txnId} group={group} />;
      })}
    </div>
  );
}
