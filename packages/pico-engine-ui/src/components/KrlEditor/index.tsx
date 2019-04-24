import * as React from "react";
import * as ace from "ace-builds";
import "ace-builds/webpack-resolver";
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

class KrlEditor extends React.Component<Props> {
  private mountDiv = React.createRef<HTMLDivElement>();

  private editor?: ace.Ace.Editor;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    if (!this.mountDiv.current) {
      return;
    }
    this.editor = ace.edit(this.mountDiv.current, {
      tabSize: 2,
      useSoftTabs: true
    });
    this.editor.getSession().setMode("ace/mode/krl");
    this.editor.setDisplayIndentGuides(false);
    if (this.props.theme) {
      this.editor.setTheme("ace/theme/" + this.props.theme);
    }
    if (this.props.src) {
      this.editor.getSession().setValue(this.props.src);
    }
    this.editor.setReadOnly(this.props.readOnly === true);

    let lastStatus = "ok";
    (this.editor.getSession() as any).on(
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
        const { onStatus } = this.props;
        if (onStatus) {
          onStatus(msg);
        }
      }
    );

    (this.editor.getSession() as any).on("change", () => {
      const { onValue } = this.props;
      if (this.editor && onValue) {
        const krl = this.editor.getSession().getValue();
        onValue(krl);
      }
    });
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (!this.editor) {
      return;
    }
    if (
      this.props.theme !== nextProps.theme &&
      typeof nextProps.theme === "string"
    ) {
      this.editor.setTheme("ace/theme/" + nextProps.theme);
    }
    const oldSrc = this.props.src || "";
    const nextSrc = nextProps.src || "";
    if (oldSrc !== nextSrc) {
      this.editor.getSession().setValue(nextSrc);
    }

    if (this.props.readOnly !== nextProps.readOnly) {
      this.editor.setReadOnly(nextProps.readOnly === true);
    }
  }

  render() {
    return <div ref={this.mountDiv} className="flex-grow-1" />;
  }
}

export default KrlEditor;
