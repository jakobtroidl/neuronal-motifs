import DragHandleIcon from "@mui/icons-material/DragHandle";
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
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
  const [elements, setElements] = useState(null);
  useEffect(() => {
    setElements(getGraphElements());
  }, [context.selectedMotifs, context.focusedMotif]);

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

  function isSelectedCytoscapeEdgeFromFocusedMotif(edge) {
    if (context.focusedMotif && context.selectedCytoscapeEdge) {
      return context.focusedMotif.edges.some(
        (e) =>
          String(e.start_neuron_id) === edge.data().source &&
          String(e.end_neuron_id) === edge.data().target
      );
    }
    return false;
  }

  function isEdgeSameAsSketchPanel(edge) {
    if (context.focusedMotif && context.selectedSketchElement) {
      let isEdgeFromFocusedMotif = context.focusedMotif.edges.some(
        (e) =>
          String(e.start_neuron_id) === edge.data().source &&
          String(e.end_neuron_id) === edge.data().target
      );
      // console.log(isEdgeFromFocusedMotif)
      // console.log(context.selectedSketchElement)
      if (
        isEdgeFromFocusedMotif &&
        context.selectedSketchElement.type === "edge"
      ) {
        let sourceId = getIdFromNodeKey(
          context.selectedSketchElement.fromNode.label
        );
        let targetId = getIdFromNodeKey(
          context.selectedSketchElement.toNode.label
        );
        // console.log(sourceId, edge.data().source, targetId, edge.data().target)
        // console.log(edge.data().source === sourceId && edge.data().target === targetId)
        return (
          edge.data().source === sourceId && edge.data().target === targetId
        );
      }
    }
    return false;
  }

  function getIdFromNodeKey(nodeKey) {
    const result = context.focusedMotif.neurons.filter(
      (neuron) => neuron.nodeKey === nodeKey
    );
    return String(result[0].id);
  }

  const cyRef = useRef(null);
  useEffect(() => {
    return () => {
      if (cyRef.current) {
        cyRef.current.removeAllListeners();
        cyRef.current = null;
      }
    };
  }, []);

  const cyCallback = useCallback((cy) => {
    if (cyRef.current) return;
    cyRef.current = cy;
    cy.on("tap", "edge", (e) => {
      let edgeData = e.target.data();
      context.setSelectedCytoscapeEdge(edgeData);
    });
    cy.on("add", (e) => {
      cy.layout(layout).run();
    });
  });

  function getGraphElements() {
    console.log("new");
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

  return (
    <>
      {elements && (
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
                cy={cyCallback}
                elements={elements}
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
                      //"line-color": edge => isEdgeSameAsSketchPanel(edge) ? 'red' : "",
                      //'target-arrow-color': edge => isEdgeSameAsSketchPanel(edge) ? 'red' : "",
                    },
                  },
                  {
                    selector: "edge:selected",
                    style: {
                      //'line-color': edge => isSelectedCytoscapeEdgeFromFocusedMotif(edge) ? 'red' : "",
                      //'target-arrow-color': edge => isSelectedCytoscapeEdgeFromFocusedMotif(edge) ? 'red' : "",
                    },
                  },
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
