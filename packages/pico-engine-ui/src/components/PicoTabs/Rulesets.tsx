import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Dispatch, installRuleset, uninstallRuleset } from "../../Action";
import { PicoBox, PicoState, State } from "../../State";

interface PropsFromParent {
  pico: PicoBox;
}

interface Props extends PropsFromParent {
  dispatch: Dispatch;
  rulesets: State["rulesets"];
  picoState?: PicoState;
}

interface LocalState {
  rid: string | null;
  version: string | null;
}

class Rulesets extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.install = this.install.bind(this);

    this.state = {
      rid: null,
      version: null
    };
  }

  isReadyToInstall() {
    const { rid, version } = this.state;
    const { rulesets } = this.props;
    return !!(
      rid &&
      version &&
      rulesets[rid] &&
      rulesets[rid].indexOf(version) >= 0
    );
  }

  install(e: React.FormEvent) {
    e.preventDefault();
    const { rid, version } = this.state;
    const { pico, dispatch } = this.props;
    if (this.isReadyToInstall() && rid && version) {
      dispatch(installRuleset(pico.eci, rid, version));
    }
  }

  uninstall(rid: string) {
    const { pico, dispatch } = this.props;
    dispatch(uninstallRuleset(pico.eci, rid));
  }

  render() {
    const { pico, rulesets, picoState } = this.props;

    const installError = (picoState && picoState.install_apiSt.error) || null;

    const uninstallError =
      (picoState && picoState.uninstall_apiSt.error) || null;

    const waiting = picoState
      ? picoState.install_apiSt.waiting || picoState.uninstall_apiSt.waiting
      : true;

    return (
      <div>
        <h3>Installed Rulesets</h3>
        {uninstallError ? (
          <div className="alert alert-danger">
            Uninstall error: {uninstallError}
          </div>
        ) : (
          ""
        )}
        {picoState &&
        picoState.details &&
        picoState.details.rulesets.length > 0 ? (
          <ul>
            {picoState.details.rulesets.map(rs => {
              return (
                <li key={rs.rid} className="text-mono">
                  <Link to={`/rulesets/${rs.rid}/${rs.version}`}>
                    {rs.rid}@{rs.version}
                  </Link>
                  {" " + JSON.stringify(rs.config)}
                  <button
                    className="btn btn-link btn-sm"
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      this.uninstall(rs.rid);
                    }}
                    disabled={waiting}
                  >
                    uninstall
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="text-muted">- no rulesets -</span>
        )}
        <hr />
        <form className="form-inline mt-2" onSubmit={this.install}>
          <div className="form-group">
            <select
              className="form-control"
              value={this.state.rid || "--"}
              onChange={e => this.setState({ rid: e.target.value })}
            >
              <option value="--" />
              {Object.keys(rulesets).map(rid => (
                <option key={rid} value={rid}>
                  {rid}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group ml-1 mr-1">
            <select
              className="form-control"
              disabled={!rulesets[this.state.rid || ""]}
              value={this.state.version || "--"}
              onChange={e => this.setState({ version: e.target.value })}
            >
              <option value="--" />
              {(rulesets[this.state.rid || ""] || []).map(version => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-outline-primary"
            disabled={waiting || !this.isReadyToInstall()}
          >
            Install
          </button>
          {installError ? (
            <span className="text-danger">{installError}</span>
          ) : (
            ""
          )}
        </form>
        <hr />
        <Link to="/rulesets">Engine Rulesets</Link>
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
})(Rulesets);
