import React from "react";
import Draggable from "react-draggable";
import "./DraggableView.css";
import MotifPanel from "../components/MotifPanel";

function PanelView() {
  const nodeRef = React.useRef(null);
  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div className="drag-overlay" ref={nodeRef}>
        <MotifPanel />
      </div>
    </Draggable>
  );
}

export default PanelView;
