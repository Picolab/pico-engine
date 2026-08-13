import * as React from "react";
import picoPageStore, { OffEngineNode as OffEngineNodeType } from "../stores/picoPageStore";

interface Props {
  node: OffEngineNodeType;
}

const OffEngineNode: React.FC<Props> = ({ node }) => {
  const picoPage = picoPageStore.use();
  const rootElm = React.useRef<HTMLDivElement | null>(null);
  const isMoving =
    picoPage.picoMoving?.offEngine === true &&
    picoPage.picoMoving.action === "moving";

  function mouseDownMove(e: React.MouseEvent) {
    const elm = rootElm.current;
    picoPageStore.setPicoMoving({
      offEngine: true,
      action: "moving",
      relX: elm ? e.clientX - elm.offsetLeft : 0,
      relY: elm ? e.clientY - elm.offsetTop : 0,
    });
  }

  const hostTitle =
    node.hosts && node.hosts.length > 0
      ? node.hosts.join("\n")
      : "Relationship on another engine";

  return (
    <div
      ref={rootElm}
      className={"off-engine-node" + (isMoving ? " off-engine-node-moving" : "")}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      title={hostTitle}
      onMouseDown={mouseDownMove}
    >
      <div className="off-engine-node-label">{node.label}</div>
      {node.hosts && node.hosts.length > 0 ? (
        <div className="off-engine-node-host">
          {node.hosts.length === 1
            ? node.hosts[0]
            : `${node.hosts.length} remote engines`}
        </div>
      ) : null}
    </div>
  );
};

export default OffEngineNode;
