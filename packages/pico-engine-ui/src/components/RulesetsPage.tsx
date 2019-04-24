import * as React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import {
  Dispatch,
  changeNewRulesetRid,
  makeNewRuleset,
  krlSetTheme,
  krlSetStatus,
  getRuleset
} from "../Action";
import { State, ApiCallStatus, RulesetState } from "../State";
import KrlEditor from "./KrlEditor";
import { themes } from "./KrlEditor";
import ErrorStatus from "./widgets/ErrorStatus";
const logoUrl = require("../img/nav-logo.png");

interface Props {
  dispatch: Dispatch;
  rulesets: State["rulesets"];
  rulesets_apiSt: State["rulesets_apiSt"];

  newRuleset_ridInput: string;
  newRuleset_apiSt: ApiCallStatus;

  theme: string | null;
  status: string | null;

  // react-router
  match: { params: { [name: string]: string } };
}

function selectedRsRoute(props: Props): { rid: string; version: string } {
  const params = props.match.params;
  const rid = params.rid ? params.rid : Object.keys(props.rulesets)[0] || "";
  const version = params.version
    ? params.version
    : props.rulesets[rid]
    ? Object.keys(props.rulesets[rid])[0]
    : "draft";
  return { rid, version };
}

class RulesetsPage extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.newRuleset = this.newRuleset.bind(this);
    this.changeNewRuleset = this.changeNewRuleset.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.onKrlStatus = this.onKrlStatus.bind(this);
  }

  componentDidMount() {
    const { rid, version } = selectedRsRoute(this.props);
    this.props.dispatch(getRuleset(rid, version));
  }

  componentWillReceiveProps(nextProps: Props) {
    const { rid, version } = selectedRsRoute(this.props);
    const { rid: ridNext, version: versionNext } = selectedRsRoute(nextProps);
    if (rid !== ridNext || version !== versionNext) {
      nextProps.dispatch(getRuleset(ridNext, versionNext));
    }
  }

  newRuleset(e: React.FormEvent) {
    e.preventDefault();
    const { dispatch, newRuleset_ridInput } = this.props;
    dispatch(makeNewRuleset(newRuleset_ridInput));
  }

  changeNewRuleset(e: React.ChangeEvent<HTMLInputElement>) {
    const { dispatch } = this.props;
    dispatch(changeNewRulesetRid(e.target.value));
  }

  setTheme(e: React.ChangeEvent<HTMLSelectElement>) {
    const { dispatch } = this.props;
    dispatch(krlSetTheme(e.target.value));
  }

  onKrlStatus(msg: string) {
    const { dispatch } = this.props;
    dispatch(krlSetStatus(msg));
  }

  render() {
    const {
      rulesets,
      rulesets_apiSt,
      newRuleset_ridInput,
      newRuleset_apiSt,
      theme,
      status
    } = this.props;
    const { rid, version } = selectedRsRoute(this.props);

    const rsState: RulesetState | null =
      (rulesets[rid] && rulesets[rid][version]) || null;

    // TODO ability to open/close the right hand side
    return (
      <div id="rulesets-page" className="d-flex">
        <div className="overflow-auto" style={{ width: 300 }}>
          <div className="container-fluid">
            <div className="mt-2 mb-2">
              <Link to="/" className="float-left mr-2">
                <img src={logoUrl} style={{ height: 35 }} />
              </Link>
              <h1 style={{ fontSize: 24 }}>
                pico-engine <small className="text-muted">v0.0.0</small>
              </h1>
            </div>
            <div className="mt-4 mb-4">
              <div className="text-muted">Rulesets</div>
              <ErrorStatus error={rulesets_apiSt.error} />
              <ul className="nav nav-pills flex-column ruleset-list">
                {Object.keys(rulesets).map(rid => {
                  return (
                    <li key={rid} className="nav-item">
                      <NavLink
                        to={`/rulesets/${rid}`}
                        className="nav-link text-mono"
                      >
                        {rid}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
            <form onSubmit={this.newRuleset}>
              <fieldset disabled={newRuleset_apiSt.waiting}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="ruleset id"
                    value={newRuleset_ridInput}
                    onChange={this.changeNewRuleset}
                  />
                  <div className="input-group-append">
                    <button className="btn btn-light btn-sm" type="submit">
                      new ruleset
                    </button>
                  </div>
                </div>
                <ErrorStatus error={newRuleset_apiSt.error} />
              </fieldset>
            </form>
          </div>
        </div>
        <div className="flex-grow-1 d-flex flex-column">
          <div className="pt-2 pb-2 d-flex">
            <button type="button" className="btn btn-success btn-sm">
              Register
            </button>
            <div className="flex-grow-1">
              <ErrorStatus error={rsState ? rsState.krl_apiSt.error : null} />
            </div>
            <form className="form-inline">
              <label>Theme</label>
              <select
                className="form-control form-control-sm ml-2"
                value={theme || ""}
                onChange={this.setTheme}
              >
                {Object.keys(themes).map(group => {
                  return (
                    <optgroup key={group} label={group}>
                      {themes[group].map(theme => {
                        return (
                          <option key={theme} value={theme}>
                            {theme}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
              </select>
            </form>
          </div>
          <KrlEditor theme={theme} onStatus={this.onKrlStatus} />
          <div>
            <span className="text-muted">status:</span>{" "}
            <span className="text-mono">{status || ""}</span>
          </div>
        </div>
        <div className="overflow-auto" style={{ width: 300 }}>
          <div className="container-fluid">
            <h3>Versions</h3>
            <ul className="nav nav-pills flex-column ruleset-list">
              {Object.keys(rulesets[rid] || {}).map(version => {
                return (
                  <li key={version} className="nav-item">
                    <NavLink
                      to={`/rulesets/${rid}/${version}`}
                      className="nav-link text-mono"
                    >
                      {version}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default connect((state: State) => {
  return {
    rulesets: state.rulesets,
    rulesets_apiSt: state.rulesets_apiSt,

    newRuleset_ridInput: state.rulesetPage.newRuleset_ridInput,
    newRuleset_apiSt: state.rulesetPage.newRuleset_apiSt,

    theme: state.rulesetPage.theme,
    status: state.rulesetPage.status
  };
})(RulesetsPage);
