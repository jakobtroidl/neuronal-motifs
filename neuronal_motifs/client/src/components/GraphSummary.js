import DragHandleIcon from "@mui/icons-material/DragHandle";
import React, {useContext, useEffect, useState} from "react";
import "./GraphSummary.css";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape from "cytoscape";
import COSEBilkent from "cytoscape-cose-bilkent";
import { AppContext } from "../contexts/GlobalContext";

function GraphSummary() {
  const [randomize, setRandomize] = React.useState(true);
  const id = "graph-summary-div";
  let layoutName = "cose-bilkent";

  let context = useContext(AppContext);
  Cytoscape.use(COSEBilkent);

  let layout = {
    name: layoutName,
    randomize: randomize,
  };

  // let elements = getGraphElements();
  const [elements, setElements] = useState(null)
  useEffect(() => {
    setElements(getGraphElements())
  }, [context.selectedMotifs])

  if (
    // hack but don't know how to do it better
    randomize &&
    (context.abstractionLevel > 0.0 || context.globalMotifIndex > 1)
  ) {
    setRandomize(false);
  }

  // checks if neuron is in focused motif
  function isFocused(neuronId) {
    if (context.focusedMotif) {
      return context.focusedMotif.neurons.some((n) => n.bodyId === neuronId);
    }
    return false;
  }

  function isSelectedEdge(edge) {
    if (context.selectedEdge) {
      return context.selectedEdge.source === edge.source && context.selectedEdge.target === edge.target
    }
    return false;
  }

  function getGraphElements() {
    console.log("new")
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


  // useEffect(() => {
  //     if (context.focusedMotif) {
  //         const sourceNodeId = getIdFromNodeKey(context.prevPostNeuronNodeKeys[0])
  //         const targetNodeId = getIdFromNodeKey(context.prevPostNeuronNodeKeys[1])
  //         // let newElement = {
  //         //     ...elements,
  //         //     edges: elements.edges
  //         // }
  //         console.log(elements)
  //
  //     }
  // }, [context.prevPostNeuronNodeKeys])

  function getIdFromNodeKey(nodeKey) {
    const result = context.focusedMotif.neurons.filter((neuron) => neuron.nodeKey === nodeKey)
    return result[0].id
  }

  return (
    <>
      {elements && (
        <div id={id}>
          <div className="handle">
            <DragHandleIcon/>
          </div>
          <div id="graph-summary-wrapper">
            <div className="item title-wrapper">
              <span>Summary</span>
            </div>
            <div id="graph">
              <CytoscapeComponent
                cy={(cy) => {
                  // cy.on("tap", "node", handleNodeClick);
                  // cy.bind("click", "edge", (e) => handleEdgeClick(e));
                  cy.on("click", "edge", (e) => {
                    let edgeData = e.target.data()
                    context.setPrevPostNeuronIds([edgeData.source, edgeData.target]);
                  });
                  cy.layout(layout).run();
                }}
                elements={elements}
                style={{width: "100%", height: "100%"}}
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
                  {
                    selector: 'edge:selected',
                    css: {
                      'line-color': 'red',
                      'target-arrow-color': 'red',
                      'source-arrow-color': 'red'
                    }
                  }
                ]}
                layout={layout}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GraphSummary;
