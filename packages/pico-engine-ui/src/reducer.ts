import produce from "immer";
import { Action } from "./Action";
import { initialState, State } from "./State";

/**
 * The root reducer
 */
export default function reducer(
  stateIn: State = initialState,
  action: Action
): State {
  const state = produce(stateIn, draft => producer(draft, action));
  console.log(state, "State");

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
      return;
    case "GET_UI_CONTEXT_OK":
      state.version = action.data.version;
      return;
    case "GET_UI_CONTEXT_ERROR":
      return;
  }
}
