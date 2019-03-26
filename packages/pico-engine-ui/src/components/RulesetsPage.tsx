import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Dispatch } from "../Action";
import { State } from "../State";

interface Props {
  id: string;

  dispatch: Dispatch;
}

class RulesetsPage extends React.Component<Props> {
  render() {
    return <div>hello</div>;
  }
}

export default connect((state: State) => {
  return {};
})(RulesetsPage);
