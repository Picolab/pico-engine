import * as React from "react";
import { apiSavePicoBox } from "../api";
import picoPageStore from "../stores/picoPageStore";
import Pico from "./Pico";

interface Props {
  // react-router
  match: { params: { [name: string]: string } };
}

const PicosPage: React.FC<Props> = props => {
  const { match } = props;

  const openEci: string | undefined = match.params.eci;
  const openTab: string | undefined = match.params.tab;

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
          y: e.clientY - (picoPage.picoMoving.relY || 0)
        });
        break;
      }
      case "resizing": {
        const box = picoPage.picoBoxes[picoPage.picoMoving.eci];
        if (box) {
          picoPageStore.updateBox(picoPage.picoMoving.eci, {
            width: Math.max(0, e.clientX - box.x),
            height: Math.max(0, e.clientY - box.y)
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
        height: box.height
      });
    }

    picoPageStore.setPicoMoving(null);
  }

  return (
    <div id="picos-page" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div className="container-fluid">
        <h1>pico-engine NEXT</h1>
        {picoPage.uiContext ? `version: ${picoPage.uiContext.version}` : ""}
        {picoPage.loading ? "Loading..." : ""}
        {picoPage.error ? (
          <div className="alert alert-danger">{picoPage.error}</div>
        ) : (
          ""
        )}
      </div>

      {Object.values(picoPage.picoBoxes).map(pico => {
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
    </div>
  );
};

export default PicosPage;
