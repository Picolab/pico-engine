import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "../../Action";
import { PicoBox, State } from "../../State";
import { Link } from "react-router-dom";

interface Props {
  dispatch: Dispatch;
  pico: PicoBox;
}

class Rulesets extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { pico } = this.props;

    return (
      <div>
        <h3>Installed Rulesets</h3>
        TODO
        <hr />
        TODO form to install ruleset + version
        <hr />
        <Link to="/rulesets">Engine Rulesets</Link>
      </div>
    );
  }
}

export default connect((state: State) => {
  return {};
})(Rulesets);
