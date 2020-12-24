import * as React from "react";
import { apiGet, apiPost } from "../../api";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";

interface Props {
  pico: PicoBox;
}

interface Sub {
  Id: string;
  Rx: string;
  Tx: string;
}

const Subscriptions: React.FC<Props> = ({ pico }) => {
  const [established, setEstablished] = React.useState<Sub[]>([]);
  const [outbound, setOutbound] = React.useState<Sub[]>([]);
  const [inbound, setInbound] = React.useState<Sub[]>([]);
  const [expandedSubs, setExpandedSubs] = React.useState<{
    [eci: string]: boolean;
  }>({});

  const getEstablished = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/established`).then((resp) => {
      setEstablished(resp);
    });
  }

  const getInbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/inbound`).then((resp) => {
      setInbound(resp);
    });
  }

  const getOutbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/outbound`).then((resp) => {
      setOutbound(resp);
    });
  }

  React.useEffect(() => {
    getEstablished();
    getInbound();
    getOutbound();
  }, []);

  return (
    <div>
      <h3>Subscriptions</h3>
      {established.length > 0 && <h5>Established</h5>}

      {established.map((sub) => {
        const isOpen = !!expandedSubs[sub.Id];
        return (
          <div key={sub.Id}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`sub-${sub.Id}`}
                onChange={(e) => {
                  const map = Object.assign({}, expandedSubs);
                  if (e.target.checked) {
                    map[sub.Id] = true;
                  } else {
                    delete map[sub.Id];
                  }
                  setExpandedSubs(map);
                }}
                checked={isOpen}
              />
              <label
                className="form-check-label"
                htmlFor={`sub-${sub.Id}`}
              >
                <span className="text-mono">{sub.Id}</span>
              </label>
            </div>
            { isOpen  &&
              <div className="ml-3">
                <pre>{JSON.stringify(sub, null, 2)}</pre>
              </div>
            }
          </div>
        );
      })}

    </div>
  );
};

export default Subscriptions;
