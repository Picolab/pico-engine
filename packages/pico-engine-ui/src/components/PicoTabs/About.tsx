import * as React from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiSavePicoBox } from "../../Action";
import { PicoBox } from "../../State";
import picoPageStore from "../../stores/picoPageStore";
import useAsyncAction from "../../useAsyncAction";

function getRefVal(ref: React.MutableRefObject<HTMLInputElement | null>) {
  return ref.current && ref.current.value;
}

interface Props {
  pico: PicoBox;
}
const About: React.FC<Props> = ({ pico }) => {
  const input_name = React.useRef<HTMLInputElement | null>(null);
  const input_backgroundColor = React.useRef<HTMLInputElement | null>(null);

  const input_add_name = React.useRef<HTMLInputElement | null>(null);
  const input_add_backgroundColor = React.useRef<HTMLInputElement | null>(null);

  const savePico = useAsyncAction<{
    eci: string;
    name: string;
    backgroundColor: string;
  }>(({ eci, name, backgroundColor }) =>
    apiSavePicoBox(eci, { name, backgroundColor }).then(d => {
      picoPageStore.fetchAll();
    })
  );

  const addPico = useAsyncAction<{
    eci: string;
    name: string;
    backgroundColor: string;
  }>(({ eci, name, backgroundColor }) =>
    apiPost(`/c/${eci}/event/engine-ui/new/query/io.picolabs.next/box`, {
      name,
      backgroundColor
    }).then(d => {
      picoPageStore.fetchAll();
    })
  );

  const delPico = useAsyncAction<string>(eci =>
    apiGet(`/c/${pico.eci}/event-wait/engine-ui/del?eci=${eci}`).then(d => {
      picoPageStore.fetchAll();
      return null;
    })
  );

  return (
    <div>
      <h3>Pico</h3>
      {pico.parent ? (
        <div>
          <b className="text-muted">Parent:</b>{" "}
          <Link to={"/pico/" + pico.parent} className="text-mono mr-2">
            {pico.parent}
          </Link>
        </div>
      ) : (
        ""
      )}
      <div>
        <b className="text-muted" title="This is the channel used by the UI">
          UI ECI:
        </b>{" "}
        <span className="text-mono">{pico.eci}</span>
      </div>

      <form
        className="form-inline"
        onSubmit={e => {
          e.preventDefault();
          const name = getRefVal(input_name) || "";
          const backgroundColor = getRefVal(input_backgroundColor) || "";

          savePico.act({
            eci: pico.eci,
            name,
            backgroundColor
          });
        }}
      >
        <div className="form-group">
          <label className="sr-only">Name</label>
          <input
            type="text"
            className="form-control"
            defaultValue={pico.name}
            ref={input_name}
          />
        </div>
        <div className="form-group ml-1 mr-1">
          <label className="sr-only">Color</label>
          <input
            type="color"
            className="form-control p-0"
            style={{ width: 38 }}
            defaultValue={pico.backgroundColor}
            ref={input_backgroundColor}
          />
        </div>
        <button type="submit" className="btn btn-outline-primary">
          Save
        </button>
      </form>

      <h3 className="mt-3">Children</h3>

      {pico.children.length === 0 ? (
        <span className="text-muted">- no children -</span>
      ) : (
        <ul>
          {pico.children.map(eci => {
            return (
              <li key={eci}>
                <Link to={"/pico/" + eci} className="text-mono mr-2">
                  {eci}
                </Link>
                |
                <button
                  className="btn btn-link btn-sm"
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    delPico.act(eci);
                  }}
                >
                  delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="form-inline mt-2"
        onSubmit={e => {
          e.preventDefault();
          const name = getRefVal(input_add_name) || "";
          const backgroundColor = getRefVal(input_add_backgroundColor) || "";

          addPico.act({
            eci: pico.eci,
            name,
            backgroundColor
          });
        }}
      >
        <div className="form-group">
          <label className="sr-only">Name</label>
          <input type="text" className="form-control" ref={input_add_name} />
        </div>
        <div className="form-group ml-1 mr-1">
          <label className="sr-only">Color</label>
          <input
            type="color"
            className="form-control p-0"
            style={{ width: 38 }}
            defaultValue={pico.backgroundColor}
            ref={input_add_backgroundColor}
          />
        </div>
        <button type="submit" className="btn btn-outline-primary">
          Add
        </button>
      </form>
    </div>
  );
};

export default About;
