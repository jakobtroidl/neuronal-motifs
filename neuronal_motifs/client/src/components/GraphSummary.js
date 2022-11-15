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
import { getIdFromNodeKey } from "../utils/edge";

function GraphSummary() {
  const id = "graph-summary-div";
  let layoutName = "cose-bilkent";

  let context = useContext(AppContext);
  Cytoscape.use(COSEBilkent);

  const [layout, setLayout] = useState({
    name: layoutName,
    randomize: true,
    avoidOverlap: true,
  });

  const [elements, setElements] = useState(null);
  useEffect(() => {
    setElements(getGraphElements());
  }, [context.selectedMotifs, context.focusedMotif]);

  useEffect(() => {
    if (
      // hack but don't know how to do it better
      layout.randomize &&
      elements &&
      elements.length > 0 &&
      (context.abstractionLevel > 0.0 || context.globalMotifIndex > 1)
    ) {
      setLayout({
        ...layout,
        randomize: false,
      });
    } else if (
      context.selectedMotifs.length === 0 ||
      context.globalMotifIndex < 1
    ) {
      setLayout({
        ...layout,
        randomize: true,
      });
    }
  }, [
    context.abstractionLevel,
    context.globalMotifIndex,
    context.selectedMotifs,
  ]);

  // checks if neuron is in focused motif
  function isFocused(neuronId, motifIndex) {
    if (context.focusedMotif) {
      return (
        context.focusedMotif.index === motifIndex &&
        context.focusedMotif.neurons.some((n) => n.bodyId === neuronId)
      );
    }
    return false;
  }

  // function isSelectedCytoscapeEdgeFromFocusedMotif(edge) {
  //   // if (context.focusedMotif && context.selectedCytoscapeEdge && !context.selectedSketchElement) {
  //   if (context.focusedMotif && !context.selectedSketchElement) {
  //     return context.focusedMotif.edges.some((e) => String(e.start_neuron_id) === edge.data().source && String(e.end_neuron_id) === edge.data().target);
  //   }
  //   return false;
  // }

  function isEdgeSameAsSketchPanel(edge) {
    if (context.focusedMotif) {
      let isEdgeFromFocusedMotif = context.focusedMotif.edges.some(
        (e) =>
          String(e.start_neuron_id) === edge.data().source &&
          String(e.end_neuron_id) === edge.data().target
      );
      if (isEdgeFromFocusedMotif) {
        if (context.selectedSketchElement) {
          if (context.selectedSketchElement.type === "edge") {
            let sourceId = getIdFromNodeKey(
              context.selectedSketchElement.fromNode.label,
              context
            );
            let targetId = getIdFromNodeKey(
              context.selectedSketchElement.toNode.label,
              context
            );
            return (
              edge.data().source === sourceId && edge.data().target === targetId
            );
          }
        } else if (context.selectedCytoscapeEdge) {
          let sourceId = context.selectedCytoscapeEdge.source;
          let targetId = context.selectedCytoscapeEdge.target;
          return (
            edge.data().source === sourceId && edge.data().target === targetId
          );
        } else {
          // null
          return false;
        }
      }
    }
    return false;
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
      context.setSelectedSketchElement(null);
    });
  });

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout(layout).run();
      cyRef.current.resize();
    }
  }, [elements]);

  function getGraphElements() {
    let selectedMotifs = context.selectedMotifs;
    let neuronColors = context.neuronColors;

    let nodes = [];
    let edges = [];

    let allNodes = selectedMotifs
      .map((motif) => motif.graph.nodes.map((n) => n.id))
      .flat();

    selectedMotifs.forEach((motif) => {
      // add nodes
      motif.graph.nodes.forEach((node, idx) => {
        if (
          allNodes.filter((n) => n === node.id).length > 1 &&
          !isFocused(node.id, motif.index)
        ) {
          // console.log(node);
        } else {
          nodes.push({
            data: {
              id: node.id.toString(),
              label: isFocused(node.id, motif.index)
                ? String.fromCharCode(65 + idx)
                : "",
              color: isFocused(node.id, motif.index)
                ? neuronColors[idx]
                : "#ccc",
            },
          });
        }
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
                      "line-color": (edge) =>
                        isEdgeSameAsSketchPanel(edge) ? "#ff1010" : "#9b9b9b",
                      "target-arrow-color": (edge) =>
                        isEdgeSameAsSketchPanel(edge) ? "#ff1010" : "#9b9b9b",
                    },
                  },
                  // {
                  //   selector: 'edge:selected',
                  //   style: {
                  //     'line-color': edge => isSelectedCytoscapeEdgeFromFocusedMotif(edge) ? 'red' : "",
                  //     'target-arrow-color': edge => isSelectedCytoscapeEdgeFromFocusedMotif(edge) ? 'red' : "",
                  //   }
                  // },
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
