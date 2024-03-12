import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import PicosPage from "./components/PicosPage";
import "./bootstrap.4.6.2.min.css";
import "./index.scss";

const mountPoint = document.createElement("DIV");
document.body.append(mountPoint);
const root = createRoot(mountPoint);

root.render(
  <HashRouter>
    <Routes>
      {/* NOTE: Order matters, go from specific to general */}
      <Route path="/pico/:eci/:tab" element={<PicosPage />} />
      <Route path="/pico/:eci" element={<PicosPage />} />
      <Route path="*" element={<PicosPage />} />
    </Routes>
  </HashRouter>,
);
