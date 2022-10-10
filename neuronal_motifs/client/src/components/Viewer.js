import React, { useContext, useEffect, useState } from "react";
import SharkViewer, { stretch, swcParser } from "./shark_viewer";
import { bundle } from "../services/bundling";
import ArrowTooltips from "./ArrowTooltips";
import { AppContext } from "../contexts/GlobalContext";
import "./Viewer.css";
import * as THREE from "three";
import { InteractionManager } from "three.interactive";
import { Color } from "../utils/rendering";
import _ from "lodash";
import BasicMenu from "./ContextMenu";
import axios from "axios";
import { getAuthToken } from "../utils/authentication";

const setLineVisibility = (scene, visible) => {
  scene.children.forEach((child) => {
    if (typeof child.name == "string" && child.name.includes("lines")) {
      child.visible = visible;
    }
  });
};

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
          pre_loc.fromArray(edge.default_start_position);
        }

        let translate = new THREE.Vector3(
          factor * directions[pre_neuron_number][0],
          factor * directions[pre_neuron_number][1],
          factor * directions[pre_neuron_number][2]
        );
        let line_start = pre_loc.add(translate);

        let post_loc = new THREE.Vector3();
        if (boundary in edge.abstraction.end) {
          post_loc.fromArray(edge.abstraction.end[boundary]);
        } else if (boundary <= post_neuron.meta.min_skel_label) {
          post_loc.fromArray(post_neuron.meta.abstraction_center);
        } else {
          post_loc.fromArray(edge.default_end_position);
        }

        translate = new THREE.Vector3(
          factor * directions[post_neuron_number][0],
          factor * directions[post_neuron_number][1],
          factor * directions[post_neuron_number][2]
        );
        let line_end = post_loc.add(translate);

        let group_id = edge.start_neuron_id + "-" + edge.end_neuron_id;
        if (!(group_id in groups)) {
          groups[group_id] = {
            start: [],
            end: [],
            start_id: edge.start_neuron_id,
            end_id: edge.end_neuron_id,
          };
        }

        let group_points = groups[group_id];
        group_points["start"].push(line_start);
        group_points["end"].push(line_end);
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
    let neuronObject = sharkViewerInstance.loadNeuron(
      neuron.id,
      color,
      parsedSwc,
      updateCamera
    );

    neuronObject.motifs = [motif];
    if (oldNeuron) {
      neuronObject.motifs = neuronObject.motifs.concat(oldNeuron.motifs);
      scene.remove(oldNeuron);
    }
    neuronObject.meta = { ...neuron };
    neuronObject.translateX(translate.x);
    neuronObject.translateY(translate.y);
    neuronObject.translateZ(translate.z);

    scene.add(neuronObject);
  });

  console.log(scene);
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

function getSynapseName(synapse, flipped = false) {
  // let pre = synapse.pre_id;
  // let post = synapse.post_id;
  let pre_loc = synapse.pre.x + "-" + synapse.pre.y + "-" + synapse.pre.z;
  let post_loc = synapse.post.x + "-" + synapse.post.y + "-" + synapse.post.z;

  if (flipped) {
    return "syn-" + post_loc + "-" + pre_loc;
  } else {
    return "syn-" + pre_loc + "-" + post_loc;
  }
}

function addSynapse(scene, synapse, color, motif) {
  // create a sphere shape
  let name_variant1 = getSynapseName(synapse, false);
  let name_variant2 = getSynapseName(synapse, true);
  if (
    !scene.getObjectByName(name_variant1) &&
    !scene.getObjectByName(name_variant2)
  ) {
    let geometry = new THREE.SphereGeometry(100, 16, 16);
    let material = new THREE.MeshPhongMaterial({ color: color });
    let mesh = new THREE.Mesh(geometry, material);

    mesh.name = name_variant1;
    mesh.position.x = (synapse.post.x + synapse.pre.x) / 2.0;
    mesh.position.y = (synapse.post.y + synapse.pre.y) / 2.0;
    mesh.position.z = (synapse.post.z + synapse.pre.z) / 2.0;

    mesh.motifs = [motif];

    scene.add(mesh);
    return mesh;
  } else {
    let mesh = scene.getObjectByName(name_variant1);
    if (!mesh) {
      mesh = scene.getObjectByName(name_variant2);
    }
    mesh.motifs.push(motif);
    return mesh;
  }
}

