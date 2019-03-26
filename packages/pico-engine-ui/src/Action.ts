import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { State } from "./State";

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

export function picosMouseUp(): PICOS_MOUSE_UP {
  return { type: "PICOS_MOUSE_UP" };
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
  data: {
    eci: string;
    children: string[];

    name: string;
    backgroundColor: string;

    x: number;
    y: number;
    width: number;
    height: number;
  };
}
interface GET_PICOBOX_ERROR {
  type: "GET_PICOBOX_ERROR";
  eci: string;
  error: string;
}

export function putPicoBox(
  eci: string,
  name: string,
  backgroundColor: string
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "PUT_PICOBOX_START", eci });
    fetch(`/c/${eci}/event/engine-ui/box/query/io.picolabs.next/box`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ name, backgroundColor })
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
  data: {
    eci: string;
    children: string[];

    name: string;
    backgroundColor: string;

    x: number;
    y: number;
    width: number;
    height: number;
  };
}
interface PUT_PICOBOX_ERROR {
  type: "PUT_PICOBOX_ERROR";
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
  | PUT_PICOBOX_ERROR;
