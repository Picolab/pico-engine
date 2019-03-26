import produce from "immer";
import { Action } from "./Action";
import { initialState, State, apiCallStatus } from "./State";

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
      if (state.pico_moving === state.rootPico.eci) {
        state.rootPico.x = action.x;
        state.rootPico.y = action.y;
      } else if (state.pico_resizing === state.rootPico.eci) {
        state.rootPico.width = Math.max(0, action.x - state.rootPico.x);
        state.rootPico.height = Math.max(0, action.y - state.rootPico.y);
      }
      return;

    case "PICOS_MOUSE_UP":
      // TODO signal event to save state
      state.pico_moving = undefined;
      state.pico_resizing = undefined;
      return;
  }
}
