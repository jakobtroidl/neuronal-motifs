import React from "react";
import Draggable from "react-draggable";
import "./DraggableView.css";
import GraphSummary from "../components/GraphSummary";

function GraphSummaryView() {
  const nodeRef = React.useRef(null);
  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div className="drag-overlay" ref={nodeRef}>
        <GraphSummary />
      </div>
    </Draggable>
  );
}

export default GraphSummaryView;
