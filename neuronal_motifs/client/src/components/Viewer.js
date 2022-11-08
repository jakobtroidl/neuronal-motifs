import React, { useContext, useEffect, useState } from "react";
import SharkViewer, { stretch, swcParser } from "./shark_viewer";
import {
  bundle,
  getClusterLineName,
  clusterSynapses,
  hierarchicalBundling,
} from "../services/bundling";
import ArrowTooltips from "./ArrowTooltips";
import { AppContext } from "../contexts/GlobalContext";
import "./Viewer.css";
import * as THREE from "three";
import { InteractionManager } from "three.interactive";
import { Color, mapQueryResult } from "../utils/rendering";
import _ from "lodash";
import BasicMenu from "./ContextMenu";
import axios from "axios";
import { getAuthToken } from "../utils/authentication";
import { getIdFromNodeKey } from "../utils/edge";

const groupFocused = (group, focusedMotif) => {
  let containsStart =
    focusedMotif.neurons.filter((n) => n.bodyId === group.start_id).length > 0;
  let containsEnd =
    focusedMotif.neurons.filter((n) => n.bodyId === group.end_id).length > 0;
  return containsStart && containsEnd;
};

const getEdgeGroups = (motifs, boundary, neurons, factor) => {
  let groups = {};

  let directions = getTranslationVectors(neurons.length);

  boundary = Math.round(boundary);

  motifs.forEach((motif) => {
    motif.edges.forEach((edge) => {
      let [pre_neuron, pre_neuron_number] = getNeuronListId(
        neurons,
        edge.start_neuron_id
      );
      let [post_neuron, post_neuron_number] = getNeuronListId(
        neurons,
        edge.end_neuron_id
      );

      if (
        // make sure no lines are added twice
        motif.graph.links.some(
          (e) =>
            e.source === edge.start_neuron_id && e.target === edge.end_neuron_id
        )
      ) {
        let pre_loc = new THREE.Vector3();
        if (boundary in edge.abstraction.start) {
          pre_loc.fromArray(edge.abstraction.start[boundary]);
        } else if (boundary <= pre_neuron.meta.min_skel_label) {
          pre_loc.fromArray(pre_neuron.meta.abstraction_center);
        } else {
          // let keys = Object.keys(edge.abstraction.start);
          // const closest = keys.reduce((a, b) => {
          //   return Math.abs(b - boundary) < Math.abs(a - boundary) ? b : a;
          // });
          // pre_loc.fromArray(edge.abstraction.start[closest]);
          pre_loc.fromArray(edge.default_start_position);
        }

        let translate = new THREE.Vector3(
          factor * directions[pre_neuron_number][0],
          factor * directions[pre_neuron_number][1],
          factor * directions[pre_neuron_number][2]
        );

        let default_start = new THREE.Vector3().fromArray(
          edge.default_start_position
        );
        default_start = default_start.add(translate);
        let line_start = pre_loc.add(translate);
        //let line_start = pre_loc;

        let post_loc = new THREE.Vector3();
        if (boundary in edge.abstraction.end) {
          post_loc.fromArray(edge.abstraction.end[boundary]);
        } else if (boundary <= post_neuron.meta.min_skel_label) {
          post_loc.fromArray(post_neuron.meta.abstraction_center);
        } else {
          // let keys = Object.keys(edge.abstraction.end);
          // const closest = keys.reduce((a, b) => {
          //   return Math.abs(b - boundary) < Math.abs(a - boundary) ? b : a;
          // });
          // post_loc.fromArray(edge.abstraction.end[closest]);
          post_loc.fromArray(edge.default_end_position);
        }

        translate = new THREE.Vector3(
          factor * directions[post_neuron_number][0],
          factor * directions[post_neuron_number][1],
          factor * directions[post_neuron_number][2]
        );
        let line_end = post_loc.add(translate);
        let default_end = new THREE.Vector3().fromArray(
          edge.default_end_position
        );
        default_end = default_end.add(translate);

        //let line_end = post_loc;

        let group_id = edge.start_neuron_id + "-" + edge.end_neuron_id;
        if (!(group_id in groups)) {
          groups[group_id] = {
            start: [],
            end: [],
            default_start: [],
            default_end: [],
            start_id: edge.start_neuron_id,
            end_id: edge.end_neuron_id,
          };
        }
        let group_points = groups[group_id];
        group_points["start"].push(line_start);
        group_points["end"].push(line_end);
        group_points["default_start"].push(default_start);
        group_points["default_end"].push(default_end);
      }
    });
  });

  return groups;
};

const setSynapseVisibility = (scene, visible) => {
  scene.children.forEach((child) => {
    if (typeof child.name == "string" && child.name.includes("syn")) {
      child.visible = visible;
    }
  });
};

const getNeuronListId = (neurons, id) => {
  let out_id = -1;
  let out_neuron = undefined;
  neurons.forEach((neuron, i) => {
    if (neuron.name === id) {
      out_id = i;
      out_neuron = neuron;
    }
  });
  return [out_neuron, out_id];
};

/**
 * Computes uniformly distributed points on the unit sphere
 * @param count: number of points to sample
 * @return {[number,number,number][]}
 */
const getTranslationVectors = (count) => {
  // Following Saff and Kuijlaars via https://discuss.dizzycoding.com/evenly-distributing-n-points-on-a-sphere/
  const indices = _.range(0.5, count + 0.5);
  const phi = indices.map((ind) => {
    return Math.acos(1 - (2 * ind) / count);
  });
  const theta = indices.map((ind) => {
    return Math.PI * (1 + Math.sqrt(5)) * ind;
  });
  let directions = _.range(count).map((i) => {
    const x = Math.cos(_.toNumber(theta[i])) * Math.sin(phi[i]);
    const y = Math.sin(_.toNumber(theta[i])) * Math.sin(phi[i]);
    const z = Math.cos(phi[i]);
    return [x, y, z];
  });
  return directions;
};

