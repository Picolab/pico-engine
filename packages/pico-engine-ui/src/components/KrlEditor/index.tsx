import * as ace from "ace-builds";
import "ace-builds/webpack-resolver";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import "./mode-krl";

ace.config.loadModule("ace/ext/searchbox", () => null);

interface Props {
  src?: string;
  theme?: string | null;
  onStatus?: (msg: string) => void;
  onValue?: (src: string) => void;
  readOnly?: boolean;
}

export const themes: { [group: string]: string[] } = {
  bright: [
    "chrome",
    "clouds",
    "crimson_editor",
    "dawn",
    "dreamweaver",
    "eclipse",
    "github",
    "iplastic",
    "katzenmilch",
    "kuroir",
    "solarized_light",
    "sqlserver",
    "textmate",
    "tomorrow",
    "xcode"
  ],
  dark: [
    "ambiance",
    "chaos",
    "clouds_midnight",
    "cobalt",
    "dracula",
    "gob",
    "gruvbox",
    "idle_fingers",
    "kr_theme",
    "merbivore",
    "merbivore_soft",
    "mono_industrial",
    "monokai",
    "pastel_on_dark",
    "solarized_dark",
    "terminal",
    "tomorrow_night",
    "tomorrow_night_blue",
    "tomorrow_night_bright",
    "tomorrow_night_eighties",
    "twilight",
    "vibrant_ink"
  ]
};

export default function KrlEditor(props: Props) {
  const mountDiv = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<ace.Ace.Editor | null>(null);

  useEffect(() => {
    if (!mountDiv.current) return;

    const editor = ace.edit(mountDiv.current, {
      tabSize: 2,
      useSoftTabs: true
    });
    setEditor(editor);

    editor.getSession().setMode("ace/mode/krl");
    editor.setDisplayIndentGuides(false);

    let lastStatus = "ok";
    (editor.getSession() as any).on(
      "changeAnnotation",
      (ignore: any, f: any) => {
        var ann = f.$annotations[0];
        var msg = "ok";
        if (ann) {
          msg = `${ann.type} at ${ann.row + 1}:${ann.column}`;
        }
        if (lastStatus === msg) {
          return;
        }
        lastStatus = msg;
        if (props.onStatus) {
          props.onStatus(msg);
        }
      }
    );

    (editor.getSession() as any).on("change", () => {
      if (editor && props.onValue) {
        const krl = editor.getSession().getValue();
        props.onValue(krl);
      }
    });

    return () => editor.destroy();
  }, [!!mountDiv.current]);

  useEffect(() => {
    if (!editor) return;
    editor.getSession().setValue(props.src || "");
  }, [!!editor, props.src || ""]);

  useEffect(() => {
    if (!editor || !props.theme) return;
    editor.setTheme("ace/theme/" + props.theme);
  }, [!!editor, props.theme]);

  useEffect(() => {
    if (!editor) return;
    editor.setReadOnly(props.readOnly === true);
  }, [!!editor, props.readOnly === true]);

  return <div ref={mountDiv} className="flex-grow-1" />;
}
