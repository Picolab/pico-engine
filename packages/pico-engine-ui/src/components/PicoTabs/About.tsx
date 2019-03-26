import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "../../Action";
import { PicoBox, State } from "../../State";

interface Props {
  dispatch: Dispatch;
  pico: PicoBox;
}

function getRefVal(ref: React.RefObject<HTMLInputElement>) {
  return ref.current && ref.current.value;
}

class About extends React.Component<Props> {
  private input_name = React.createRef<HTMLInputElement>();
  private input_backgroundColor = React.createRef<HTMLInputElement>();

  private input_add_name = React.createRef<HTMLInputElement>();
  private input_add_backgroundColor = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    this.savePico = this.savePico.bind(this);
    this.addPico = this.addPico.bind(this);
  }

  savePico(e: React.FormEvent) {
    e.preventDefault();
    const name = getRefVal(this.input_name);
    const backgroundColor = getRefVal(this.input_backgroundColor);

    console.log(name, backgroundColor);
    // TODO send add event
  }

  addPico(e: React.FormEvent) {
    e.preventDefault();
    const name = getRefVal(this.input_add_name);
    const backgroundColor = getRefVal(this.input_add_backgroundColor);

    console.log(name, backgroundColor);
    // TODO send ui update event
  }

  render() {
    const { pico } = this.props;

    return (
      <div>
        <h3>Pico</h3>
        <div>
          <b className="text-muted" title="This is the channel used by the UI">
            UI ECI:
          </b>{" "}
          <span className="text-mono">{pico.eci}</span>
        </div>

        <form className="form-inline" onSubmit={this.savePico}>
          <div className="form-group">
            <label className="sr-only">Name</label>
            <input
              type="text"
              className="form-control"
              defaultValue={pico.name}
              ref={this.input_name}
            />
          </div>
          <div className="form-group ml-1 mr-1">
            <label className="sr-only">Color</label>
            <input
              type="color"
              className="form-control p-0"
              style={{ width: 38 }}
              defaultValue={pico.backgroundColor}
              ref={this.input_backgroundColor}
            />
          </div>
          <button type="submit" className="btn btn-outline-primary">
            Save
          </button>
        </form>

        <h3 className="mt-3">Children</h3>

        <form className="form-inline" onSubmit={this.addPico}>
          <div className="form-group">
            <label className="sr-only">Name</label>
            <input
              type="text"
              className="form-control"
              ref={this.input_add_name}
            />
          </div>
          <div className="form-group ml-1 mr-1">
            <label className="sr-only">Color</label>
            <input
              type="color"
              className="form-control p-0"
              style={{ width: 38 }}
              defaultValue={pico.backgroundColor}
              ref={this.input_add_backgroundColor}
            />
          </div>
          <button type="submit" className="btn btn-outline-primary">
            Add
          </button>
        </form>
      </div>
    );
  }
}

export default connect((state: State) => {
  return {};
})(About);