function addNeurons(
  motif,
  context,
  sharkViewerInstance,
  scene,
  updateCamera,
  translate
) {
  motif.neurons.forEach((neuron, i) => {
    let oldNeuron = scene.getObjectByName(neuron.id);
    let parsedSwc = swcParser(neuron.skeleton_swc);
    let color = context.neuronColors[i];
    let [neuronObject, motif_path] = sharkViewerInstance.loadNeuron(
      neuron.id,
      color,
      parsedSwc,
      updateCamera
    );

    context.setMotifPathPosition(motif_path);

    neuronObject.motifs = [motif];
    if (oldNeuron) {
      neuronObject.motifs = neuronObject.motifs.concat(oldNeuron.motifs);
      scene.remove(oldNeuron);
    }
    neuronObject.meta = { ...neuron };
    neuronObject.translateX(translate.x);
    neuronObject.translateY(translate.y);
    neuronObject.translateZ(translate.z);

    neuronObject.origin = new THREE.Vector3(
      translate.x,
      translate.y,
      translate.z
    );

    scene.add(neuronObject);
  });
}

function getAbstractionCenterName(neuron) {
  return "abstraction-center-" + neuron.id;
}

function addAbstractionCenters(motif, context, scene, interactionManager) {
  motif.neurons.forEach((neuron, i) => {
    if (!scene.getObjectByName(getAbstractionCenterName(neuron))) {
      let geometry = new THREE.SphereGeometry(200, 16, 16);
      let material = new THREE.MeshPhongMaterial({
        color: context.neuronColors[i],
      });
      let mesh = new THREE.Mesh(geometry, material);
      mesh.name = getAbstractionCenterName(neuron);
      mesh.position.x = neuron.abstraction_center[0];
      mesh.position.y = neuron.abstraction_center[1];
      mesh.position.z = neuron.abstraction_center[2];

      scene.add(mesh);
    }
  });
}

function getLineName(synapse) {
  return "line-" + synapse.pre + "-" + synapse.post;
}

function getSynapseNameFromLocations(pre_loc, post_loc, flipped = false) {
  let pre = pre_loc[0] + "-" + pre_loc[1] + "-" + pre_loc[2];
  let post = post_loc[0] + "-" + post_loc[1] + "-" + post_loc[2];

  if (flipped) {
    return "syn-" + post + "-" + pre;
  } else {
    return "syn-" + pre + "-" + post;
  }
}

function getSynapseName(synapse, flipped = false) {
  let pre_loc = synapse.pre.x + "-" + synapse.pre.y + "-" + synapse.pre.z;
  let post_loc = synapse.post.x + "-" + synapse.post.y + "-" + synapse.post.z;

  if (flipped) {
    return "syn-" + post_loc + "-" + pre_loc;
  } else {
    return "syn-" + pre_loc + "-" + post_loc;
  }
}

function getSynapseIds(pre_id, post_id) {
  return "syn-" + pre_id + "-" + post_id;
}

function removeSynapseDuplicates(scene) {
  scene.children.forEach((child) => {
    if (
      typeof child.name === "string" &&
      child.name.startsWith("syn-") &&
      child.snapToNeuron === child.post
    ) {
      child.visible = false;
    }
  });
}

function addLights(scene) {
  let ambientName = "ambient-light";
  if (!scene.getObjectByName(ambientName)) {
    const ambientLight = new THREE.AmbientLight(Color.white, 1.0);
    ambientLight.name = ambientName;
    scene.add(ambientLight);
  }
  let directionalName = "directional-light";
  if (!scene.getObjectByName(directionalName)) {
    const directionalLight = new THREE.DirectionalLight(Color.white, 0.7);
    directionalLight.name = directionalName;
    scene.add(directionalLight);
  }
}

function greyOutObjects(sharkViewerInstance, exclude = []) {
  let scene = sharkViewerInstance.scene;
  scene.children.forEach((child) => {
    if (!exclude.includes(child.name) && (child.isMesh || child.isObject3D)) {
      if (child.isNeuron) {
        child.oldColor = child.color;
        sharkViewerInstance.setColor(child, Color.grey);
      } else {
        if (child.material) {
          child.oldMaterial = child.material.clone();
        }
        child.material = new THREE.MeshPhongMaterial({ color: Color.grey });
        child.material.needsUpdate = true;
      }
    }
  });
}

function colorMotif(sharkViewerInstance, motif, colors) {
  let scene = sharkViewerInstance.scene;
  // color neurons
  motif.neurons.forEach((neuron, i) => {
    let neuronObject = scene.getObjectByName(neuron.id);
    if (neuronObject) {
      sharkViewerInstance.setColor(neuronObject, colors[i]);
    }
    // update abstraction center color
    // let abstractionCenterName = getAbstractionCenterName(neuron);
    // let abstractionCenter = scene.getObjectByName(abstractionCenterName);
    // if (abstractionCenter) {
    //   abstractionCenter.material = new THREE.MeshPhongMaterial({
    //     color: colors[i],
    //   });
    //   abstractionCenter.material.needsUpdate = true;
    // }
  });
}

