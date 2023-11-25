import * as React from "react";
import { useParams } from "react-router-dom";
import { apiSavePicoBox } from "../api";
import picoPageStore from "../stores/picoPageStore";
import Pico from "./Pico";

interface Props {}

const PicosPage: React.FC<Props> = () => {
  let params = useParams();

  const openEci = params.eci;
  const openTab = params.tab;

  const picoPage = picoPageStore.use();

  React.useEffect(() => {
    picoPageStore.fetchAll();
  }, []);

  function onMouseMove(e: React.MouseEvent) {
    if (!picoPage.picoMoving) return;

    switch (picoPage.picoMoving.action) {
      case "moving": {
        picoPageStore.updateBox(picoPage.picoMoving.eci, {
          x: e.clientX - (picoPage.picoMoving.relX || 0),
          y: e.clientY - (picoPage.picoMoving.relY || 0),
        });
        break;
      }
      case "resizing": {
        const box = picoPage.picoBoxes[picoPage.picoMoving.eci];
        if (box) {
          picoPageStore.updateBox(picoPage.picoMoving.eci, {
            width: Math.max(0, e.clientX - box.x),
            height: Math.max(0, e.clientY - box.y),
          });
        }
        break;
      }
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (!picoPage.picoMoving) return;

    const box = picoPage.picoBoxes[picoPage.picoMoving.eci];
    if (box) {
      apiSavePicoBox(box.eci, {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      });
    }

    picoPageStore.setPicoMoving(null);
  }

  return (
    <div id="picos-page" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <footer className="fixed-bottom-right p-5">
        <div>
          Powered by{" "}
          <a href="https://github.com/Picolab/pico-engine">pico-engine</a>
        </div>
        <div>
          {picoPage.uiContext ? `version: ${picoPage.uiContext.version}` : ""}
        </div>
        {process.env.NODE_ENV === "development" && <div>Development Mode</div>}
      </footer>

      <div className="container-fluid">
        {picoPage.loading ? "Loading..." : ""}
        {picoPage.error ? (
          <div className="alert alert-danger">{picoPage.error}</div>
        ) : (
          ""
        )}
      </div>

      {Object.values(picoPage.picoBoxes).map((pico) => {
        return (
          <Pico
            key={pico.eci + pico.x + pico.y + pico.width + pico.height}
            pico={pico}
            openEci={openEci}
            openTab={openTab}
          />
        );
      })}

      <svg id="picos-svg">
        {picoPage.channelLines.map((line, i) => {
          return (
            <line
              key={i}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
            />
          );
        })}
      </svg>
      <svg id="subs-svg">
        {picoPage.subLines.map((line, i) => {
          return (
            <line
              strokeDasharray="4"
              key={i}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default PicosPage;
