import DragHandleIcon from "@mui/icons-material/DragHandle";
import React from "react";
import "./GraphSummary.css";
import CytoscapeComponent from "react-cytoscapejs";

function GraphSummary() {
  const id = "graph-summary-div";

  const elements = [
    { data: { id: "one", label: "Node 1" }, position: { x: 0, y: 0 } },
    { data: { id: "two", label: "Node 2" }, position: { x: 100, y: 0 } },
    {
      data: { source: "one", target: "two", label: "Edge from Node1 to Node2" },
    },
  ];

  return (
    <div id={id}>
      <div className="handle">
        <DragHandleIcon />
      </div>
      <div id="graph-summary-wrapper">
        <div className="item title-wrapper">
          <span>Graph Summary</span>
        </div>
        <div id="graph">
          <CytoscapeComponent
            elements={elements}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

export default GraphSummary;
