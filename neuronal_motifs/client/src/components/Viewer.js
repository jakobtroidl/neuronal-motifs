import React, { useContext, useEffect, useState } from "react";
import SharkViewer, { stretch, swcParser } from "./shark_viewer";
import {
  bundle,
  getClusterLineName,
  clusterSynapses,
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
import { getTranslationVectors } from "../utils/rendering";

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

const getSynapseGroups = (motifs, boundary, neurons, factor, scene) => {
  //let directions = getTranslationVectors(neurons.length);
  boundary = Math.floor(boundary);

  console.log("boundary: ", boundary);

  // delete all synapses
  scene.children.forEach((child) => {
    if (typeof child.name == "string" && child.name.includes("syn")) {
      scene.remove(child);
    }
  });

  motifs.forEach((motif) => {
    motif.edges.forEach((edge) => {
      let loc = new THREE.Vector3();
      if (boundary in edge.abstraction.start) {
        loc = edge.abstraction.start[boundary];

        // else {
        //   loc.fromArray(edge.default_start_position);
        // }

        let syn = {
          pre_id: edge.start_neuron_id,
          post_id: edge.end_neuron_id,
          pre: new THREE.Vector3(loc[0], loc[1], loc[2]),
          post: new THREE.Vector3(loc[0], loc[1], loc[2]),
        };
        addSynapse(scene, syn, Color.orange, motif);
      }
    });
  });
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

    neuronObject.origin = neuronObject.position;

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
      mesh.origin = new THREE.Vector3(
        neuron.abstraction_center[0],
        neuron.abstraction_center[1],
        neuron.abstraction_center[2]
      );

      scene.add(mesh);
    }
  });
}

