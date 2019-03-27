import * as React from "react";
import { connect } from "react-redux";
import { Dispatch, picosMouseMove, picosMouseUp } from "../Action";
import { PicoBox, State } from "../State";
import Pico from "./Pico";

type XY = { x: number; y: number };
type LineXYs = { from: XY; to: XY };

interface Props {
  dispatch: Dispatch;

  uiContext_apiSt: State["uiContext_apiSt"];
  uiContext: State["uiContext"];

  isDraggingSomething: boolean;

  picoBoxes: PicoBox[];
  channelLines: LineXYs[];

  // react-router
  match: { params: { [name: string]: string } };
}

class PicosPage extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onMouseMove(e: React.MouseEvent) {
    if (this.props.isDraggingSomething) {
      this.props.dispatch(picosMouseMove(e.clientX, e.clientY));
    }
  }

  onMouseUp(e: React.MouseEvent) {
    if (this.props.isDraggingSomething) {
      this.props.dispatch(picosMouseUp());
    }
  }

  render() {
    const {
      uiContext_apiSt,
      uiContext,
      picoBoxes,
      match,
      channelLines
    } = this.props;

    const openEci: string | undefined = match.params.eci;
    const openTab: string | undefined = match.params.tab;

    return (
      <div
        id="picos-page"
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
      >
        <div className="container-fluid">
          <h1>pico-engine NEXT</h1>
          {uiContext ? `version: ${uiContext.version}` : ""}
          {uiContext_apiSt.waiting ? "Loading..." : ""}
          {uiContext_apiSt.error ? (
            <div className="alert alert-danger">{uiContext_apiSt.error}</div>
          ) : (
            ""
          )}
        </div>

        {picoBoxes.map(pico => {
          return (
            <Pico
              key={pico.eci}
              pico={pico}
              openEci={openEci}
              openTab={openTab}
            />
          );
        })}

        <svg id="picos-svg">
          {channelLines.map((line, i) => {
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
  }
}

export default connect((state: State) => {
  const picoBoxes = Object.values(state.picos)
    .map(p => p.box)
    .filter(b => !!b) as PicoBox[];

  const picoXYs: { [eci: string]: XY } = {};
  for (const box of picoBoxes) {
    picoXYs[box.eci] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  const channelLines: LineXYs[] = [];
  for (const box of picoBoxes) {
    const from = picoXYs[box.eci];
    for (const eci of box.children) {
      const to = picoXYs[eci];
      if (from && to) {
        channelLines.push({ from, to });
      }
    }
  }

  return {
    uiContext_apiSt: state.uiContext_apiSt,
    uiContext: state.uiContext,

    isDraggingSomething: !!state.pico_moving || !!state.pico_resizing,

    picoBoxes,
    channelLines
  };
})(PicosPage);
