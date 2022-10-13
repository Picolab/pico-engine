import * as React from "react";
import * as ReactDOM from "react-dom";
import { HashRouter, Route, Switch as RouterSwitch } from "react-router-dom";
import "whatwg-fetch"; // polyfill for fetch
import PicosPage from "./components/PicosPage";
import "./index.scss";

const mountPoint = document.createElement("DIV");
document.body.append(mountPoint);

ReactDOM.render(
  <HashRouter>
    <RouterSwitch>
      {/* NOTE: Order matters, go from specific to general */}

      <Route path="/pico/:eci/:tab" component={PicosPage} />
      <Route path="/pico/:eci" component={PicosPage} />
      <Route component={PicosPage} />
    </RouterSwitch>
  </HashRouter>,
  mountPoint
);
