import * as React from "react";
import { apiGet, apiPost } from "../../api";
import {
  Channel,
  PicoBox,
  PicoDetails,
  PicoRuleset,
  TestingSchema
} from "../../State";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";

interface Props {
  pico: PicoBox;
}

function serializeFormAttrsOrArgs(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const attrs: { [name: string]: any } = {};
  for (let i = 0; i < form.elements.length; i++) {
    const elm = form.elements[i] as any;
    if (elm && elm.name && elm.value) {
      let val = elm.value;
      try {
        val = JSON.parse(val);
      } catch (e) {
        // just leave it as a string then
      }
      attrs[elm.name] = val;
    }
  }
  return attrs;
}

const Testing: React.FC<Props> = ({ pico }) => {
  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.next/pico`)
  );

  const [testingECI, setTestingECI] = React.useState<string>(pico.eci);
  const [testError, setTestError] = React.useState<string | null>(null);
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const [testingSchema, setTestingSchema] = React.useState<{
    [rid: string]: {
      waiting?: boolean;
      error?: string | null;
      schema?: TestingSchema;
    };
  }>({});

  const [expandedRIDs, setExpandedRIDs] = React.useState<{
    [rid: string]: boolean;
  }>({});

  React.useEffect(() => {
    picoDetails.load();
    setTestingSchema({});
  }, [pico.eci]);

  async function getTestingSchema(rid: string) {
    setTestingSchema({
      ...testingSchema,
      [rid]: { waiting: true, error: null }
    });
    try {
      const schema = await apiGet(`/c/${pico.eci}/query/${rid}/__testing`);
      setTestingSchema({
        ...testingSchema,
        [rid]: { schema }
      });
    } catch (err) {
      setTestingSchema({
        ...testingSchema,
        [rid]: { error: err + "" }
      });
    }
  }

  function sendTestQuery(rid: string, name: string) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const args = serializeFormAttrsOrArgs(e);
      setIsTesting(true);
      setTestError(null);
      setTestResult(null);
      try {
        const data = await apiPost(
          `/c/${testingECI}/query/${rid}/${name}`,
          args
        );
        setTestResult(JSON.stringify(data, undefined, 2));
      } catch (err) {
        setTestError(err + "");
      } finally {
        setIsTesting(false);
      }
    };
  }

  function sendTestEvent(domain: string, name: string) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const attrs = serializeFormAttrsOrArgs(e);
      setIsTesting(true);
      setTestError(null);
      setTestResult(null);
      try {
        const data = await apiPost(
          `/c/${testingECI}/event-wait/${domain}/${name}`,
          attrs
        );
        setTestResult(JSON.stringify(data, undefined, 2));
      } catch (err) {
        setTestError(err + "");
      } finally {
        setIsTesting(false);
      }
    };
  }

  const rulesets: PicoRuleset[] = picoDetails.data
    ? picoDetails.data.rulesets
    : [];

  const channels: Channel[] =
    (picoDetails.data && picoDetails.data.channels) || [];

  return (
    <div>
      <div className="row">
        <div className="col">
          <h3>Testing</h3>
          <div className="mt-3 mb-3">
            <form className="form-inline">
              <label>ECI:</label>
              <select
                className="form-control form-control-sm ml-2 text-mono"
                value={testingECI}
                onChange={e => setTestingECI(e.target.value)}
              >
                {channels.map(channel => {
                  const label =
                    channel.id +
                    " " +
                    channel.tags.map(tag => `#${tag}`).join(" ");
                  return (
                    <option key={channel.id} value={channel.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </form>
          </div>

          {rulesets.map(rs => {
            const isOpen = !!expandedRIDs[rs.rid];
            const testing = testingSchema[rs.rid] || null;
            return (
              <div key={rs.rid}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`rid-${rs.rid}`}
                    onChange={e => {
                      const map = Object.assign({}, expandedRIDs);
                      if (e.target.checked) {
                        map[rs.rid] = true;
                        getTestingSchema(rs.rid);
                      } else {
                        delete map[rs.rid];
                      }
                      setExpandedRIDs(map);
                    }}
                    checked={isOpen}
                  />
                  <label className="form-check-label" htmlFor={`rid-${rs.rid}`}>
                    {rs.rid}
                  </label>
                </div>
                {isOpen && testing ? (
                  <div>
                    <ErrorStatus error={testing.error} />
                    {testing.schema ? (
                      <div className="pl-4">
                        {(testing.schema.queries || []).map(q => {
                          return (
                            <form
                              key={q.name}
                              onSubmit={sendTestQuery(rs.rid, q.name)}
                              className="border border-primary p-2"
                            >
                              <div>
                                {(q.args || []).map(arg => {
                                  return (
                                    <input
                                      key={arg}
                                      name={arg}
                                      placeholder={arg}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                type="submit"
                                className="btn btn-sm btn-primary"
                              >
                                {q.name}
                              </button>
                            </form>
                          );
                        })}
                        {(testing.schema.events || []).map(e => {
                          const doname = `${e.domain}:${e.name}`;

                          return (
                            <form
                              key={doname}
                              onSubmit={sendTestEvent(e.domain, e.name)}
                              className="border border-warning p-2"
                            >
                              <div>
                                {(e.attrs || []).map(attr => {
                                  return (
                                    <input
                                      key={attr}
                                      name={attr}
                                      placeholder={attr}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                type="submit"
                                className="btn btn-sm btn-warning"
                              >
                                {doname}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    ) : (
                      ""
                    )}
                    {testing.waiting ? "Loading..." : ""}
                  </div>
                ) : (
                  ""
                )}
              </div>
            );
          })}
        </div>
        <div className="col">
          <div className="float-right">
            <span className="text-muted">Legend:</span>
            <span className="badge badge-primary ml-1">query</span>
            <span className="badge badge-warning ml-1">event</span>
          </div>
          <h3>Results</h3>

          <ErrorStatus error={testError} />

          {isTesting ? "Testing..." : testResult ? <pre>{testResult}</pre> : ""}
        </div>
      </div>
    </div>
  );
};

export default Testing;
