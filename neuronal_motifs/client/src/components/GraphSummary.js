import DragHandleIcon from "@mui/icons-material/DragHandle";
import React, { useContext } from "react";
import "./GraphSummary.css";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape from "cytoscape";
import COSEBilkent from "cytoscape-cose-bilkent";
import { AppContext } from "../contexts/GlobalContext";

function GraphSummary() {
  const id = "graph-summary-div";
  let layoutName = "cose-bilkent";

  let context = useContext(AppContext);
  Cytoscape.use(COSEBilkent);

  function getGraphElements() {
    let selectedMotifs = context.selectedMotifs;

    let nodes = [];
    let edges = [];

    selectedMotifs.forEach((motif) => {
      // add nodes
      motif.graph.nodes.forEach((node, idx) => {
        nodes.push({
          data: {
            id: node.id.toString(),
            label: String.fromCharCode(65 + idx),
          },
        });
      });
      // add edges
      motif.graph.links.forEach((edge) => {
        edges.push({
          data: {
            source: edge.source.toString(),
            target: edge.target.toString(),
            label: "",
          },
        });
      });
    });
    let elements = { nodes: nodes, edges: edges };
    return CytoscapeComponent.normalizeElements(elements);
  }

  function handleClick() {
    console.log("clicked");
  }

  return (
    <div id={id}>
      <div className="handle">
        <DragHandleIcon />
      </div>
      <div id="graph-summary-wrapper">
        <div className="item title-wrapper">
          <span>Summary</span>
        </div>
        <div id="graph">
          <CytoscapeComponent
            cy={(cy) => {
              cy.on("tap", "node", handleClick);
              cy.layout({ name: layoutName }).run();
            }}
            elements={getGraphElements()}
            style={{ width: "100%", height: "100%" }}
            stylesheet={[
              { selector: "node", style: { content: "data(label)" } },
              {
                selector: "edge",
                style: {
                  "curve-style": "bezier",
                  "target-arrow-shape": "triangle",
                },
              },
            ]}
            layout={{ name: layoutName }}
          />
        </div>
      </div>
    </div>
  );
}

export default GraphSummary;
