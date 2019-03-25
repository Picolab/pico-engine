import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HashRouter, Route, Switch as RouterSwitch } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunk, { ThunkMiddleware } from "redux-thunk";
import "whatwg-fetch"; // polyfill for fetch
import { Action, getUiContext } from "./Action";
import "./index.scss";
import reducer from "./reducer";
import { State } from "./State";

const store = createStore(
  reducer,
  applyMiddleware(thunk as ThunkMiddleware<State, Action, {}>)
);

const Picos = () => {
  return <div>TODO Picos page</div>;
};

const Rulesets = () => {
  return <div>TODO Ruleset editor</div>;
};

const Index = () => {
  return (
    <HashRouter>
      <RouterSwitch>
        <Route path="/rulesets" component={Rulesets} />
        <Route component={Picos} />
      </RouterSwitch>
    </HashRouter>
  );
};

const div = document.createElement("DIV");
document.body.append(div);
ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <Index />
    </Provider>
  </React.Fragment>,
  document.getElementById("react-app")
);

store.dispatch(getUiContext());