function addSynapses(
  synapses,
  setDisplayTooltip,
  setTooltipInfo,
  scene,
  interactionManager,
  motif
) {
  synapses.forEach((syn) => {
    let mesh = addSynapse(scene, syn, Color.orange, motif);
    if (mesh) {
      // show tooltip when mouse is over the synapse and change synapse color
      mesh.addEventListener("mouseover", (event) => {
        mesh.material = new THREE.MeshPhongMaterial({ color: Color.red });
        mesh.material.needsUpdate = true;
        document.body.style.cursor = "pointer";
        setDisplayTooltip(true);
        setTooltipInfo({
          pre_soma_dist: syn.pre_soma_dist,
          post_soma_dist: syn.post_soma_dist,
          event: event,
        });
      });

      mesh.addEventListener("mouseout", (event) => {
        setDisplayTooltip(false);
        mesh.material = new THREE.MeshPhongMaterial({ color: Color.orange });
        mesh.material.needsUpdate = true;
        document.body.style.cursor = "default";
      });

      interactionManager.add(mesh);
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
    let abstractionCenterName = getAbstractionCenterName(neuron);
    let abstractionCenter = scene.getObjectByName(abstractionCenterName);
    if (abstractionCenter) {
      abstractionCenter.material = new THREE.MeshPhongMaterial({
        color: colors[i],
      });
      abstractionCenter.material.needsUpdate = true;
    }
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

function Viewer() {
  const id = "my_shark_viewer";
  const className = "shark_viewer";
  let motif_synapse_suggestions_name = "motif-synapse-suggestions";

  const context = useContext(AppContext);

  let factor = 20000;
  let offset = 0.001;

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

  const [displayContextMenu, setDisplayContextMenu] = useState({
    display: false,
    position: { x: 0, y: 0 },
    neuron: null,
    motif: null,
  });

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

  function handleKeyPress(event) {
    // check if R key was pressed
    if (event.key === "r") {
      console.log("r was pressed");
      restoreColors(sharkViewerInstance);
      removeSynapseSuggestions();
      context.setNeighborhoodQuery(null);
    }
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
              console.log("add this motif to scene");
              console.log(result);
              console.log(context.selectedMotifs);
              context.setSelectedMotifs([
                ...context.selectedMotifs,
                Object.values(result),
              ]);
              return true;
              // TODO how to handle multiple motifs that match pattern?
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
    let lines_identifier = "lines";
    let prevLines = scene.getObjectByName(lines_identifier);
    scene.remove(prevLines);

    let i = 0;
    let lines = new THREE.Object3D();
    lines.name = lines_identifier;
    lines.visible = edgesEnabled;
    for (const [id, group] of Object.entries(groups)) {
      let groupColor = groupFocused(group, context.focusedMotif)
        ? "#696969"
        : "#d3d3d3";
      let line_group = bundle(group, 0.3, groupColor);
      line_group.forEach((line, i) => {
        lines.children.push(line);
      });
      i++;
    }

    scene.add(lines);
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
    return stretch(context.abstractionLevel);
  }

  function getAbstractionBoundary(sharkViewerInstance) {
    let level = getAbstractionLevel();
    sharkViewerInstance.setAbstractionThreshold(level);
    return sharkViewerInstance.getAbstractionBoundary(level);
  }

  // Updates the motifs, runs when data, viewer, or abstraction state change
  useEffect(() => {
    if (motif && sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      let level = getAbstractionLevel();
      let abstraction_boundary = getAbstractionBoundary(sharkViewerInstance);
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let directions = getTranslationVectors(neurons.length);

      if (edgesEnabled) {
        refreshEdges(scene, abstraction_boundary);
      }

      if (
        level > motif_path_threshold + offset &&
        prevSliderValue <= motif_path_threshold + offset
      ) {
        neurons.forEach((neuron, i) => {
          neuron.translateX(factor * directions[i][0]);
          neuron.translateY(factor * directions[i][1]);
          neuron.translateZ(factor * directions[i][2]);

          let center = scene.getObjectByName(
            "abstraction-center-" + neuron.name
          );
          if (center) {
            center.translateX(factor * directions[i][0]);
            center.translateY(factor * directions[i][1]);
            center.translateZ(factor * directions[i][2]);
          }

          setSynapseVisibility(scene, false);
          setLineVisibility(scene, true);

          setEdgesEnabled(true);
        });
      }
      if (
        level <= motif_path_threshold + offset &&
        prevSliderValue > motif_path_threshold + offset
      ) {
        neurons.forEach((neuron, i) => {
          //let mesh = scene.getObjectByName(neuron.id);
          neuron.translateX(factor * -directions[i][0]);
          neuron.translateY(factor * -directions[i][1]);
          neuron.translateZ(factor * -directions[i][2]);

          let center = scene.getObjectByName(
            "abstraction-center-" + neuron.name
          );
          if (center) {
            center.translateX(factor * -directions[i][0]);
            center.translateY(factor * -directions[i][1]);
            center.translateZ(factor * -directions[i][2]);
          }

          setSynapseVisibility(scene, true);
          setLineVisibility(scene, false);

          setEdgesEnabled(false);
        });
      }
      setPrevSliderValue(level);
    }
  }, [context.abstractionLevel]);

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
        deleteAbstractionCenter(scene, neuron);
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

      addAbstractionCenters(motif, context, scene, interactionManager);

      addSynapses(
        motif.synapses,
        setDisplayTooltip,
        setTooltipInfo,
        scene,
        interactionManager,
        motif
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

          let center = scene.getObjectByName(
            "abstraction-center-" + neuron.name
          );
          if (center) {
            center.translateX(factor * -old_directions[i][0]);
            center.translateY(factor * -old_directions[i][1]);
            center.translateZ(factor * -old_directions[i][2]);

            center.translateX(factor * new_directions[i][0]);
            center.translateY(factor * new_directions[i][1]);
            center.translateZ(factor * new_directions[i][2]);
          }

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

      console.log("motif: ", motif);

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
