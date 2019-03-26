import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HashRouter, Route, Switch as RouterSwitch } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunk, { ThunkMiddleware } from "redux-thunk";
import "whatwg-fetch"; // polyfill for fetch
import { Action, getUiContext } from "./Action";
import PicosPage from "./components/PicosPage";
import RulesetsPage from "./components/RulesetsPage";
import "./index.scss";
import reducer from "./reducer";
import { State } from "./State";

const store = createStore(
  reducer,
  applyMiddleware(thunk as ThunkMiddleware<State, Action, {}>)
);

ReactDOM.render(
  <Provider store={store}>
    <HashRouter>
      <RouterSwitch>
        <Route path="/rulesets" component={RulesetsPage} />

        {/* NOTE: Order matters, go from specific to general */}
        <Route path="/pico/:eci/:tab" component={PicosPage} />
        <Route path="/pico/:eci" component={PicosPage} />
        <Route component={PicosPage} />
      </RouterSwitch>
    </HashRouter>
  </Provider>,
  document.getElementById("react-app")
);

store.dispatch(getUiContext());
