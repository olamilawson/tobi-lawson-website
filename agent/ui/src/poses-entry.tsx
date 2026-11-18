// Development only: the pose sheet on its own page (/desk/poses.html on the dev server), no sign-in needed.
import { createRoot } from "react-dom/client";
import Poses from "./screens/Poses";
import "./index.css";

createRoot(document.getElementById("root")!).render(<Poses />);
