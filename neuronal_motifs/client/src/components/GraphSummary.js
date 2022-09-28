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

  // checks if neuron is in focused motif
  function isFocused(neuronId) {
    if (context.focusedMotif) {
      return context.focusedMotif.neurons.some((n) => n.bodyId === neuronId);
    }
    return false;
  }

  function getGraphElements() {
    let selectedMotifs = context.selectedMotifs;
    let neuronColors = context.neuronColors;

    let nodes = [];
    let edges = [];

    selectedMotifs.forEach((motif) => {
      // add nodes
      motif.graph.nodes.forEach((node, idx) => {
        nodes.push({
          data: {
            id: node.id.toString(),
            label: isFocused(node.id) ? String.fromCharCode(65 + idx) : "",
            color: isFocused(node.id) ? neuronColors[idx] : "#ccc",
          },
        });
      });
      // add edges
      motif.graph.links.forEach((edge) => {
        if (
          // make sure no edges are added twice
          edges.filter(
            (e) =>
              e.data.target === edge.target && e.data.source === edge.source
          ).length === 0
        ) {
          edges.push({
            data: {
              source: edge.source,
              target: edge.target,
              label: "",
            },
          });
        }
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
              cy.layout({ name: layoutName, randomize: false }).run();
            }}
            elements={getGraphElements()}
            style={{ width: "100%", height: "100%" }}
            stylesheet={[
              {
                selector: "node",
                style: {
                  content: "data(label)",
                  "background-color": "data(color)",
                },
              },
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
