import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";

const Viewer = ({ content }) => {
  const editor = useCreateBlockNote();

  useEffect(() => {
    editor.replaceBlocks(editor.document, content || []);
  }, [editor, content]);

  return <BlockNoteView editor={editor} editable={false} />;
};

let root = null;
let currentContainer = null;

const render = (container, content) => {
  if (!container) return;
  if (!root || currentContainer !== container) {
    if (root) root.unmount();
    root = createRoot(container);
    currentContainer = container;
  }
  root.render(<Viewer content={content} />);
};

const unmount = (container) => {
  if (!root) return;
  if (!container || container === currentContainer) {
    root.unmount();
    root = null;
    currentContainer = null;
  }
};

window.WorksViewer = { render, unmount };
