import DragHandleIcon from "@mui/icons-material/DragHandle";
import React from "react";
import "./GraphSummary.css";

function GraphSummary() {
  const id = "graph-summary-div";

  return (
    <div id={id}>
      <div className="handle">
        <DragHandleIcon />
      </div>
      <div id="graph-summary-wrapper">
        <div className="item title-wrapper">
          <span>Graph Summary</span>
        </div>
        <div id="graph" className="item">
          <h2>here we go</h2>
        </div>
      </div>
    </div>
  );
}

export default GraphSummary;
