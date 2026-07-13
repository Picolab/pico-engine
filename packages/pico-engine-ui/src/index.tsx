import { createRoot } from "react-dom/client";
import App from "./App";
import "./bootstrap.4.6.2.min.css";
import "./index.scss";

const mountPoint = document.createElement("DIV");
document.body.append(mountPoint);
const root = createRoot(mountPoint);

root.render(<App />);
