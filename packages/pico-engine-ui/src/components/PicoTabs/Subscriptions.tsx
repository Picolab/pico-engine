import * as React from "react";
import { apiGet, apiPost } from "../../api";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";

function getRefVal(ref: React.MutableRefObject<HTMLInputElement | null>) {
  return ref.current && ref.current.value;
}

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
  const [myWellKnown, setMyWellKnown] = React.useState<string>("");
  const [expandedSubs, setExpandedSubs] = React.useState<{
    [eci: string]: boolean;
  }>({});

  const wellKnown_Tx = React.useRef<HTMLInputElement | null>(null);
  const Rx_role = React.useRef<HTMLInputElement | null>(null);
  const Tx_role = React.useRef<HTMLInputElement | null>(null);
  const name = React.useRef<HTMLInputElement | null>(null);
  const channel_type = React.useRef<HTMLInputElement | null>(null);
  const Tx_host = React.useRef<HTMLInputElement | null>(null);
  const password = React.useRef<HTMLInputElement | null>(null);

  const getWellKnown = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/wellKnown_Rx`).then((resp) => {
      setMyWellKnown(resp.id);
    });
  }

  const getEstablished = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/established`).then((resp) => {
      setEstablished(resp);
      setExpandedSubs({});
    });
  }

  const getInbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/inbound`).then((resp) => {
      setInbound(resp);
      setExpandedSubs({});
    });
  }

  const getOutbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/outbound`).then((resp) => {
      setOutbound(resp);
      setExpandedSubs({});
    });
  }

  const cancelOutbound = (Id: string) => {
    apiPost(`/c/${pico.eci}/event/wrangler/outbound_cancellation`, { Id }).then(getOutbound);
  }

  const acceptInbound = (Id: string) => {
    apiPost(`/c/${pico.eci}/event/wrangler/pending_subscription_approval`, { Id }).then(() => {
      getInbound();
      getEstablished();
    });
  }

  const deleteSubscription = (Id: string) => {
    apiPost(`/c/${pico.eci}/event/wrangler/subscription_cancellation`, { Id }).then(getEstablished);
  }

  const newSubscription = (wellKnown_Tx: string, Rx_role: string | null, Tx_role: string | null, name: string | null, channel_type: string | null, Tx_host: string | null, password: string | null) => {
    apiPost(`/c/${pico.eci}/event/wrangler/subscription`, { wellKnown_Tx, Rx_role, Tx_role, name, channel_type, Tx_host, password }).then(getOutbound);
  }

  React.useEffect(() => {
    getWellKnown();
    getEstablished();
    getInbound();
    getOutbound();
  }, []);

  return (
    <div>
      <h4>Subscriptions - {myWellKnown}</h4>
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
                <button className="btn btn-outline-primary" onClick={() => {deleteSubscription(sub.Id)}}>Delete</button>
              </div>
            }
          </div>
        );
      })}

      {inbound.length > 0 && <h5>Inbound</h5>}
      {inbound.map((sub) => {
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
                <button className="btn btn-outline-primary" onClick={() => {
                  const map = Object.assign({}, expandedSubs);
                  setExpandedSubs(map);
                  acceptInbound(sub.Id);
                }}>Accept</button>
              </div>
            }
          </div>
        );
      })}

      {outbound.length > 0 && <h5>Outbound</h5>}
      {outbound.map((sub) => {
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
                <button className="btn btn-outline-primary" onClick={() => {cancelOutbound(sub.Id)}}>Delete</button>
              </div>
            }
          </div>
        );
      })}

      <div style={{marginTop: 30}}>New Subscription:</div>
      <form className="form-inline mt-2" onSubmit={(e) => {
        e.preventDefault();
        const wellKnown = getRefVal(wellKnown_Tx) || "";
        const rx = getRefVal(Rx_role) || null;
        const tx = getRefVal(Tx_role) || null;
        const n = getRefVal(name) || null;
        const ct = getRefVal(channel_type) || null;
        const txh = getRefVal(Tx_host) || null;
        const pass = getRefVal(password) || null;
        newSubscription(wellKnown, rx, tx, n, ct, txh, pass);
      }}>
        <div className="form-group">
          <label className="sr-only">wellKnown_Tx</label>
          <input type="text" className="form-control" ref={wellKnown_Tx} placeholder="wellKnown_Tx" />
        </div>
        <div className="form-group">
          <label className="sr-only">Rx_role</label>
          <input type="text" className="form-control" ref={Rx_role} placeholder="Rx_role" />
        </div>
        <div className="form-group">
          <label className="sr-only">Tx_role</label>
          <input type="text" className="form-control" ref={Tx_role} placeholder="Tx_role" />
        </div>
        <div className="form-group">
          <label className="sr-only">name</label>
          <input type="text" className="form-control" ref={name} placeholder="name" />
        </div>
        <div className="form-group">
          <label className="sr-only">channel_type</label>
          <input type="text" className="form-control" ref={channel_type} placeholder="channel_type" />
        </div>
        <div className="form-group">
          <label className="sr-only">Tx_host</label>
          <input type="text" className="form-control" ref={Tx_host} placeholder="Tx_host" />
        </div>
        <div className="form-group">
          <label className="sr-only">password</label>
          <input type="text" className="form-control" ref={password} placeholder="password" />
        </div>
        <button type="submit" className="btn btn-outline-primary">
          Add
        </button>
      </form>
    </div>
  );
};

export default Subscriptions;
