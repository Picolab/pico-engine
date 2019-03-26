import produce from "immer";
import { Action } from "./Action";
import { initialState, State, apiCallStatus, PicoBox } from "./State";

/**
 * The root reducer
 */
export default function reducer(
  stateIn: State = initialState,
  action: Action
): State {
  const state = produce(stateIn, draft => producer(draft, action));
  console.log(action.type, stateIn, state);

  return state;
}

/**
 * Reducers done the easy way.
 *
 * @param state an immer "draft" of the global state you can mutate
 * @param action
 * @returns nothing b/c you should mutate the state "draft"
 */
function producer(state: State, action: Action): void {
  switch (action.type) {
    case "GET_UI_CONTEXT_START":
      state.uiContext_apiSt = apiCallStatus.waiting();
      return;
    case "GET_UI_CONTEXT_OK":
      state.uiContext_apiSt = apiCallStatus.ok();
      state.uiContext = action.data;
      return;
    case "GET_UI_CONTEXT_ERROR":
      state.uiContext_apiSt = apiCallStatus.error(action.error);
      return;

    case "START_PICO_MOVE":
      state.pico_moving = action.eci;
      state.pico_resizing = undefined;
      return;

    case "START_PICO_RESIZE":
      state.pico_moving = undefined;
      state.pico_resizing = action.eci;
      return;

    case "PICOS_MOUSE_MOVE":
      if (state.pico_moving) {
        updatePicoBox(state, state.pico_moving, box => {
          box.x = action.x;
          box.y = action.y;
        });
      } else if (state.pico_resizing) {
        updatePicoBox(state, state.pico_resizing, box => {
          box.width = Math.max(0, action.x - box.x);
          box.height = Math.max(0, action.y - box.y);
        });
      }
      return;

    case "PICOS_MOUSE_UP":
      state.pico_moving = undefined;
      state.pico_resizing = undefined;
      return;

    case "GET_PICOBOX_START":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box_apiSt = apiCallStatus.waiting();
      } else {
        state.picos[action.eci] = {
          box_apiSt: apiCallStatus.waiting(),
          new_apiSt: apiCallStatus.init()
        };
      }
      return;
    case "GET_PICOBOX_OK":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box = action.data;
      }
      return;
    case "GET_PICOBOX_ERROR":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box_apiSt = apiCallStatus.error(action.error);
      }
      return;

    case "PUT_PICOBOX_START":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box_apiSt = apiCallStatus.waiting();
      }
      return;
    case "PUT_PICOBOX_OK":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box = action.data;
      }
      return;
    case "PUT_PICOBOX_ERROR":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box_apiSt = apiCallStatus.error(action.error);
      }
      return;

    case "NEW_PICO_START":
      if (state.picos[action.eci]) {
        state.picos[action.eci].new_apiSt = apiCallStatus.waiting();
      }
      return;
    case "NEW_PICO_OK":
      if (state.picos[action.eci]) {
        state.picos[action.eci].box = action.data;
      }
      return;
    case "NEW_PICO_ERROR":
      if (state.picos[action.eci]) {
        state.picos[action.eci].new_apiSt = apiCallStatus.error(action.error);
      }
      return;

    case "DEL_PICO_START":
      // TODO api status for delete?
      return;
    case "DEL_PICO_OK":
      if (state.picos[action.parentEci]) {
        const pico = state.picos[action.parentEci];
        if (pico.box) {
          pico.box.children = pico.box.children.filter(
            eci => eci !== action.eci
          );
        }
      }
      delete state.picos[action.eci];
      return;
    case "DEL_PICO_ERROR":
      // TODO api status for delete?
      return;
  }
}

function updatePicoBox(
  state: State,
  eci: string,
  update: (box: PicoBox) => void
) {
  const pico = state.picos[eci];
  if (pico && pico.box) {
    update(pico.box);
  }
}