function restoreColors(sharkViewerInstance) {
  let scene = sharkViewerInstance.scene;
  scene.children.forEach((child) => {
    if (child.isMesh || child.isObject3D) {
      if (child.isNeuron && child.oldColor) {
        sharkViewerInstance.setColor(child, child.oldColor);
      } else if (child.oldMaterial) {
        child.material = child.oldMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
}

function resetSynapsesColor(sharkViewerInstance) {
  let scene = sharkViewerInstance.scene;
  scene.traverse((child) => {
    if (
      typeof child.name === "string" &&
      child.name.startsWith("syn-") &&
      child.neuron_ids.startsWith("syn-")
    ) {
      //child.material = new THREE.MeshPhongMaterial({ color: Color.orange });
      child.material = child.oldMaterial;
      child.material.needsUpdate = true;
      child.highlighted = false;
    }
  });
}

function Viewer() {
  const id = "my_shark_viewer";
  const className = "shark_viewer";
  let motif_synapse_suggestions_name = "motif-synapse-suggestions";

  const context = useContext(AppContext);

  let factor = 15000;
  let offset = 0.001;
  let syn_clusters_identifier = "clusters";
  let lines_identifier = "lines";
  let line_clusters_identifier = "line_clusters";

  const [motif, setMotif] = React.useState();
  const [sharkViewerInstance, setSharkViewerInstance] = useState();
  const [prevSliderValue, setPrevSliderValue] = useState();
  const [edgesEnabled, setEdgesEnabled] = useState(false);
  const [displayTooltip, setDisplayTooltip] = useState(false); // for synapse selecting & highlighting
  const [tooltipInfo, setTooltipInfo] = useState({});
  const [highlightSynapse, setHighlightedSynapse] = useState({
    highlight: false,
    pre_id: null,
    post_id: null,
  });
  const [neurons, setNeurons] = useState([]);
  const [synapses, setSynapses] = useState([]);

  const [displayContextMenu, setDisplayContextMenu] = useState({
    display: false,
    position: { x: 0, y: 0 },
    neuron: null,
    motif: null,
  });

  function setSynapseColorToConnectingNeuron(scene) {
    scene.children.forEach((child) => {
      if (typeof child.name === "string" && child.name.startsWith("syn-")) {
        let color;
        if (child.pre === child.snapToNeuron) {
          let [neuron, idx] = getNeuronListId(neurons, child.post);
          color = context.neuronColors[idx];
        } else if (child.post === child.snapToNeuron) {
          let [neuron, idx] = getNeuronListId(neurons, child.pre);
          color = context.neuronColors[idx];
        } else {
          color = Color.orange;
        }

        child.material = new THREE.MeshPhongMaterial({
          color: color,
        });
        child.oldMaterial = child.material.clone();
        child.material.needsUpdate = true;
        child.highlighted = false;
      }
    });
  }

  function setSynapseColorToBaseColor(scene) {
    scene.children.forEach((child) => {
      if (typeof child.name === "string" && child.name.startsWith("syn-")) {
        child.material = new THREE.MeshPhongMaterial({
          color: Color.orange,
        });
        child.oldMaterial = child.material.clone();
        child.material.needsUpdate = true;
        child.highlighted = false;
      }
    });
  }

  function setDuplicateSynapsesToVisible(scene) {
    scene.children.forEach((child) => {
      if (typeof child.name === "string" && child.name.startsWith("syn-")) {
        child.visible = true;
      }
    });
  }

  function addSynapses(
    motif,
    setDisplayTooltip,
    setTooltipInfo,
    scene,
    interactionManager,
    onClickHighlightEdgesAndSynapses
  ) {
    let synapses = motif.syn_clusters;
    synapses.forEach((connection, i) => {
      connection.pre_loc.forEach((pre_syn_location, j) => {
        addSynapse(
          scene,
          connection.pre,
          connection.post,
          pre_syn_location,
          connection.post_loc[j],
          Color.orange,
          motif,
          setDisplayTooltip,
          setTooltipInfo,
          interactionManager,
          onClickHighlightEdgesAndSynapses,
          connection.pre,
          true
        );
        addSynapse(
          scene,
          connection.pre,
          connection.post,
          pre_syn_location,
          connection.post_loc[j],
          Color.orange,
          motif,
          setDisplayTooltip,
          setTooltipInfo,
          interactionManager,
          onClickHighlightEdgesAndSynapses,
          connection.post,
          false
        );
      });
    });
  }

  function addSynapse(
    scene,
    pre_id,
    post_id,
    pre_syn_location,
    post_syn_location,
    color,
    motif,
    setDisplayTooltip,
    setTooltipInfo,
    interactionManager,
    onClickHighlightEdgesAndSynapses,
    snapToNeuron,
    visible
  ) {
    // create a sphere shape
    let name = getSynapseNameFromLocations(
      pre_syn_location,
      post_syn_location,
      false
    );
    let neuron_ids = getSynapseIds(pre_id, post_id);
    //if (!scene.getObjectByName(name)) {
    let geometry = new THREE.SphereGeometry(100, 16, 16);
    let material = new THREE.MeshPhongMaterial({ color: color });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.neuron_ids = neuron_ids;
    mesh.name = name;
    mesh.position.x = (post_syn_location[0] + pre_syn_location[0]) / 2.0;
    mesh.position.y = (post_syn_location[1] + pre_syn_location[1]) / 2.0;
    mesh.position.z = (post_syn_location[2] + pre_syn_location[2]) / 2.0;

    mesh.origin = new THREE.Vector3().copy(mesh.position);
    mesh.oldMaterial = material.clone();
    mesh.pre = pre_id;
    mesh.post = post_id;

    mesh.snapToNeuron = snapToNeuron;

    mesh.motifs = [motif];
    mesh.highlighted = false;
    mesh.visible = visible;

    mesh.addEventListener("mouseover", (event) => {
      setDisplayTooltip(true);
      setTooltipInfo({
        pre_soma_dist: 0.0,
        post_soma_dist: 0.0, // TODO fix this
        event: event,
      });
      document.body.style.cursor = "pointer";

      mesh.oldMaterial = mesh.material.clone();

      mesh.material = new THREE.MeshPhongMaterial({ color: Color.pink });
      mesh.material.needsUpdate = true;
    });

    mesh.addEventListener("mouseout", (event) => {
      setDisplayTooltip(false);
      document.body.style.cursor = "default";
      if (mesh.highlighted) {
        mesh.material = new THREE.MeshPhongMaterial({ color: Color.red });
        mesh.material.needsUpdate = true;
        mesh.highlighted = true;
      } else {
        mesh.material = mesh.oldMaterial;
        mesh.material.needsUpdate = true;
        mesh.highlighted = false;
      }
    });

    mesh.addEventListener("click", (event) => {
      onClickHighlightEdgesAndSynapses(mesh);
    });

    interactionManager.add(mesh);

    setSynapses([...synapses, mesh]);
    scene.add(mesh);
    return mesh;
    // } else {
    //   let mesh = scene.getObjectByName(name);
    //   mesh.motifs.push(motif);
    //   return mesh;
    // }
  }

  function removeSynapseSuggestions() {
    if (sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      scene.children.forEach((child) => {
        if (child.name === motif_synapse_suggestions_name) {
          scene.remove(child);
        }
      });
    }
  }

  function removeLines() {
    let scene = sharkViewerInstance.scene;
    let lines = scene.getObjectByName(lines_identifier);
    lines.remove(...lines.children);
  }

  function handleKeyPress(event) {
    // check if R key was pressed
    if (event.key === "r") {
      console.log("r was pressed");
      restoreColors(sharkViewerInstance);
      removeSynapseSuggestions();
      context.setNeighborhoodQuery(null);
    } else if (event.key === "c") {
      console.log("c was pressed");
      resetSynapsesColor(sharkViewerInstance);
      unselectEdges();
      setLineVisibility(sharkViewerInstance.scene, 0.0, false);
    }
    // if (event.key === "c") {
    //   console.log("c was pressed");
    //   removeLines();
    // }
  }

  function onLineClick(event, line) {
    console.log("line click");
    // if (!line.oldColor) {
    //   line.oldColor = line.material.clone();
    //   line.material = new THREE.LineBasicMaterial({
    //     color: Color.blue,
    //   });
    // } else {
    //   line.material = line.oldColor;
    //   line.oldColor = null;
    // }
    //
    // line.material.needsUpdate = true;
  }

  function onNeuronClick(event, neuron) {
    /**
     * Callback executed in SharkViewer when a neuron is clicked
     * @param event: mouse event
     * @param neuron: neuron object
     * Displays a context menu on Click + Alt Key
     */
    if (neuron != null && event.altKey) {
      console.log("click + alt key");
      setDisplayContextMenu({
        display: true,
        position: { x: event.clientX, y: event.clientY },
        neuron: neuron,
        motif: this.motifQuery,
      });
      //setHighlightNeuron(neuron, true);
    } else {
      console.log("No neuron selected");
      setDisplayContextMenu({
        display: false,
        position: { x: 0, y: 0 },
        neuron: null,
        motif: [],
      });
    }
  }

  useEffect(() => {
    if (sharkViewerInstance && context.focusedMotif) {
      greyOutObjects(sharkViewerInstance);
      colorMotif(
        sharkViewerInstance,
        context.focusedMotif,
        context.neuronColors
      );
      let scene = sharkViewerInstance.scene;
      let abstractionBoundary = getAbstractionBoundary(sharkViewerInstance);
      refreshEdges(scene, abstractionBoundary);
      console.log("recolored focused motif");
    }
  }, [context.focusedMotif]);

  useEffect(() => {
    if (sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      scene.traverse((child) => {
        if (
          child.parent &&
          child.parent.name === motif_synapse_suggestions_name &&
          typeof child.name === "string" &&
          child.name.startsWith("syn-")
        ) {
          let name = child.name.split("-");
          let pre_id = parseInt(name[1]);
          let post_id = parseInt(name[2]);
          if (
            highlightSynapse.highlight &&
            (highlightSynapse.pre_id === pre_id ||
              highlightSynapse.post_id === post_id)
          ) {
            child.oldMaterial = child.material.clone();
            child.material = new THREE.MeshPhongMaterial({ color: Color.red });
            child.material.needsUpdate = true;
          } else if (!highlightSynapse.highlight && child.oldMaterial) {
            child.material = child.oldMaterial;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [highlightSynapse.highlight]);

  function onSynapseSuggestionClick(synapse, type = "input") {
    /**
     * @param synapse: clicked on synapse object
     * @param type: synapse type. can be "input" or "output"
     */
    console.log("synapse suggestion click");
    if (context.neighborhoodQuery) {
      let neighborhoodQuery = context.neighborhoodQuery;
      let selected_label = neighborhoodQuery.selectedNode.label;
      neighborhoodQuery.results.forEach((result) => {
        // iterate over all elements in result
        for (const [label, neuron] of Object.entries(result)) {
          if (selected_label !== label) {
            if (
              (type === "input" && neuron.bodyId === synapse.pre_id) ||
              (type === "output" && neuron.bodyId === synapse.post_id)
            ) {
              let motifToAdd = mapQueryResult(result, context.globalMotifIndex);
              context.setGlobalMotifIndex(context.globalMotifIndex + 1);
              context.setMotifToAdd(motifToAdd);

              restoreColors(sharkViewerInstance);
              removeSynapseSuggestions();
              return true;
            }
          }
        }
      });
      return false;
    }
    return false;
  }

  function onSynapseSuggestionEvent(
    cursor = "default",
    show = true,
    pre_id = null,
    post_id = null
  ) {
    document.body.style.cursor = cursor;
    setHighlightedSynapse({
      highlight: show,
      pre_id: pre_id,
      post_id: post_id,
    });
  }

  function addSynapseSuggestions(
    synapses_suggestions,
    type = "input",
    parent = null
  ) {
    /**
     * @param synapses: array of synapse objects
     * @param type: 'input' or 'output'
     * @param parent: parent object 3D
     */
    if (sharkViewerInstance) {
      let interactionManager = sharkViewerInstance.scene?.interactionManager;
      for (let [label, synapses] of Object.entries(synapses_suggestions)) {
        synapses.forEach((syn) => {
          let mesh = addSynapse(
            parent,
            syn,
            type === "input" ? Color.orange : Color.blue
          );
          mesh.addEventListener("mouseover", (event) =>
            onSynapseSuggestionEvent(
              "pointer",
              true,
              type === "input" ? syn.pre_id : null,
              type === "output" ? syn.post_id : null
            )
          );
          mesh.addEventListener("mouseout", (event) =>
            onSynapseSuggestionEvent("default", false, null, null)
          );
          mesh.addEventListener("click", (event) =>
            onSynapseSuggestionClick(syn, type)
          );
          interactionManager.add(mesh);
        });
      }
    }
  }

  useEffect(async () => {
    if (
      context.neighborhoodQuery &&
      sharkViewerInstance &&
      context.motifQuery
    ) {
      let results = context.neighborhoodQuery.results;
      let selectedNode = context.neighborhoodQuery.selectedNode;
      let clickedNeuronId = context.neighborhoodQuery.clickedNeuronId;
      let query = context.motifQuery;

      // get all connected neurons to currently selected neuron
      let inputNeurons = {};
      let outputNeurons = {};
      query.edges.forEach((edge) => {
        if (edge.indices[0] === selectedNode.index) {
          let neighbor_node = query.nodes.find(
            (node) => node.index === edge.indices[1]
          );
          outputNeurons[neighbor_node.label] = [];
        }
        if (edge.indices[1] === selectedNode.index) {
          let neighbor_node = query.nodes.find(
            (node) => node.index === edge.indices[0]
          );
          inputNeurons[neighbor_node.label] = [];
        }
      });

      results.forEach((result) => {
        for (const [label, properties] of Object.entries(result)) {
          if (label in inputNeurons) {
            inputNeurons[label].push(properties.bodyId);
          }
          if (label in outputNeurons) {
            outputNeurons[label].push(properties.bodyId);
          }
        }
      });

      let inputNeuronsJSON = JSON.stringify(inputNeurons);
      let outputNeuronsJSON = JSON.stringify(outputNeurons);

      let token = getAuthToken();

      // filter for synapses to draw
      let synapses = (
        await axios.get(
          `http://${process.env.REACT_APP_API_URL}/synapses/neuron=${clickedNeuronId}&&inputNeurons=${inputNeuronsJSON}&&outputNeurons=${outputNeuronsJSON}&&token=${token}`,
          {
            withCredentials: true,
          }
        )
      ).data;

      // change other neurons color before adding synapse suggestions
      greyOutObjects(sharkViewerInstance, [clickedNeuronId]);

      // add synapse suggestions
      let parent = new THREE.Object3D();
      parent.name = motif_synapse_suggestions_name;
      addSynapseSuggestions(synapses.input, "input", parent);
      addSynapseSuggestions(synapses.output, "output", parent);
      sharkViewerInstance.scene.add(parent);
    }
  }, [context.neighborhoodQuery]);

  useEffect(() => {
    if (context.motifQuery) {
      sharkViewerInstance.setMotifQuery(context.motifQuery);
    }
  }, [context.motifQuery]);

  // Instantiates the viewer, will only run once on init
  useEffect(() => {
    setSharkViewerInstance(
      new SharkViewer({
        dom_element: id,
        on_Alt_Click: onNeuronClick,
        lineClick: onLineClick,
      })
    );
  }, []);

  // Inits the viewer once it is created
  useEffect(() => {
    if (sharkViewerInstance) {
      sharkViewerInstance.init();

      const updateLoop = () => {
        requestAnimationFrame(updateLoop);
        sharkViewerInstance.scene?.interactionManager?.update();
      };
      updateLoop();
      sharkViewerInstance.animate();
    }
    setPrevSliderValue(0);
  }, [sharkViewerInstance]);

  // useEffect(() => {
  //     console.log("clear viewer triggered");
  //     if (sharkViewerInstance) {
  //         // remove all previous loaded objects in three.js scene
  //         let scene = sharkViewerInstance.scene;
  //         scene.remove.apply(scene, scene.children);
  //     }
  // }, [context.clearViewer])

  // Fetches the data, only runs on init
  useEffect(async () => {
    if (context.motifToAdd) {
      let bodyIds = context.motifToAdd.neurons.map((n) => n.bodyId);
      let bodyIdsJSON = JSON.stringify(bodyIds);
      let motifQuery = JSON.stringify(context.motifQuery);
      let labelsJSON = JSON.stringify(context.currentNeuronLabels);
      let token = JSON.stringify(getAuthToken());

      const ws = new WebSocket(
        `ws://${process.env.REACT_APP_API_URL}/display_motif_ws/`
      );
      ws.onopen = function (e) {
        console.log("[open] Connection established", new Date().getSeconds());
        console.log("Sending to server", new Date().getSeconds());
        ws.send(
          JSON.stringify({
            bodyIDs: bodyIdsJSON,
            motif: motifQuery,
            token: token,
            labels: labelsJSON,
          })
        );
      };

      ws.onmessage = function (event) {
        let data = JSON.parse(event.data);
        if (data?.status === 200) {
          let loaded_motif = {
            name: context.motifToAdd.name,
            index: context.motifToAdd.index,
            ...data.payload,
          };
          let motif = { ...loaded_motif };

          loaded_motif.neurons.forEach((neuron, i) => {
            motif.neurons[i] = { ...neuron, ...context.motifToAdd.neurons[i] };

            let tmp_labels = { ...context.currentNeuronLabels };
            tmp_labels[neuron.id] = neuron.labels;
            context.setCurrentNeuronLabels(tmp_labels);
          });
          context.setFocusedMotif(motif);
          setMotif(motif);
          context.setSelectedMotifs([...context.selectedMotifs, motif]);
          context.setLoadingMessage(null);
        } else {
          context.setLoadingMessage(data?.message || "Error");
        }
        ws.send(null);
      };

      ws.onclose = function (event) {
        if (event.wasClean) {
          console.log(
            `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`,
            new Date().getSeconds()
          );
        } else {
          // e.g. server process killed or network down
          // event.code is usually 1006 in this case
          console.log("[close] Connection died", new Date().getSeconds());
        }
      };

      context.setMotifToAdd(null);
    }
  }, [context.motifToAdd]);

  function addEdgeGroupToScene(groups, scene) {
    let prevClusters = scene.getObjectByName(syn_clusters_identifier);
    scene.remove(prevClusters);

    let lines = scene.getObjectByName(lines_identifier);
    if (!lines) {
      lines = new THREE.Object3D();
      lines.name = lines_identifier;
      lines.visible = true;
      scene.add(lines);
    }

    let syn_clusters = new THREE.Object3D();
    syn_clusters.name = syn_clusters_identifier;
    syn_clusters.visible = true;

    console.log("groups", groups);

    for (const [id, group] of Object.entries(groups)) {
      // let groupColor = groupFocused(group, context.focusedMotif)
      //   ? "#696969"
      //   : "#d3d3d3";
      // let line_group = bundle(group, 0.3, groupColor);
      // line_group.forEach((line, i) => {
      //   lines.children.push(line);
      // });

      let [n, post_neuron_number] = getNeuronListId(neurons, group.end_id);
      let clusters = clusterSynapses(group.start, 0.001);

      clusters.forEach((cluster, i) => {
        let synapses = cluster.map((i) => group.start[i]);
        let radius = 100 + synapses.length * 10;
        // });
        //
        // group.start.forEach((start, i) => {
        let geometry = new THREE.SphereGeometry(radius, 16, 16);
        let material = new THREE.MeshPhongMaterial({
          color: context.neuronColors[post_neuron_number],
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.neuron_ids = "syn-test";
        mesh.name = "syn-test";
        mesh.position.x = synapses[0].x;
        mesh.position.y = synapses[0].y;
        mesh.position.z = synapses[0].z;
        mesh.motifs = [motif];
        mesh.selected = false;
        mesh.oldMaterial = material.clone();
        mesh.synapses = synapses;

        let line_start = group.default_start[i];
        let line_end = group.default_end[i];

        mesh.addEventListener("mouseover", (e) => {
          document.body.style.cursor = "pointer";
        });

        mesh.addEventListener("mouseout", (e) => {
          document.body.style.cursor = "default";
        });

        mesh.addEventListener("click", (event) => {
          document.body.style.cursor = "pointer";
          if (mesh.selected) {
            let lines = scene.getObjectByName(lines_identifier);
            let name_to_remove = getClusterLineName(line_start, line_end);
            let line = lines.getObjectByName(name_to_remove);
            lines.remove(line);
            mesh.material = mesh.oldMaterial;
            mesh.material.needsUpdate = true;
            mesh.selected = false;
          } else {
            let line_group = bundle([line_start], [line_end], 0.3, "#696969");
            line_group.forEach((line, i) => {
              lines.add(line);
            });
            mesh.material = new THREE.MeshPhongMaterial({
              color: Color.red,
            });
            mesh.material.needsUpdate = true;
            mesh.selected = true;
          }
        });
        scene.interactionManager.add(mesh);
        syn_clusters.children.push(mesh);
      });
    }
    scene.add(syn_clusters);
  }

  function refreshEdges(scene, abstraction_boundary) {
    let groups = getEdgeGroups(
      context.selectedMotifs,
      abstraction_boundary,
      neurons,
      factor
    );
    addEdgeGroupToScene(groups, scene);
  }

  function getAbstractionLevel() {
    // return stretch(context.abstractionLevel);
    return context.abstractionLevel;
  }

  function transformPoints(points, direction, relPos) {
    /**
     * adds a vector to a given array of spatial points ([x, y, z])
     */
    return points.map((p) => {
      return [
        p[0] + relPos * direction[0] * factor,
        p[1] + relPos * direction[1] * factor,
        p[2] + relPos * direction[2] * factor,
      ];
    });
  }

  function getAbstractionBoundary(sharkViewerInstance) {
    let level = getAbstractionLevel();
    let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();
    if (level <= motif_path_threshold) {
      // only prune till motif path threshold
      sharkViewerInstance.setAbstractionThreshold(level);
    }
    return sharkViewerInstance.getAbstractionBoundary(level);
  }

  const setLineVisibility = (
    scene,
    level,
    visible,
    pre_id = "all",
    post_id = "all"
  ) => {
    let lines = scene.getObjectByName(line_clusters_identifier);
    if (lines) {
      lines.children.forEach((line) => {
        if (
          typeof line.name == "string" &&
          (pre_id === "all" || line.pre === pre_id) &&
          (post_id === "all" || line.post === post_id)
        ) {
          line.visible = visible;
        }
      });
    }
  };

  // Updates the motifs, runs when data, viewer, or abstraction state change
  useEffect(() => {
    if (motif && sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      let level = getAbstractionLevel();
      let abstraction_boundary = getAbstractionBoundary(sharkViewerInstance);
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let directions = getTranslationVectors(neurons.length);

      if (
        level >= motif_path_threshold &&
        prevSliderValue < motif_path_threshold
      ) {
        setDuplicateSynapsesToVisible(scene);
        setSynapseColorToConnectingNeuron(scene);
      } else if (
        level < motif_path_threshold &&
        prevSliderValue >= motif_path_threshold
      ) {
        removeSynapseDuplicates(scene);
        setSynapseColorToBaseColor(scene);
      }

      let bound = 0.08;
      let explosionProgression = (level - motif_path_threshold) / bound;
      explosionProgression = Math.max(0.0, Math.min(explosionProgression, 1.0)); // lamp between 0 and 1

      // animate synapse movement
      scene.children.forEach((child) => {
        if (typeof child.name === "string" && child.name.startsWith("syn-")) {
          let [neuron, idx] = getNeuronListId(neurons, child.snapToNeuron);
          moveObject(child, directions[idx], explosionProgression);
        }
      });

      let allLines = [];
      motif.syn_clusters.forEach((connection, i) => {
        neurons.forEach((neuron, i) => {
          moveObject(neuron, directions[i], explosionProgression);
        });

        if (level > motif_path_threshold) {
          let [pre_neuron, pre_neuron_number] = getNeuronListId(
            neurons,
            connection.pre
          );
          let [post_neuron, post_neuron_number] = getNeuronListId(
            neurons,
            connection.post
          );

          let pre_loc_transformed = transformPoints(
            connection.pre_loc,
            directions[pre_neuron_number],
            explosionProgression
          );
          let post_loc_transformed = transformPoints(
            connection.post_loc,
            directions[post_neuron_number],
            explosionProgression
          );

          let lines = hierarchicalBundling(
            pre_loc_transformed,
            post_loc_transformed,
            connection.clusters_per_synapse,
            connection.synapses_per_cluster,
            connection.pre,
            connection.post
          );

          allLines = allLines.concat(lines);
        }
      });

      // remove old lines
      if (level > motif_path_threshold) {
        // remove old lines
        deleteChild(scene, line_clusters_identifier);
        // add empty object to hold lines
        let line_clusters = new THREE.Object3D();
        line_clusters.name = line_clusters_identifier;
        line_clusters.children = allLines; // add new lines to scene
        scene.add(line_clusters);
      } else {
        // remove old lines
        deleteChild(scene, line_clusters_identifier);
      }

      setPrevSliderValue(level);
    }
  }, [context.abstractionLevel]);

  function deleteChild(parent, childName) {
    let child = parent.getObjectByName(childName);
    if (child) {
      parent.remove(child);
    }
  }

  function moveObject(object, direction, relPos) {
    /**
     * Moves an object in a direction by a relative position
     */
    object.translateX(-object.position.x);
    object.translateY(-object.position.y);
    object.translateZ(-object.position.z);

    object.translateX(object.origin.x + relPos * factor * direction[0]);
    object.translateY(object.origin.y + relPos * factor * direction[1]);
    object.translateZ(object.origin.z + relPos * factor * direction[2]);
  }

  function deleteAbstractionCenter(scene, neuron) {
    let center = scene.getObjectByName(getAbstractionCenterName(neuron));
    if (center) {
      scene.remove(center);
    }
  }

  function deleteNeuron(scene, neuron) {
    let mesh = scene.getObjectByName(neuron.id);
    if (mesh) {
      let match = mesh.motifs.find(
        (m) => m.index === context.motifToDelete.index
      );
      if (match) {
        // make sure neuron is not deleted if part of other motif
        let idx = mesh.motifs.indexOf(match);
        mesh.motifs.splice(idx, 1);
      }
      if (mesh.motifs.length === 0) {
        //deleteAbstractionCenter(scene, neuron);
        scene.remove(mesh);
      }
    }
  }

  function deleteSynapse(scene, synapse) {
    let mesh = scene.getObjectByName(getSynapseName(synapse, false));
    if (!mesh) {
      mesh = scene.getObjectByName(getSynapseName(synapse, true));
    }
    if (mesh && context.motifToDelete) {
      let match = mesh.motifs.find(
        (m) => m.index === context.motifToDelete.index
      );
      if (match) {
        let idx = mesh.motifs.indexOf(match);
        mesh.motifs.splice(idx, 1);
      }
      if (mesh.motifs.length === 0) {
        scene.remove(mesh);
      }
    }
  }

  function deleteLine(scene, start_id, end_id) {
    let lines = scene.getObjectByName("lines");
    if (lines) {
      let line = lines.getObjectByName(getLineName(start_id, end_id));
      if (line) {
        lines.remove(line);
      }
    }
  }

  useEffect(() => {
    if (context.motifToDelete && sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      console.log("deleting motif", context.motifToDelete);
      context.motifToDelete.neurons.forEach((neuron) => {
        deleteNeuron(scene, neuron);
      });
      context.motifToDelete.synapses.forEach((synapse) => {
        deleteSynapse(scene, synapse);
      });

      context.motifToDelete.graph.links.forEach((link) => {
        deleteLine(scene, link.source, link.target);
      });

      if (edgesEnabled) {
        let abstraction_boundary = getAbstractionBoundary(sharkViewerInstance);
        refreshEdges(scene, abstraction_boundary);
      }

      context.setMotifToDelete(null);
    }
  }, [context.motifToDelete]);

  function updateNeurons(scene) {
    setNeurons(
      scene.children.filter((child) => {
        return child.isNeuron;
      })
    );
  }

  useEffect(() => {
    if (motif && sharkViewerInstance) {
      if (!sharkViewerInstance.scene.interactionManager) {
        console.log("recreate interaction manager");
        sharkViewerInstance.scene.interactionManager = new InteractionManager(
          sharkViewerInstance.renderer,
          sharkViewerInstance.camera,
          sharkViewerInstance.renderer.domElement
        );
      }
      greyOutObjects(sharkViewerInstance);
      let scene = sharkViewerInstance.scene;
      //scene.remove.apply(scene, scene.children); // remove all previous loaded objects

      let interactionManager = sharkViewerInstance.scene.interactionManager;
      //context.setResetUICounter(context.resetUICounter + 1); // reset slider

      addLights(scene);

      //addAbstractionCenters(motif, context, scene, interactionManager);

      addSynapses(
        motif,
        setDisplayTooltip,
        setTooltipInfo,
        scene,
        interactionManager,
        onClickHighlightEdgesAndSynapses
      );

      let level = getAbstractionLevel();
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let neuron_translate = new THREE.Vector3(0, 0, 0);
      if (level > motif_path_threshold) {
        let old_directions = getTranslationVectors(neurons.length);
        let new_directions = getTranslationVectors(neurons.length + 1);

        neurons.forEach((neuron, i) => {
          console.log("translate neuron", neuron);
          neuron.translateX(factor * -old_directions[i][0]);
          neuron.translateY(factor * -old_directions[i][1]);
          neuron.translateZ(factor * -old_directions[i][2]);

          neuron.translateX(factor * new_directions[i][0]);
          neuron.translateY(factor * new_directions[i][1]);
          neuron.translateZ(factor * new_directions[i][2]);

          // let center = scene.getObjectByName(
          //   "abstraction-center-" + neuron.name
          // );
          // if (center) {
          //   center.translateX(factor * -old_directions[i][0]);
          //   center.translateY(factor * -old_directions[i][1]);
          //   center.translateZ(factor * -old_directions[i][2]);
          //
          //   center.translateX(factor * new_directions[i][0]);
          //   center.translateY(factor * new_directions[i][1]);
          //   center.translateZ(factor * new_directions[i][2]);
          // }

          // setSynapseVisibility(scene, false);
          // setLineVisibility(scene, true);
          //
          // setEdgesEnabled(true);
        });
        neuron_translate = new THREE.Vector3(
          factor * new_directions[neurons.length][0],
          factor * new_directions[neurons.length][1],
          factor * new_directions[neurons.length][2]
        );
      }

      let updateCamera = true;
      if (context.resetUICounter > 0) {
        updateCamera = false;
      }

      addNeurons(
        motif,
        context,
        sharkViewerInstance,
        scene,
        updateCamera,
        neuron_translate
      );

      // todo set abstraction threshold

      updateNeurons(scene);
    }
  }, [motif, sharkViewerInstance]);

  useEffect(() => {
    if (sharkViewerInstance) {
      let sourceId = "";
      let targetId = "";
      if (context.selectedSketchElement) {
        if (context.selectedSketchElement.type === "edge") {
          sourceId = getIdFromNodeKey(
            context.selectedSketchElement.fromNode.label,
            context
          );
          targetId = getIdFromNodeKey(
            context.selectedSketchElement.toNode.label,
            context
          );
        }
      } else if (context.selectedCytoscapeEdge) {
        sourceId = context.selectedCytoscapeEdge.source;
        targetId = context.selectedCytoscapeEdge.target;
      } else {
        return;
      }

      setLineVisibility(sharkViewerInstance.scene, 0, false);

      if (sourceId !== "" && targetId !== "" && context.focusedMotif) {
        highlightSynapses(sourceId, targetId);
        setLineVisibility(
          sharkViewerInstance.scene,
          0,
          true,
          parseInt(sourceId),
          parseInt(targetId)
        );
      }
    }
  }, [context.selectedSketchElement, context.selectedCytoscapeEdge]);

  function onClickHighlightEdgesAndSynapses(mesh) {
    if (
      typeof mesh.name === "string" &&
      mesh.name.startsWith("syn-") &&
      mesh.neuron_ids.startsWith("syn-")
    ) {
      let hover_neuron_ids = mesh.neuron_ids.split("-");
      let hover_neuron_pre_id = String(hover_neuron_ids[1]);
      let hover_neuron_post_id = String(hover_neuron_ids[2]);

      if (context.focusedMotif) {
        // highlight synapses
        highlightSynapses(hover_neuron_pre_id, hover_neuron_post_id);
        // highlight sketch and summary edge
        highlightEdges(hover_neuron_pre_id, hover_neuron_post_id);
      }
    }
  }

  function highlightEdges(sourceId, targetId) {
    let isEdgeFromFocusedMotif = context.focusedMotif.edges.some(
      (e) =>
        String(e.start_neuron_id) === sourceId &&
        String(e.end_neuron_id) === targetId
    );
    if (isEdgeFromFocusedMotif) {
      context.setSelectedSketchElement(null);
      context.setSelectedCytoscapeEdge({
        source: sourceId,
        target: targetId,
        label: "",
      });
    }
  }

  function highlightSynapses(sourceId, targetId) {
    let scene = sharkViewerInstance.scene;
    let isEdgeFromFocusedMotif = context.focusedMotif.edges.some(
      (e) =>
        String(e.start_neuron_id) === sourceId &&
        String(e.end_neuron_id) === targetId
    );
    if (isEdgeFromFocusedMotif) {
      scene.traverse((child) => {
        if (
          typeof child.name === "string" &&
          child.name.startsWith("syn-") &&
          child.neuron_ids.startsWith("syn-")
        ) {
          let neuron_ids = child.neuron_ids.split("-");
          let pre_id = String(neuron_ids[1]);
          let post_id = String(neuron_ids[2]);

          if (sourceId === pre_id && targetId === post_id) {
            child.material = new THREE.MeshPhongMaterial({ color: Color.red });
            child.material.needsUpdate = true;
            child.highlighted = true;
          } else {
            // child.material = new THREE.MeshPhongMaterial({
            //   color: Color.orange,
            // });
            child.material = child.oldMaterial;
            child.material.needsUpdate = true;
            child.highlighted = false;
          }
        }
      });
    } else {
      scene.traverse((child) => {
        if (
          typeof child.name === "string" &&
          child.name.startsWith("syn-") &&
          child.neuron_ids.startsWith("syn-")
        ) {
          //child.material = new THREE.MeshPhongMaterial({ color: Color.orange });
          child.material = child.oldMaterial;
          child.highlighted = false;
        }
      });
    }
  }

  function unselectEdges() {
    if (context.selectedSketchElement) {
      if (context.selectedSketchElement.type === "edge") {
        context.setSelectedSketchElement(null);
      }
    }
    if (context.selectedCytoscapeEdge) {
      context.setSelectedCytoscapeEdge(null);
    }
  }

  return (
    <div id={id} className={className} onKeyDown={handleKeyPress}>
      {displayTooltip && <ArrowTooltips props={tooltipInfo}></ArrowTooltips>}
      {displayContextMenu.display && (
        <BasicMenu
          open={displayContextMenu.display}
          position={displayContextMenu.position}
          neuron={displayContextMenu.neuron}
          motif={displayContextMenu.motif}
        >
          {" "}
        </BasicMenu>
      )}
    </div>
  );
}

export default Viewer;
