import * as React from "react";
import { Link, NavLink } from "react-router-dom";
import picoPageStore from "../stores/picoPageStore";
import { titleColor } from "../themes";
import { PicoBox } from "../types/PicoBox";
import About from "./PicoTabs/About";
import Channels from "./PicoTabs/Channels";
import Logging from "./PicoTabs/Logging";
import Rulesets from "./PicoTabs/Rulesets";
import Relationships from "./PicoTabs/Relationships";
import Testing from "./PicoTabs/Testing";
import TryIt from "./PicoTabs/TryIt";

function returnTabLink(pico: PicoBox, label: string, tab?: string) {
  let url = `/pico/${pico.eci}`;
  if (tab) {
    url += "/" + tab;
  }
  return (
    <li className="nav-item">
      <NavLink className="nav-link" to={url} end>
        {label}
      </NavLink>
    </li>
  );
}

/** Whether this pico gets the Try It! tab under the engine's show_tryit_menu setting. */
function showsTryIt(pico: PicoBox, setting?: "off" | "root_only" | "all"): boolean {
  const show = setting || "root_only";
  if (show === "all") return true;
  if (show === "root_only") return !pico.parent;
  return false;
}

/** Keep tab panels mounted so local state survives Rulesets ↔ Testing switches. */
function PicoTabPanels({
  pico,
  openTab,
  tryIt,
}: {
  pico: PicoBox;
  openTab?: string;
  tryIt: boolean;
}) {
  const tab = typeof openTab === "string" ? openTab.toLowerCase().trim() : "";
  const active =
    tab === "rulesets" ||
    tab === "channels" ||
    tab === "logging" ||
    tab === "testing" ||
    tab === "subscriptions" ||
    tab === "relationships" ||
    (tab === "try-it" && tryIt)
      ? tab
      : "about";

  return (
    <>
      <div hidden={active !== "about"}>
        <About pico={pico} isTabActive={active === "about"} />
      </div>
      <div hidden={active !== "rulesets"}>
        <Rulesets pico={pico} isTabActive={active === "rulesets"} />
      </div>
      <div hidden={active !== "channels"}>
        <Channels pico={pico} />
      </div>
      <div hidden={active !== "logging"}>
        <Logging pico={pico} isTabActive={active === "logging"} />
      </div>
      <div hidden={active !== "testing"}>
        <Testing pico={pico} />
      </div>
      <div
        hidden={active !== "relationships" && active !== "subscriptions"}
      >
        <Relationships pico={pico} />
      </div>
      {tryIt ? (
        <div hidden={active !== "try-it"}>
          <TryIt pico={pico} isTabActive={active === "try-it"} />
        </div>
      ) : null}
    </>
  );
}

interface Props {
  pico: PicoBox;
  openEci?: string;
  openTab?: string;
}

const Pico: React.FC<Props> = (props) => {
  const { pico, openEci, openTab } = props;
  const isOpen = pico.eci === openEci;

  const picoPage = picoPageStore.use();
  const tryIt = showsTryIt(pico, picoPage.uiContext?.showTryItMenu);

  const isMovingOrResizing =
    picoPage.picoMoving && picoPage.picoMoving.eci === pico.eci;

  const rootElm = React.useRef<HTMLDivElement | null>(null);

  function mouseDownMove(e: React.MouseEvent) {
    const elm = rootElm.current;
    picoPageStore.setPicoMoving({
      eci: pico.eci,
      action: "moving",
      relX: elm ? e.clientX - elm.offsetLeft : 0,
      relY: elm ? e.clientY - elm.offsetTop : 0,
    });
  }

  function mouseDownResize(e: React.MouseEvent) {
    e.stopPropagation();
    const elm = rootElm.current;
    picoPageStore.setPicoMoving({
      eci: pico.eci,
      action: "resizing",
      relX: elm ? e.clientX - elm.offsetLeft : 0,
      relY: elm ? e.clientY - elm.offsetTop : 0,
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
        backgroundColor: pico.backgroundColor,
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
            <div
              className="card-header-pico-name"
              style={{ color: titleColor(pico.backgroundColor) }}
            >
              {pico.name}
            </div>
            <ul className="nav nav-tabs card-header-tabs">
              {returnTabLink(pico, "About")}
              {returnTabLink(pico, "Rulesets", "rulesets")}
              {returnTabLink(pico, "Channels", "channels")}

              {returnTabLink(pico, "Logging", "logging")}
              {returnTabLink(pico, "Testing", "testing")}
              {returnTabLink(pico, "Relationships", "relationships")}
              {tryIt ? returnTabLink(pico, "Try It!", "try-it") : null}
            </ul>
          </div>
          <div className="card-body bg-white overflow-auto">
            <PicoTabPanels pico={pico} openTab={openTab} tryIt={tryIt} />
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="card-body">
            <Link
              to={"/pico/" + pico.eci}
              className="pico-name-open-btn"
              onMouseDown={(e: any) => e.stopPropagation()}
              style={{ color: titleColor(pico.backgroundColor) }}
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
