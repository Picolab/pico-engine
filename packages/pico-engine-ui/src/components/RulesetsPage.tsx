import * as React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { Dispatch, changeNewRulesetRid, makeNewRuleset } from "../Action";
import { State, ApiCallStatus } from "../State";
const logoUrl = require("../img/nav-logo.png");

interface Props {
  dispatch: Dispatch;
  rulesets: State["rulesets"];

  newRuleset_ridInput: string;
  newRuleset_apiSt: ApiCallStatus;
}

class RulesetsPage extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.newRuleset = this.newRuleset.bind(this);
    this.changeNewRuleset = this.changeNewRuleset.bind(this);
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

  render() {
    const { rulesets, newRuleset_ridInput, newRuleset_apiSt } = this.props;

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
                {newRuleset_apiSt.error ? (
                  <div className="text-danger">{newRuleset_apiSt.error}</div>
                ) : (
                  ""
                )}
              </fieldset>
            </form>
          </div>
        </div>
        <div className="flex-grow-1 d-flex flex-column">
          <div className="pt-2 pb-2 d-flex">
            <button type="buttton" className="btn btn-success btn-sm">
              Register
            </button>
            <div className="flex-grow-1" />
            <form className="form-inline">
              <label>Theme</label>
              <select className="form-control form-control-sm ml-2">
                <option>one</option>
              </select>
            </form>
          </div>
          <div className="flex-grow-1 bg-info">TODO editor</div>
          <div>
            <span className="text-muted">status:</span>{" "}
            <span className="text-mono">TODO</span>
          </div>
        </div>
        <div className="overflow-auto" style={{ width: 300 }}>
          <div className="container-fluid">TODO versions</div>
        </div>
      </div>
    );
  }
}

export default connect((state: State) => {
  return {
    rulesets: state.rulesets,

    newRuleset_ridInput: state.rulesetPage.newRuleset_ridInput,
    newRuleset_apiSt: state.rulesetPage.newRuleset_apiSt
  };
})(RulesetsPage);
