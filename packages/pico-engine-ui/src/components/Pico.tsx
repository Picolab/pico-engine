import * as React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { Dispatch, startPicoMove, startPicoResize } from "../Action";
import { PicoBox, State } from "../State";
import About from "./PicoTabs/About";
import Channels from "./PicoTabs/Channels";
import Rulesets from "./PicoTabs/Rulesets";
import Subscriptions from "./PicoTabs/Subscriptions";
import Logging from "./PicoTabs/Logging";
import Testing from "./PicoTabs/Testing";

interface Props {
  dispatch: Dispatch;
  pico: PicoBox;
  isMovingOrResizing: boolean;

  // from parent
  openEci?: string;
  openTab?: string;
}

class Pico extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.mouseDownMove = this.mouseDownMove.bind(this);
    this.mouseDownResize = this.mouseDownResize.bind(this);
  }

  mouseDownMove(e: React.MouseEvent) {
    this.props.dispatch(startPicoMove(this.props.pico.eci));
  }

  mouseDownResize(e: React.MouseEvent) {
    this.props.dispatch(startPicoResize(this.props.pico.eci));
    e.stopPropagation();
  }

  render() {
    const { pico, isMovingOrResizing, openEci, openTab } = this.props;
    const isOpen = pico.eci === openEci;

    return (
      <div
        className={
          "card pico" +
          (isOpen ? " open" : "") +
          (isMovingOrResizing ? "" : " pico-not-moving-or-resizing")
        }
        style={{
          left: pico.x,
          top: pico.y,
          maxWidth: pico.width,
          maxHeight: pico.height,
          backgroundColor: pico.backgroundColor
        }}
        onMouseDown={isOpen ? undefined : this.mouseDownMove}
      >
        {isOpen ? (
          <React.Fragment>
            <Link
              to={`/`}
              className={"btn btn-light position-absolute"}
              style={{ right: 0, top: 0 }}
            >
              Close
            </Link>
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                {this.returnTabLink("About")}
                {this.returnTabLink("Rulesets", "rulesets")}
                {this.returnTabLink("Channels", "channels")}

                {this.returnTabLink("Subscriptions", "subscriptions")}
                {this.returnTabLink("Logging", "logging")}
                {this.returnTabLink("Testing", "testing")}
              </ul>
            </div>
            <div className="card-body bg-white overflow-auto">
              {this.renderTabsBody()}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="card-body">
              <Link
                to={"/pico/" + pico.eci}
                onMouseDown={e => e.stopPropagation()}
              >
                {pico.name}
              </Link>
            </div>
            <div
              className="pico-resize-handle"
              onMouseDown={this.mouseDownResize}
            />
          </React.Fragment>
        )}
      </div>
    );
  }

  returnTabLink(label: string, tab?: string) {
    const { pico } = this.props;
    let url = `/pico/${pico.eci}`;
    if (tab) {
      url += "/" + tab;
    }
    return (
      <li className="nav-item">
        <NavLink className="nav-link" to={url} exact={true}>
          {label}
        </NavLink>
      </li>
    );
  }

  renderTabsBody() {
    const { pico, openTab } = this.props;
    const tab = typeof openTab === "string" ? openTab.toLowerCase().trim() : "";

    switch (tab) {
      case "rulesets":
        return <Rulesets pico={pico} />;

      case "channels":
        return <Channels pico={pico} />;

      case "subscriptions":
        return <Subscriptions pico={pico} />;

      case "logging":
        return <Logging pico={pico} />;

      case "testing":
        return <Testing pico={pico} />;
    }

    return <About pico={pico} />;
  }
}

export default connect((state: State) => {
  const pico = state.rootPico;
  return {
    pico,

    isMovingOrResizing:
      pico.eci === state.pico_moving || pico.eci === state.pico_resizing
  };
})(Pico);
