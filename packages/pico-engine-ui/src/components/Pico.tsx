import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Dispatch, startPicoResize, startPicoMove } from "../Action";
import { State, PicoBox } from "../State";

interface Props {
  dispatch: Dispatch;
  pico: PicoBox;
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
    const { pico } = this.props;

    return (
      <div
        className="card pico"
        style={{
          left: pico.x,
          top: pico.y,
          width: pico.width,
          height: pico.height,
          backgroundColor: pico.backgroundColor
        }}
        onMouseDown={this.mouseDownMove}
      >
        <div className="card-body">{pico.name}</div>
        <div
          className="pico-resize-handle"
          onMouseDown={this.mouseDownResize}
        />
      </div>
    );
  }
}

export default connect((state: State) => {
  return {
    pico: state.rootPico
  };
})(Pico);
