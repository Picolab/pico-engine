import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { State, PicoBox, PicoDetails, TestingSchema } from "./State";

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

export function startPicoMove(
  eci: string,
  x: number,
  y: number
): START_PICO_MOVE {
  return { type: "START_PICO_MOVE", eci, x, y };
}
interface START_PICO_MOVE {
  type: "START_PICO_MOVE";
  eci: string;
  x: number;
  y: number;
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

export function getRulesets(): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "GET_RULESETS_START" });
    fetch(`/api/rulesets`)
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "GET_RULESETS_OK", data: data.rulesets });
      })
      .catch(err => {
        dispatch({ type: "GET_RULESETS_ERROR", error: err + "" });
      });
  };
}
interface GET_RULESETS_START {
  type: "GET_RULESETS_START";
}
interface GET_RULESETS_OK {
  type: "GET_RULESETS_OK";
  data: { [rid: string]: string[] };
}
interface GET_RULESETS_ERROR {
  type: "GET_RULESETS_ERROR";
  error: string;
}

export function installRuleset(
  eci: string,
  rid: string,
  version: string,
  config: any
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "INSTALL_RULESET_START", eci });
    fetch(`/c/${eci}/event/engine-ui/install/query/io.picolabs.next/pico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ rid, version, config })
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "INSTALL_RULESET_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "INSTALL_RULESET_ERROR", eci, error: err + "" });
      });
  };
}
interface INSTALL_RULESET_START {
  type: "INSTALL_RULESET_START";
  eci: string;
}
interface INSTALL_RULESET_OK {
  type: "INSTALL_RULESET_OK";
  eci: string;
  data: PicoDetails;
}
interface INSTALL_RULESET_ERROR {
  type: "INSTALL_RULESET_ERROR";
  eci: string;
  error: string;
}

export function uninstallRuleset(eci: string, rid: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "UNINSTALL_RULESET_START", eci });
    fetch(`/c/${eci}/event/engine-ui/uninstall/query/io.picolabs.next/pico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ rid })
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "UNINSTALL_RULESET_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "UNINSTALL_RULESET_ERROR", eci, error: err + "" });
      });
  };
}
interface UNINSTALL_RULESET_START {
  type: "UNINSTALL_RULESET_START";
  eci: string;
}
interface UNINSTALL_RULESET_OK {
  type: "UNINSTALL_RULESET_OK";
  eci: string;
  data: PicoDetails;
}
interface UNINSTALL_RULESET_ERROR {
  type: "UNINSTALL_RULESET_ERROR";
  eci: string;
  error: string;
}

export function newChannel(eci: string, data: any): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "NEW_CHANNEL_START", eci });
    fetch(`/c/${eci}/event/engine-ui/new-channel/query/io.picolabs.next/pico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(data)
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "NEW_CHANNEL_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "NEW_CHANNEL_ERROR", eci, error: err + "" });
      });
  };
}
interface NEW_CHANNEL_START {
  type: "NEW_CHANNEL_START";
  eci: string;
}
interface NEW_CHANNEL_OK {
  type: "NEW_CHANNEL_OK";
  eci: string;
  data: PicoDetails;
}
interface NEW_CHANNEL_ERROR {
  type: "NEW_CHANNEL_ERROR";
  eci: string;
  error: string;
}

export function delChannel(eci: string, channelId: any): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "DEL_CHANNEL_START", eci });
    fetch(`/c/${eci}/event/engine-ui/del-channel/query/io.picolabs.next/pico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ eci: channelId })
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "DEL_CHANNEL_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "DEL_CHANNEL_ERROR", eci, error: err + "" });
      });
  };
}
interface DEL_CHANNEL_START {
  type: "DEL_CHANNEL_START";
  eci: string;
}
interface DEL_CHANNEL_OK {
  type: "DEL_CHANNEL_OK";
  eci: string;
  data: PicoDetails;
}
interface DEL_CHANNEL_ERROR {
  type: "DEL_CHANNEL_ERROR";
  eci: string;
  error: string;
}

