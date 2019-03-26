import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { State, PicoBox, PicoDetails } from "./State";

type AsyncAction = ThunkAction<void, State, {}, Action>;
export type Dispatch = ThunkDispatch<State, {}, Action>;

export function getUiContext(): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "GET_UI_CONTEXT_START" });
    fetch("/api/ui-context")
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "GET_UI_CONTEXT_OK", data });
        dispatch(getPicoBox(data.eci));
      })
      .catch(err => {
        dispatch({ type: "GET_UI_CONTEXT_ERROR", error: err + "" });
      });
  };
}

interface GET_UI_CONTEXT_START {
  type: "GET_UI_CONTEXT_START";
}
interface GET_UI_CONTEXT_OK {
  type: "GET_UI_CONTEXT_OK";
  data: {
    version: string;
    eci: string;
  };
}
interface GET_UI_CONTEXT_ERROR {
  type: "GET_UI_CONTEXT_ERROR";
  error: string;
}

export function startPicoMove(eci: string): START_PICO_MOVE {
  return { type: "START_PICO_MOVE", eci };
}
interface START_PICO_MOVE {
  type: "START_PICO_MOVE";
  eci: string;
}

export function startPicoResize(eci: string): START_PICO_RESIZE {
  return { type: "START_PICO_RESIZE", eci };
}
interface START_PICO_RESIZE {
  type: "START_PICO_RESIZE";
  eci: string;
}

export function picosMouseMove(x: number, y: number): PICOS_MOUSE_MOVE {
  return { type: "PICOS_MOUSE_MOVE", x, y };
}
interface PICOS_MOUSE_MOVE {
  type: "PICOS_MOUSE_MOVE";
  x: number;
  y: number;
}

export function picosMouseUp(): AsyncAction {
  return function(dispatch, getState) {
    const state = getState();
    for (const eci of [state.pico_moving, state.pico_resizing]) {
      const pico = eci && state.picos[eci];
      if (pico && pico.box) {
        dispatch(
          putPicoBox(pico.box.eci, {
            x: pico.box.x,
            y: pico.box.y,
            width: pico.box.width,
            height: pico.box.height
          })
        );
      }
    }
    dispatch({ type: "PICOS_MOUSE_UP" });
  };
}
interface PICOS_MOUSE_UP {
  type: "PICOS_MOUSE_UP";
}

export function getPicoBox(eci: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "GET_PICOBOX_START", eci });
    fetch(`/c/${eci}/query/io.picolabs.next/box`)
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "GET_PICOBOX_OK", eci, data });
        for (const eci of data.children) {
          dispatch(getPicoBox(eci));
        }
      })
      .catch(err => {
        dispatch({ type: "GET_PICOBOX_ERROR", eci, error: err + "" });
      });
  };
}

interface GET_PICOBOX_START {
  type: "GET_PICOBOX_START";
  eci: string;
}
interface GET_PICOBOX_OK {
  type: "GET_PICOBOX_OK";
  eci: string;
  data: PicoBox;
}
interface GET_PICOBOX_ERROR {
  type: "GET_PICOBOX_ERROR";
  eci: string;
  error: string;
}

export function putPicoBox(
  eci: string,
  toUpdate: {
    name?: string;
    backgroundColor?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "PUT_PICOBOX_START", eci });
    fetch(`/c/${eci}/event/engine-ui/box/query/io.picolabs.next/box`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(toUpdate)
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "PUT_PICOBOX_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "PUT_PICOBOX_ERROR", eci, error: err + "" });
      });
  };
}
interface PUT_PICOBOX_START {
  type: "PUT_PICOBOX_START";
  eci: string;
}
interface PUT_PICOBOX_OK {
  type: "PUT_PICOBOX_OK";
  eci: string;
  data: PicoBox;
}
interface PUT_PICOBOX_ERROR {
  type: "PUT_PICOBOX_ERROR";
  eci: string;
  error: string;
}

export function newPico(
  eci: string,
  attrs: {
    name: string;
    backgroundColor: string;
  }
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "NEW_PICO_START", eci });
    fetch(`/c/${eci}/event/engine-ui/new/query/io.picolabs.next/box`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(attrs)
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "NEW_PICO_OK", eci, data });

        // TODO use getState to only load the new ECI
        for (const eci of data.children) {
          dispatch(getPicoBox(eci));
        }
      })
      .catch(err => {
        dispatch({ type: "NEW_PICO_ERROR", eci, error: err + "" });
      });
  };
}
interface NEW_PICO_START {
  type: "NEW_PICO_START";
  eci: string;
}
interface NEW_PICO_OK {
  type: "NEW_PICO_OK";
  eci: string;
  data: PicoBox;
}
interface NEW_PICO_ERROR {
  type: "NEW_PICO_ERROR";
  eci: string;
  error: string;
}

export function delPico(parentEci: string, eci: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "DEL_PICO_START", parentEci, eci });
    fetch(`/c/${parentEci}/event-wait/engine-ui/del?eci=${eci}`)
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "DEL_PICO_OK", parentEci, eci });
      })
      .catch(err => {
        dispatch({ type: "DEL_PICO_ERROR", parentEci, eci, error: err + "" });
      });
  };
}
interface DEL_PICO_START {
  type: "DEL_PICO_START";
  parentEci: string;
  eci: string;
}
interface DEL_PICO_OK {
  type: "DEL_PICO_OK";
  parentEci: string;
  eci: string;
}
interface DEL_PICO_ERROR {
  type: "DEL_PICO_ERROR";
  parentEci: string;
  eci: string;
  error: string;
}

export function getPicoDetails(eci: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "GET_PICODETAILS_START", eci });
    fetch(`/c/${eci}/query/io.picolabs.next/pico`)
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "GET_PICODETAILS_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "GET_PICODETAILS_ERROR", eci, error: err + "" });
      });
  };
}
interface GET_PICODETAILS_START {
  type: "GET_PICODETAILS_START";
  eci: string;
}
interface GET_PICODETAILS_OK {
  type: "GET_PICODETAILS_OK";
  eci: string;
  data: PicoDetails;
}
interface GET_PICODETAILS_ERROR {
  type: "GET_PICODETAILS_ERROR";
  eci: string;
  error: string;
}

export type Action =
  | GET_UI_CONTEXT_START
  | GET_UI_CONTEXT_OK
  | GET_UI_CONTEXT_ERROR
  | START_PICO_MOVE
  | START_PICO_RESIZE
  | PICOS_MOUSE_MOVE
  | PICOS_MOUSE_UP
  | GET_PICOBOX_START
  | GET_PICOBOX_OK
  | GET_PICOBOX_ERROR
  | PUT_PICOBOX_START
  | PUT_PICOBOX_OK
  | PUT_PICOBOX_ERROR
  | NEW_PICO_START
  | NEW_PICO_OK
  | NEW_PICO_ERROR
  | DEL_PICO_START
  | DEL_PICO_OK
  | DEL_PICO_ERROR
  | GET_PICODETAILS_START
  | GET_PICODETAILS_OK
  | GET_PICODETAILS_ERROR;
