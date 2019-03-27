import * as React from "react";
import { connect } from "react-redux";
import {
  Dispatch,
  getTesting,
  sendTestQuery,
  sendTestEvent
} from "../../Action";
import { PicoBox, State, PicoState, PicoRuleset } from "../../State";
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

class Testing extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      expandedRIDs: {}
    };

    this.sendTestEvent = this.sendTestEvent.bind(this);
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
    const { pico, dispatch } = this.props;
    dispatch(sendTestQuery(pico.eci, rid, name));
  }

  sendTestEvent(domain: string, name: string) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const attrs: { [name: string]: string } = {};
      for (let i = 0; i < form.elements.length; i++) {
        const elm = form.elements[i] as any;
        if (elm && elm.name && elm.value) {
          attrs[elm.name] = elm.value;
        }
      }

      const { pico, dispatch } = this.props;
      dispatch(sendTestEvent(pico.eci, domain, name, attrs));
    };
  }

  render() {
    const { picoState } = this.props;
    const { expandedRIDs } = this.state;

    const rulesets: PicoRuleset[] =
      picoState && picoState.details ? picoState.details.rulesets : [];

    return (
      <div>
        <div className="row">
          <div className="col">
            <h3>Testing</h3>
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
                        <div>
                          <ul>
                            {(testing.schema.queries || []).map(q => {
                              return (
                                <li
                                  key={q.name}
                                  style={{ listStyle: "circle" }}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm"
                                    onClick={e => {
                                      e.preventDefault();
                                      this.sendTestQuery(rs.rid, q.name);
                                    }}
                                  >
                                    {q.name}
                                  </button>
                                </li>
                              );
                            })}
                            {(testing.schema.events || []).map(e => {
                              const doname = `${e.domain}:${e.name}`;

                              return (
                                <li key={doname}>
                                  <form
                                    onSubmit={this.sendTestEvent(
                                      e.domain,
                                      e.name
                                    )}
                                    className="border border-dark p-2"
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
                                      className="btn btn-secondary btn-sm"
                                    >
                                      {doname}
                                    </button>
                                  </form>
                                </li>
                              );
                            })}

                            <li>event</li>
                          </ul>
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
