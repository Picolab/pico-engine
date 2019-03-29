import * as React from "react";
import { connect } from "react-redux";
import {
  Dispatch,
  getTesting,
  sendTestQuery,
  sendTestEvent,
  setTestingECI
} from "../../Action";
import { PicoBox, State, PicoState, PicoRuleset, Channel } from "../../State";
import { Link } from "react-router-dom";

interface PropsFromParent {
  pico: PicoBox;
}

interface Props extends PropsFromParent {
  dispatch: Dispatch;
  rulesets: State["rulesets"];
  picoState?: PicoState;
}

interface LocalState {
  expandedRIDs: { [rid: string]: boolean };
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

class Testing extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      expandedRIDs: {}
    };

    this.sendTestEvent = this.sendTestEvent.bind(this);
    this.setTestingECI = this.setTestingECI.bind(this);
  }

  toggleRid(checked: boolean, rid: string) {
    const { pico, dispatch } = this.props;
    const map = Object.assign({}, this.state.expandedRIDs);
    if (checked) {
      map[rid] = true;
      dispatch(getTesting(pico.eci, rid));
    } else {
      delete map[rid];
    }
    this.setState({ expandedRIDs: map });
  }

  sendTestQuery(rid: string, name: string) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const args = serializeFormAttrsOrArgs(e);
      const { pico, dispatch } = this.props;
      dispatch(sendTestQuery(pico.eci, this.getTestingECI(), rid, name, args));
    };
  }

  sendTestEvent(domain: string, name: string) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const attrs = serializeFormAttrsOrArgs(e);
      const { pico, dispatch } = this.props;
      dispatch(
        sendTestEvent(pico.eci, this.getTestingECI(), domain, name, attrs)
      );
    };
  }

  setTestingECI(e: React.ChangeEvent<HTMLSelectElement>) {
    const { pico, dispatch } = this.props;
    dispatch(setTestingECI(pico.eci, e.target.value));
  }

  getTestingECI() {
    const { pico, picoState } = this.props;
    const testingECI = picoState && picoState.testingECI;
    return testingECI || pico.eci;
  }

  render() {
    const { picoState } = this.props;
    const { expandedRIDs } = this.state;

    const rulesets: PicoRuleset[] =
      picoState && picoState.details ? picoState.details.rulesets : [];

    const channels: Channel[] =
      (picoState && picoState.details && picoState.details.channels) || [];

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
                  value={this.getTestingECI()}
                  onChange={this.setTestingECI}
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
              const testing = picoState && picoState.testing[rs.rid];
              return (
                <div key={rs.rid}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`rid-${rs.rid}`}
                      onChange={e => this.toggleRid(e.target.checked, rs.rid)}
                      checked={isOpen}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`rid-${rs.rid}`}
                    >
                      {rs.rid}
                    </label>
                    <Link
                      to={`/rulesets/${rs.rid}/${rs.version}`}
                      className="btn btn-link btn-sm"
                    >
                      edit
                    </Link>
                  </div>
                  {isOpen && testing ? (
                    <div>
                      {testing.schema_apiSt.error ? (
                        <span className="text-danger">
                          {testing.schema_apiSt.error}
                        </span>
                      ) : (
                        ""
                      )}
                      {testing.schema ? (
                        <div className="pl-4">
                          {(testing.schema.queries || []).map(q => {
                            return (
                              <form
                                key={q.name}
                                onSubmit={this.sendTestQuery(rs.rid, q.name)}
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
                                onSubmit={this.sendTestEvent(e.domain, e.name)}
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
                      {testing.schema_apiSt.waiting ? "Loading..." : ""}
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

            {picoState && picoState.testResult_error ? (
              <span className="text-danger">{picoState.testResult_error}</span>
            ) : (
              ""
            )}

            <pre>
              {picoState && picoState.hasOwnProperty("testResult")
                ? JSON.stringify(picoState.testResult, undefined, 2)
                : ""}
            </pre>
          </div>
        </div>
      </div>
    );
  }
}

export default connect((state: State, props: PropsFromParent) => {
  const picoState = state.picos[props.pico.eci];
  return {
    picoState,
    rulesets: state.rulesets
  };
})(Testing);