export function getTesting(eci: string, rid: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "GET_TESTING_START", eci, rid });
    fetch(`/c/${eci}/query/${rid}/__testing`)
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "GET_TESTING_OK", eci, rid, data });
      })
      .catch(err => {
        dispatch({ type: "GET_TESTING_ERROR", eci, rid, error: err + "" });
      });
  };
}
interface GET_TESTING_START {
  type: "GET_TESTING_START";
  eci: string;
  rid: string;
}
interface GET_TESTING_OK {
  type: "GET_TESTING_OK";
  eci: string;
  rid: string;
  data: TestingSchema;
}
interface GET_TESTING_ERROR {
  type: "GET_TESTING_ERROR";
  eci: string;
  rid: string;
  error: string;
}

export function sendTestQuery(
  eci: string,
  rid: string,
  name: string,
  args: any
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "TEST_RESULT_CLEAR", eci });
    fetch(`/c/${eci}/query/${rid}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(args)
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "TEST_RESULT_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "TEST_RESULT_ERROR", eci, error: err + "" });
      });
  };
}
export function sendTestEvent(
  eci: string,
  domain: string,
  name: string,
  attrs: any
): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "TEST_RESULT_CLEAR", eci });
    fetch(`/c/${eci}/event-wait/${domain}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(attrs)
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "TEST_RESULT_OK", eci, data });
      })
      .catch(err => {
        dispatch({ type: "TEST_RESULT_ERROR", eci, error: err + "" });
      });
  };
}
interface TEST_RESULT_CLEAR {
  type: "TEST_RESULT_CLEAR";
  eci: string;
}
interface TEST_RESULT_OK {
  type: "TEST_RESULT_OK";
  eci: string;
  data: any;
}
interface TEST_RESULT_ERROR {
  type: "TEST_RESULT_ERROR";
  eci: string;
  error: string;
}

export function changeNewRulesetRid(value: string): Action {
  return { type: "CHANGE_NEWRULESET_RID", value };
}
interface CHANGE_NEWRULESET_RID {
  type: "CHANGE_NEWRULESET_RID";
  value: string;
}

export function makeNewRuleset(rid: string): AsyncAction {
  return function(dispatch, getState) {
    dispatch({ type: "MAKE_NEWRULESET_START" });
    fetch(`/api/new-ruleset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ rid })
    })
      .then(resp => resp.json())
      .then(data => {
        dispatch({ type: "MAKE_NEWRULESET_OK", rid: data.rid });
      })
      .catch(err => {
        dispatch({ type: "MAKE_NEWRULESET_ERROR", error: err + "" });
      });
  };
}
interface MAKE_NEWRULESET_START {
  type: "MAKE_NEWRULESET_START";
}
interface MAKE_NEWRULESET_OK {
  type: "MAKE_NEWRULESET_OK";
  rid: string;
}
interface MAKE_NEWRULESET_ERROR {
  type: "MAKE_NEWRULESET_ERROR";
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
  | GET_PICODETAILS_ERROR
  | GET_RULESETS_START
  | GET_RULESETS_OK
  | GET_RULESETS_ERROR
  | INSTALL_RULESET_START
  | INSTALL_RULESET_OK
  | INSTALL_RULESET_ERROR
  | UNINSTALL_RULESET_START
  | UNINSTALL_RULESET_OK
  | UNINSTALL_RULESET_ERROR
  | NEW_CHANNEL_START
  | NEW_CHANNEL_OK
  | NEW_CHANNEL_ERROR
  | DEL_CHANNEL_START
  | DEL_CHANNEL_OK
  | DEL_CHANNEL_ERROR
  | GET_TESTING_START
  | GET_TESTING_OK
  | GET_TESTING_ERROR
  | TEST_RESULT_CLEAR
  | TEST_RESULT_OK
  | TEST_RESULT_ERROR
  | CHANGE_NEWRULESET_RID
  | MAKE_NEWRULESET_START
  | MAKE_NEWRULESET_OK
  | MAKE_NEWRULESET_ERROR;
