import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Dispatch, picosMouseMove, picosMouseUp } from "../Action";
import { State } from "../State";
import Pico from "./Pico";

interface Props {
  dispatch: Dispatch;

  uiContext_apiSt: State["uiContext_apiSt"];
  uiContext: State["uiContext"];

  isDraggingSomething: boolean;

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
    const { uiContext_apiSt, uiContext, match } = this.props;

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

        <Pico openEci={openEci} openTab={openTab} />
      </div>
    );
  }
}

export default connect((state: State) => {
  return {
    uiContext_apiSt: state.uiContext_apiSt,
    uiContext: state.uiContext,

    isDraggingSomething: !!state.pico_moving || !!state.pico_resizing
  };
})(PicosPage);
