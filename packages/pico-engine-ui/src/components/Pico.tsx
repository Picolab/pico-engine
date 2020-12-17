import * as React from "react";
import { Link, NavLink } from "react-router-dom";
import picoPageStore from "../stores/picoPageStore";
import { PicoBox } from "../types/PicoBox";
import About from "./PicoTabs/About";
import Channels from "./PicoTabs/Channels";
import Logging from "./PicoTabs/Logging";
import Rulesets from "./PicoTabs/Rulesets";
import Testing from "./PicoTabs/Testing";

import { titleColor } from '../Themes';

function returnTabLink(pico: PicoBox, label: string, tab?: string) {
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

function renderTabsBody(pico: PicoBox, openTab?: string) {
  const tab = typeof openTab === "string" ? openTab.toLowerCase().trim() : "";

  switch (tab) {
    case "rulesets":
      return <Rulesets pico={pico} />;

    case "channels":
      return <Channels pico={pico} />;

    case "logging":
      return <Logging pico={pico} />;

    case "testing":
      return <Testing pico={pico} />;
  }

  return <About pico={pico} />;
}

interface Props {
  pico: PicoBox;
  openEci?: string;
  openTab?: string;
}

const Pico: React.FC<Props> = props => {
  const { pico, openEci, openTab } = props;
  const isOpen = pico.eci === openEci;

  const picoPage = picoPageStore.use();

  const isMovingOrResizing =
    picoPage.picoMoving && picoPage.picoMoving.eci === pico.eci;

  const rootElm = React.useRef<HTMLDivElement | null>(null);

  function mouseDownMove(e: React.MouseEvent) {
    const elm = rootElm.current;
    picoPageStore.setPicoMoving({
      eci: pico.eci,
      action: "moving",
      relX: elm ? e.clientX - elm.offsetLeft : 0,
      relY: elm ? e.clientY - elm.offsetTop : 0
    });
  }

  function mouseDownResize(e: React.MouseEvent) {
    e.stopPropagation();
    const elm = rootElm.current;
    picoPageStore.setPicoMoving({
      eci: pico.eci,
      action: "resizing",
      relX: elm ? e.clientX - elm.offsetLeft : 0,
      relY: elm ? e.clientY - elm.offsetTop : 0
    });
  }

  return (
    <div
      ref={rootElm}
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
      onMouseDown={isOpen ? undefined : mouseDownMove}
    >
      {isOpen ? (
        <React.Fragment>
          <Link
            to={`/`}
            className={"btn btn-light position-absolute"}
            style={{ right: 5, top: 5 }}
          >
            Close
          </Link>
          <div className="card-header">
            <div className="card-header-pico-name" style={{color: titleColor(pico.backgroundColor)}}>{pico.name}</div>
            <ul className="nav nav-tabs card-header-tabs">
              {returnTabLink(pico, "About")}
              {returnTabLink(pico, "Rulesets", "rulesets")}
              {returnTabLink(pico, "Channels", "channels")}

              {returnTabLink(pico, "Logging", "logging")}
              {returnTabLink(pico, "Testing", "testing")}
            </ul>
          </div>
          <div className="card-body bg-white overflow-auto">
            {renderTabsBody(pico, openTab)}
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="card-body">
            <Link
              to={"/pico/" + pico.eci}
              className="pico-name-open-btn"
              onMouseDown={e => e.stopPropagation()}
              style={{color: titleColor(pico.backgroundColor)}}
            >
              {pico.name}
            </Link>
          </div>
          <div className="pico-resize-handle" onMouseDown={mouseDownResize} />
        </React.Fragment>
      )}
    </div>
  );
};

export default Pico;
