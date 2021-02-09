import * as React from "react";
import { PicoBox } from "../../types/PicoBox";
import { apiGet } from "../../api";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";

interface LogEntryGroup {
  txnId: string;
  time: string;
  header: string;
  entries: string[];
}

async function getLogs(eci: string): Promise<LogEntryGroup[]> {
  const results = await apiGet(
    `/c/${eci}/query/io.picolabs.pico-engine-ui/logs`
  );
  return results;
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
          onChange={(e) => setOpen(e.target.checked)}
          checked={open}
        />
        <label className="form-check-label" htmlFor={id}>
          <span className="text-mono">
            {group.time} - {group.header}
          </span>
        </label>
      </div>
      {open && (
        <div style={{ marginLeft: "2em" }}>
          {group.entries.map((entry: string, index) => {
            return <pre key={index}>{entry}</pre>;
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
    <div className="pico-logging-tab">
      <h3>Logging</h3>
      <ErrorStatus error={picoLogs.error} />
      {picoLogs.waiting && "Loading..."}

      {picoLogs.data.map((group) => {
        return <LogGroupUi key={group.txnId} group={group} />;
      })}
    </div>
  );
}
