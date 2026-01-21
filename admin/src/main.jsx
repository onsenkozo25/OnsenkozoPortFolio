import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";
import "cropperjs/dist/cropper.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
