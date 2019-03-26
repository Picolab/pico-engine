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

const Index = () => {
  return (
    <HashRouter>
      <RouterSwitch>
        <Route path="/rulesets" component={RulesetsPage} />
        <Route component={PicosPage} />
      </RouterSwitch>
    </HashRouter>
  );
};

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <Index />
    </Provider>
  </React.Fragment>,
  document.getElementById("react-app")
);

store.dispatch(getUiContext());