function getLineName(synapse) {
  return "line-" + synapse.pre + "-" + synapse.post;
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

function addSynapse(scene, synapse, color, motif) {
  // create a sphere shape
  let name_variant1 = getSynapseName(synapse, false);
  let name_variant2 = getSynapseName(synapse, true);
  // if (
  //   !scene.getObjectByName(name_variant1) &&
  //   !scene.getObjectByName(name_variant2)
  // ) {
  let geometry = new THREE.SphereGeometry(100, 16, 16);
  let material = new THREE.MeshPhongMaterial({ color: color });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.name = name_variant1;
  mesh.pre = synapse.pre_id;
  mesh.post = synapse.post_id;
  mesh.position.x = (synapse.post.x + synapse.pre.x) / 2.0;
  mesh.position.y = (synapse.post.y + synapse.pre.y) / 2.0;
  mesh.position.z = (synapse.post.z + synapse.pre.z) / 2.0;
  mesh.motifs = [motif];
  mesh.origin = new THREE.Vector3(
    (synapse.post.x + synapse.pre.x) / 2.0,
    (synapse.post.y + synapse.pre.y) / 2.0,
    (synapse.post.z + synapse.pre.z) / 2.0
  );

  console.log("adding synapse", mesh.name);
  scene.add(mesh);
  return mesh;
  // } else {
  //   console.log("skip adding syn -> already in scene ");
  //   let mesh = scene.getObjectByName(name_variant1);
  //   if (!mesh) {
  //     mesh = scene.getObjectByName(name_variant2);
  //   }
  //   mesh.motifs.push(motif);
  //   return mesh;
  // }
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

function Viewer() {
  const id = "my_shark_viewer";
  const className = "shark_viewer";
  let motif_synapse_suggestions_name = "motif-synapse-suggestions";

  const context = useContext(AppContext);

  let factor = 10000;
  let offset = 0.001;
  let syn_clusters_identifier = "clusters";
  let lines_identifier = "lines";

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
    }
    if (event.key === "c") {
      console.log("c was pressed");
      removeLines();
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
      console.log("scene with suggestions: ", scene);
      scene.traverse((child) => {
        if (
          child.parent &&
          child.parent.name === motif_synapse_suggestions_name &&
          typeof child.name === "string" &&
          child.name.startsWith("syn-")
        ) {
          // let name = child.name.split("-");
          // let pre_id = parseInt(name[1]);
          // let post_id = parseInt(name[2]);
          if (
            highlightSynapse.highlight &&
            (highlightSynapse.pre_id === child.pre ||
              highlightSynapse.post_id === child.post)
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
              console.log("found neuron: ", neuron);
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
            type === "input" ? Color.orange : Color.orange
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

      console.log("clusters", clusters);

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

  function getAbstractionBoundary(sharkViewerInstance) {
    let level = getAbstractionLevel();
    let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();
    if (level <= motif_path_threshold) {
      // only prune till motif path threshold
      sharkViewerInstance.setAbstractionThreshold(level);
    }
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

      let bound = 0.08;

      if (level > motif_path_threshold) {
        refreshEdges(scene, abstraction_boundary);
        setSynapseVisibility(scene, false);
        setLineVisibility(scene, true);
        setEdgesEnabled(true);
      } else {
        setSynapseVisibility(scene, true);
      }
      if (level < motif_path_threshold + bound) {
        let prevClusters = scene.getObjectByName(syn_clusters_identifier);
        if (prevClusters) {
          prevClusters.visible = false;
        }
      }

      console.log("scene", scene);

      let j = (level - motif_path_threshold) / bound;
      j = Math.max(0.0, Math.min(j, 1.0)); // lamp between 0 and 1

      neurons.forEach((neuron, i) => {
        moveObject(neuron, directions[i], j);
        // let center = scene.getObjectByName("abstraction-center-" + neuron.name);
        // if (center) moveObject(center, directions[i], j);
        //setSynapseVisibility(scene, false);
      });

      let syn_clusters = scene.getObjectByName(syn_clusters_identifier);

      // animate synapse
      // if (syn_clusters) {
      //   syn_clusters.children.forEach((child) => {
      //     if (typeof child.name === "string" && child.name.startsWith("syn")) {
      //       let [pre_neuron, pre_idx] = getNeuronListId(neurons, child.pre);
      //       moveObject(child, directions[pre_idx], j);
      //
      //       if (level > motif_path_threshold) {
      //         let [post_neuron, post_idx] = getNeuronListId(
      //           neurons,
      //           child.post
      //         );
      //
      //         child.material = new THREE.MeshPhongMaterial({
      //           color: context.neuronColors[post_idx],
      //         });
      //         child.material.needsUpdate = true;
      //       } else {
      //         child.material = new THREE.MeshPhongMaterial({
      //           color: Color.orange,
      //         });
      //         child.material.needsUpdate = true;
      //       }
      //     }
      //   });
      // }

      setPrevSliderValue(level);
    }
  }, [context.abstractionLevel]);

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

  function getIdFromNodeKey(nodeKey) {
    const result = context.focusedMotif.neurons.filter(
      (neuron) => neuron.nodeKey === nodeKey
    );
    return String(result[0].id);
  }
  useEffect(() => {
    if (sharkViewerInstance) {
      let edgeFrom = "";
      if (context.selectedSketchElement) {
        edgeFrom = "sketch";
      } else if (context.selectedCytoscapeEdge) {
        edgeFrom = "cytoscape";
      } else {
        return;
      }

      let scene = sharkViewerInstance.scene;
      scene.traverse((child) => {
        if (typeof child.name === "string" && child.name.startsWith("syn-")) {
          let pre_id = String(child.pre);
          let post_id = String(child.post);

          let sourceId =
            edgeFrom === "sketch"
              ? getIdFromNodeKey(context.selectedSketchElement.fromNode.label)
              : context.selectedCytoscapeEdge.source;
          let targetId =
            edgeFrom === "sketch"
              ? getIdFromNodeKey(context.selectedSketchElement.toNode.label)
              : context.selectedCytoscapeEdge.target;
          // context.selectedSketchElement.type === "edge" &&
          if (sourceId === pre_id && targetId === post_id) {
            child.oldMaterial = child.material.clone();
            child.material = new THREE.MeshPhongMaterial({ color: Color.red });
            child.material.needsUpdate = true;
            // } else if (child.oldMaterial) {
            //   child.material = child.oldMaterial;
            //   child.material.needsUpdate = true;
          } else {
            child.material = new THREE.MeshPhongMaterial({
              color: Color.orange,
            });
          }
        }
      });
    }
  }, [context.selectedSketchElement, context.selectedCytoscapeEdge]);

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
