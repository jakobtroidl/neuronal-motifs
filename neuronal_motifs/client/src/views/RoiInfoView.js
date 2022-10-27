import React from "react";
import Draggable from "react-draggable";
import "./DraggableView.css";
import GraphSummary from "../components/GraphSummary";
import RoiInfo from "../components/RoiInfo";

function RoiInfoView() {
  const nodeRef = React.useRef(null);
  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div className="drag-overlay" ref={nodeRef}>
        <RoiInfo />
      </div>
    </Draggable>
  );
}

export default RoiInfoView;
