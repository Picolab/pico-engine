import * as React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import {
  Dispatch,
  getPicoDetails,
  startPicoMove,
  startPicoResize
} from "../Action";
import { PicoBox, PicoState, State } from "../State";
import About from "./PicoTabs/About";
import Channels from "./PicoTabs/Channels";
import Logging from "./PicoTabs/Logging";
import Rulesets from "./PicoTabs/Rulesets";
import Subscriptions from "./PicoTabs/Subscriptions";
import Testing from "./PicoTabs/Testing";

/**
 * Simple component to detect when the pico view has been opened
 */
class PicoOpened extends React.Component<{ dispatch: Dispatch; eci: string }> {
  componentDidMount() {
    const { dispatch, eci } = this.props;
    dispatch(getPicoDetails(eci));
  }
  render() {
    return null;
  }
}

interface PropsFromParent {
  pico: PicoBox;
  openEci?: string;
  openTab?: string;
}

interface Props extends PropsFromParent {
  dispatch: Dispatch;
  isMovingOrResizing: boolean;
  picoState: PicoState;
}

class Pico extends React.Component<Props> {
  private rootElm = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    this.mouseDownMove = this.mouseDownMove.bind(this);
    this.mouseDownResize = this.mouseDownResize.bind(this);
  }

  mouseDownMove(e: React.MouseEvent) {
    let relX = 0;
    let relY = 0;
    const elm = this.rootElm.current;
    if (elm) {
      relX = e.clientX - elm.offsetLeft;
      relY = e.clientY - elm.offsetTop;
    }
    this.props.dispatch(startPicoMove(this.props.pico.eci, relX, relY));
  }

  mouseDownResize(e: React.MouseEvent) {
    this.props.dispatch(startPicoResize(this.props.pico.eci));
    e.stopPropagation();
  }

  render() {
    const { pico, isMovingOrResizing, openEci, picoState } = this.props;
    const isOpen = pico.eci === openEci;

    return (
      <div
        ref={this.rootElm}
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
              {picoState.details_apiSt.error ? (
                <div className="alert alert-danger">
                  {picoState.details_apiSt.error}
                </div>
              ) : (
                ""
              )}
              {this.renderTabsBody()}
              {picoState.details_apiSt.waiting ? "Loading..." : ""}
            </div>
            <PicoOpened dispatch={this.props.dispatch} eci={pico.eci} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="card-body">
              <Link
                to={"/pico/" + pico.eci}
                className="pico-name-open-btn"
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

export default connect((state: State, props: PropsFromParent) => {
  const { pico } = props;
  const picoState = state.picos[pico.eci];
  return {
    picoState,
    isMovingOrResizing:
      pico.eci === state.pico_moving || pico.eci === state.pico_resizing
  };
})(Pico);
