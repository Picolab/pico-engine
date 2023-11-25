import * as ReactDOM from "react-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import "whatwg-fetch"; // polyfill for fetch
import PicosPage from "./components/PicosPage";
import "./bootstrap.4.6.2.min.css";
import "./index.scss";

const mountPoint = document.createElement("DIV");
document.body.append(mountPoint);

ReactDOM.render(
  <HashRouter>
    <Routes>
      {/* NOTE: Order matters, go from specific to general */}
      <Route path="/pico/:eci/:tab" element={<PicosPage />} />
      <Route path="/pico/:eci" element={<PicosPage />} />
      <Route path="*" element={<PicosPage />} />
    </Routes>
  </HashRouter>,
  mountPoint,
);
