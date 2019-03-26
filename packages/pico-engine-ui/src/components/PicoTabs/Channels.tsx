import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "../../Action";
import { PicoBox, State } from "../../State";

interface Props {
  dispatch: Dispatch;
  pico: PicoBox;
}

class Channels extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { pico } = this.props;

    return (
      <div>
        <h3>Channels</h3>
        TODO list channels
        <hr />
        TODO form to add channel
      </div>
    );
  }
}

export default connect((state: State) => {
  return {};
})(Channels);
