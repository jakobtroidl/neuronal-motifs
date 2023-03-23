import React, { useContext, useEffect, useState } from "react";
import SharkViewer, { swcParser } from "./shark_viewer";
import { hierarchicalBundling } from "../services/bundling";
import ArrowTooltips from "./ArrowTooltips";
import { AppContext } from "../contexts/GlobalContext";
import "./Viewer.css";
import * as THREE from "three";
import { InteractionManager } from "three.interactive";
import { Color } from "../utils/rendering";
import _ from "lodash";
import axios from "axios";
import { getAuthToken } from "../utils/authentication";
import { getIdFromNodeKey } from "../utils/edge";

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

function getSynapseNameFromLocations(pre_loc, post_loc, flipped = false) {
  let pre = pre_loc[0] + "-" + pre_loc[1] + "-" + pre_loc[2];
  let post = post_loc[0] + "-" + post_loc[1] + "-" + post_loc[2];

  if (flipped) {
    return "syn-" + post + "-" + pre;
  } else {
    return "syn-" + pre + "-" + post;
  }
}

function getSynapseIds(pre_id, post_id) {
  return "syn-" + pre_id + "-" + post_id;
}

function removeSynapseDuplicates(scene) {
  let synapsesObject = scene.getObjectByName("synapse-parent");
  if (synapsesObject) {
    synapsesObject.children.forEach((child) => {
      if (
        typeof child.name === "string" &&
        child.name.startsWith("syn-") &&
        child.snapToNeuron === child.post
      ) {
        child.visible = false;
      }
    });
  }
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
    const directionalLight = new THREE.DirectionalLight(Color.grey, 0.4);
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
  });
}

function restoreColors(sharkViewerInstance) {
  let scene = sharkViewerInstance.scene;
  scene.children.forEach((child) => {
    if (child.isObject3D && child.isNeuron && child.oldColor) {
      sharkViewerInstance.setColor(child, child.oldColor);
    } else if (child.name === "synapse-parent") {
      child.children.forEach((synapse) => {
        if (synapse.oldMaterial) {
          synapse.material = synapse.oldMaterial;
          synapse.material.needsUpdate = true;
        }
      });
    }
  });
}

function resetSynapsesColor(sharkViewerInstance) {
  let scene = sharkViewerInstance.scene;
  let synapsesObject = scene.getObjectByName("synapse-parent");
  if (synapsesObject) {
    synapsesObject.traverse((child) => {
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
}

function Viewer() {
  const id = "my_shark_viewer";
  const className = "shark_viewer";
  let motif_synapse_suggestions_name = "motif-synapse-suggestions";

  const context = useContext(AppContext);

  let factor = 10000;
  let lines_identifier = "lines";
  let line_clusters_identifier = "line_clusters";
  let roi_identifier = "rois";

  const [motif, setMotif] = useState();
  const [sharkViewerInstance, setSharkViewerInstance] = useState();
  const [prevSliderValue, setPrevSliderValue] = useState();
  const [displayTooltip, setDisplayTooltip] = useState(false); // for synapse selecting & highlighting
  const [tooltipInfo, setTooltipInfo] = useState({});
  const [highlightSynapse, setHighlightedSynapse] = useState({
    highlight: false,
    pre_id: null,
    post_id: null,
  });

  const [highlightedConnection, setHighlightedConnection] = useState({
    pre: null,
    post: null,
  });

  const [neurons, setNeurons] = useState([]);
  const [synapses, setSynapses] = useState([]);

  const [displayContextMenu, setDisplayContextMenu] = useState({
    position: { x: 0, y: 0 },
    neuron: null,
    motif: null,
  });

  const [parentSynapseObject, setParentSynapseObject] = useState();

  function isSynapseForFocusedMotif(synapse) {
    let neuronName = "";
    if (synapse.pre === synapse.snapToNeuron) {
      neuronName = synapse.post;
    } else if (synapse.post === synapse.snapToNeuron) {
      neuronName = synapse.pre;
    } else {
      console.log("==============", synapse);
    }
    if (neuronName !== "") {
      return context.focusedMotif.neurons.some((n) => n.id === neuronName);
    } else {
      return false;
    }
  }

  function colorSynapses(sharkViewerInstance) {
    let scene = sharkViewerInstance.scene;
    let synapsesObject = scene.getObjectByName("synapse-parent");
    if (synapsesObject) {
      synapsesObject.traverse((child) => {
        if (
          typeof child.name === "string" &&
          child.name.startsWith("syn-") &&
          child.neuron_ids.startsWith("syn-")
        ) {
          let level = getAbstractionLevel();
          let motif_path_threshold =
            sharkViewerInstance.getMotifPathThreshold();
          if (level > motif_path_threshold) {
            if (isSynapseForFocusedMotif(child)) {
              if (child.oldMaterial.color.equals(Color.grey)) {
                let neuronName = "";
                if (child.pre === child.snapToNeuron) {
                  neuronName = child.post;
                } else if (child.post === child.snapToNeuron) {
                  neuronName = child.pre;
                }
                let [neuron, idx] = getNeuronListId(neurons, neuronName);
                child.material = new THREE.MeshPhongMaterial({
                  color: neuron.color,
                });
                child.oldMaterial = child.material.clone();
              } else {
                child.material = child.oldMaterial;
              }
            } else {
              // synapses are not from focused motif
              child.material = new THREE.MeshPhongMaterial({
                color: Color.grey,
              });
              child.oldMaterial = child.material.clone();
            }
            child.material.needsUpdate = true;
            child.highlighted = false;
          }
        }
      });
    }
  }

  function setSynapseColorToConnectingNeuron(scene) {
    let synapsesObject = scene.getObjectByName("synapse-parent");
    if (synapsesObject) {
      synapsesObject.children.forEach((child) => {
        if (typeof child.name === "string" && child.name.startsWith("syn-")) {
          let color;
          if (child.pre === child.snapToNeuron) {
            let [neuron, idx] = getNeuronListId(neurons, child.post);
            color = neuron.color;
          } else if (child.post === child.snapToNeuron) {
            let [neuron, idx] = getNeuronListId(neurons, child.pre);
            color = neuron.color;
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
  }

  function setSynapseColorToBaseColor(scene) {
    let synapsesObject = scene.getObjectByName("synapse-parent");
    if (synapsesObject) {
      synapsesObject.children.forEach((child) => {
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
  }

  function setDuplicateSynapsesToVisible(scene) {
    let synapsesObject = scene.getObjectByName("synapse-parent");
    if (synapsesObject) {
      synapsesObject.children.forEach((child) => {
        if (typeof child.name === "string" && child.name.startsWith("syn-")) {
          child.visible = true;
        }
      });
    }
  }

  function addSynapses(
    motif,
    setDisplayTooltip,
    setTooltipInfo,
    // scene,
    parentSynapseObject,
    interactionManager,
    onClickHighlightEdgesAndSynapses
  ) {
    let synapses = motif.syn_clusters;

    synapses.forEach((connection, i) => {
      connection.pre_loc.forEach((pre_syn_location, j) => {
        let syn_name = getSynapseNameFromLocations(
          pre_syn_location,
          connection.post_loc[j]
        );

        let synapseObject = parentSynapseObject.getObjectByName(syn_name);
        if (!synapseObject) {
          addSynapse(
            // scene,
            parentSynapseObject,
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
            // scene,
            parentSynapseObject,
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
        }
      });
    });
  }

  function addSynapse(
    // scene,
    parentSynapseObject,
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
    parentSynapseObject.add(mesh);
    return mesh;
  }

  function handleKeyPress(event) {
    if (event.key === "c") {
      console.log("c was pressed");
      resetSynapsesColor(sharkViewerInstance);
      unselectEdges();
      setLineVisibility(sharkViewerInstance.scene, 0.0, false);
      setHighlightedConnection({ pre: null, post: null });
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
        position: { x: event.clientX, y: event.clientY },
        neuron: neuron,
        motif: this.motifQuery,
      });
      //setHighlightNeuron(neuron, true);
    } else {
      console.log("No neuron selected");
      setDisplayContextMenu({
        position: { x: 0, y: 0 },
        neuron: null,
        motif: [],
      });
    }
  }

  function colorFocusedMotif(sharkViewerInstance) {
    colorMotif(sharkViewerInstance, context.focusedMotif, context.neuronColors);
    resetSynapsesColor(sharkViewerInstance);
    colorSynapses(sharkViewerInstance);
  }

  useEffect(() => {
    if (sharkViewerInstance && context.focusedMotif) {
      greyOutObjects(sharkViewerInstance);
      colorFocusedMotif(sharkViewerInstance);
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
            // child.material = child.oldMaterial;
            child.material = isSynapseForFocusedMotif(child)
              ? child.oldMaterial
              : new THREE.MeshPhongMaterial({
                  color: Color.grey,
                });
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [highlightSynapse.highlight]);

  function deleteAllROIs(scene) {
    let rois = scene.getObjectByName(roi_identifier);
    if (rois) {
      scene.remove(rois);
    }
  }

  function addROI(scene, roi) {
    let roiObject = scene.getObjectByName(roi_identifier);
    if (!roiObject) {
      roiObject = new THREE.Object3D();
      roiObject.name = roi_identifier;
      roiObject.transparent = true;
      scene.add(roiObject);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setIndex(roi.faces.flat());
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(roi.vertices.flat(), 3)
    );

    geometry.computeVertexNormals();
    let material = new THREE.MeshStandardMaterial({
      color: Color.black,
      transparent: true,
      opacity: 0.3,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = roi.name;
    roiObject.add(mesh);
  }

  useEffect(async () => {
    if (sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      let roisJSON = JSON.stringify(context.displayedROIs);
      let token = getAuthToken();
      let rois = (
        await axios.get(
          `${process.env.REACT_APP_API_PROTOCOL}://${process.env.REACT_APP_API_URL}/roi/names=${roisJSON}&&token=${token}`,
          {
            withCredentials: true,
          }
        )
      ).data;

      deleteAllROIs(scene);
      rois.forEach((roi, i) => {
        addROI(scene, roi);
      });
    }
  }, [context.displayedROIs]);

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

    setParentSynapseObject(new THREE.Group());
  }, []);

  useEffect(() => {
    if (parentSynapseObject) {
      parentSynapseObject.name = "synapse-parent";
    }
  }, [parentSynapseObject]);

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

  // Fetches the data, only runs on init
  useEffect(async () => {
    if (context.motifToAdd) {
      let bodyIds = context.motifToAdd.neurons.map((n) => n.bodyId);
      let bodyIdsJSON = JSON.stringify(bodyIds);
      let motifQuery = JSON.stringify(context.motifQuery);
      let labelsJSON = JSON.stringify(context.currentNeuronLabels);
      let token = JSON.stringify(getAuthToken());

      const ws = new WebSocket(
        `${process.env.REACT_APP_WS_PROTOCOL}://${process.env.REACT_APP_API_URL}/display_motif_ws/`
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
          let tmp_labels = { ...context.currentNeuronLabels };
          loaded_motif.neurons.forEach((neuron, i) => {
            motif.neurons[i] = { ...neuron, ...context.motifToAdd.neurons[i] };
            tmp_labels[neuron.id] = neuron.labels;
          });
          context.setCurrentNeuronLabels(tmp_labels);
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

  function getAbstractionLevel() {
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
    } else if (level > motif_path_threshold) {
      // if abstraction level is above the threshold, fix to the level of Pruned MI state.
      sharkViewerInstance.setAbstractionThreshold(context.motifPathPosition);
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

  function setROIOpacity(scene, opacity) {
    let roi = scene.getObjectByName(roi_identifier);
    if (roi) {
      roi.children.forEach((roi) => {
        roi.material.opacity = opacity;
        roi.material.needsUpdate = true;
      });
    }
  }

  useEffect(() => {
    if (sharkViewerInstance) {
      let grey = context.greyOutNonMotifBranches;
      sharkViewerInstance.greyNonMotifBranches(grey);
    }
  }, [context.greyOutNonMotifBranches]);

  useEffect(() => {
    context.setAbstractionLevel(context.abstractionLevel + 0.001);
  }, [neurons]);

  // Updates the motifs, runs when data, viewer, or abstraction state change
  useEffect(() => {
    if (context.focusedMotif && sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      let level = getAbstractionLevel();
      let abstraction_boundary = getAbstractionBoundary(sharkViewerInstance);
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let directions = getTranslationVectors(neurons.length);

      if (level <= motif_path_threshold - 0.1) {
        setROIOpacity(scene, 0.3);
      } else if (level <= motif_path_threshold) {
        setROIOpacity(scene, 0.1);
      } else {
        setROIOpacity(scene, 0.0);
      }

      if (
        level >= motif_path_threshold &&
        prevSliderValue < motif_path_threshold
      ) {
        setDuplicateSynapsesToVisible(scene);
        setSynapseColorToConnectingNeuron(scene);
        colorSynapses(sharkViewerInstance);
      } else if (
        level < motif_path_threshold &&
        prevSliderValue >= motif_path_threshold
      ) {
        removeSynapseDuplicates(scene);
        setSynapseColorToBaseColor(scene);
      }

      let explosionProgression =
        (level - motif_path_threshold) / context.explosionRange;
      explosionProgression = Math.max(0.0, Math.min(explosionProgression, 1.0)); // lamp between 0 and 1

      let lineBundlingStrength =
        (1.0 / (1.0 - motif_path_threshold - context.explosionRange)) *
        (level - motif_path_threshold - context.explosionRange);
      lineBundlingStrength = Math.max(0.0, Math.min(lineBundlingStrength, 1.0)); // lamp between 0 and 1

      // animate synapse movement
      let synapsesObject = scene.getObjectByName("synapse-parent");
      if (synapsesObject) {
        synapsesObject.children.forEach((child) => {
          if (typeof child.name === "string" && child.name.startsWith("syn-")) {
            let [neuron, idx] = getNeuronListId(neurons, child.snapToNeuron);
            moveObject(child, directions[idx], explosionProgression);
          }
        });
      }

      let allLines = [];
      context.focusedMotif.syn_clusters.forEach((connection, i) => {
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

          // if (pre_neuron_number !== -1 && post_neuron_number !== -1) {
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

          let isVisible = false;
          if (
            highlightedConnection.pre === connection.pre &&
            highlightedConnection.post === connection.post
          ) {
            isVisible = true;
          }

          let [lines, arrows] = hierarchicalBundling(
            pre_loc_transformed,
            post_loc_transformed,
            connection.clusters_per_synapse,
            connection.synapses_per_cluster,
            connection.pre,
            connection.post,
            isVisible,
            lineBundlingStrength
          );

          if (context.drawArrowsOnLines) {
            allLines = allLines.concat(lines, arrows);
          } else {
            allLines = allLines.concat(lines);
          }
        }
        // }
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
  }, [context.abstractionLevel, context.drawArrowsOnLines]);

  useEffect(() => {
    if (sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      let level = getAbstractionLevel();
      let directions = getTranslationVectors(neurons.length);
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let explosionProgression =
        (level - motif_path_threshold) / context.explosionRange;
      explosionProgression = Math.max(0.0, Math.min(explosionProgression, 1.0)); // lamp between 0 and 1

      let lineBundlingStrength =
        (1.0 / (1.0 - motif_path_threshold - context.explosionRange)) *
        (level - motif_path_threshold - context.explosionRange);
      lineBundlingStrength = Math.max(0.0, Math.min(lineBundlingStrength, 1.0)); // lamp between 0 and 1

      let allLines = [];
      context.focusedMotif.syn_clusters.forEach((connection, i) => {
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

          let isVisible = false;
          if (
            highlightedConnection.pre === connection.pre &&
            highlightedConnection.post === connection.post
          ) {
            isVisible = true;
          }

          let [lines, arrows] = hierarchicalBundling(
            pre_loc_transformed,
            post_loc_transformed,
            connection.clusters_per_synapse,
            connection.synapses_per_cluster,
            connection.pre,
            connection.post,
            isVisible,
            lineBundlingStrength
          );

          if (context.drawArrowsOnLines) {
            allLines = allLines.concat(lines, arrows);
          } else {
            allLines = allLines.concat(lines);
          }
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
    }
  }, [highlightedConnection]);

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

  function deleteSynapse(scene, pre_id, post_id) {
    pre_id = parseInt(pre_id);
    post_id = parseInt(post_id);
    let syn_to_delete = [];

    let synapsesObject = scene.getObjectByName("synapse-parent");
    if (synapsesObject) {
      synapsesObject.children.forEach((child) => {
        if (
          typeof child.name === "string" &&
          child.name.startsWith("syn-") &&
          child.pre === pre_id &&
          child.post === post_id
        ) {
          syn_to_delete.push(child);
        }
      });
    }
    synapsesObject.remove(...syn_to_delete);
  }

  function deleteLine(scene, start_id, end_id) {
    start_id = parseInt(start_id);
    end_id = parseInt(end_id);
    let lines = scene.getObjectByName(line_clusters_identifier);
    let lines_to_delete = [];
    if (lines) {
      lines.children.forEach((line) => {
        if (line.pre === start_id && line.post === end_id) {
          lines_to_delete.push(line);
        }
      });

      lines.remove(...lines_to_delete);
    }
  }

  useEffect(() => {
    if (context.motifToDelete && sharkViewerInstance) {
      let scene = sharkViewerInstance.scene;
      console.log("deleting motif", context.motifToDelete);
      context.motifToDelete.neurons.forEach((neuron) => {
        deleteNeuron(scene, neuron);
      });

      context.motifToDelete.graph.links.forEach((link) => {
        deleteSynapse(scene, link.source, link.target);
      });

      context.motifToDelete.graph.links.forEach((link) => {
        deleteLine(scene, link.source, link.target);
      });

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
        // scene,
        parentSynapseObject,
        interactionManager,
        onClickHighlightEdgesAndSynapses
      );
      scene.add(parentSynapseObject);

      let level = getAbstractionLevel();
      let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();

      let neuron_translate = new THREE.Vector3(0, 0, 0);
      // if (level > motif_path_threshold) {
      //   let old_directions = getTranslationVectors(neurons.length);
      //   let new_directions = getTranslationVectors(neurons.length + 1);
      //
      //   neurons.forEach((neuron, i) => {
      //     console.log("translate neuron", neuron);
      //     neuron.translateX(factor * -old_directions[i][0]);
      //     neuron.translateY(factor * -old_directions[i][1]);
      //     neuron.translateZ(factor * -old_directions[i][2]);
      //
      //     neuron.translateX(factor * new_directions[i][0]);
      //     neuron.translateY(factor * new_directions[i][1]);
      //     neuron.translateZ(factor * new_directions[i][2]);
      //   });
      //   neuron_translate = new THREE.Vector3(
      //     factor * new_directions[neurons.length][0],
      //     factor * new_directions[neurons.length][1],
      //     factor * new_directions[neurons.length][2]
      //   );
      //   console.log(neuron_translate);
      // }

      let updateCamera = true;
      if (context.selectedMotifs.length > 0) {
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

      colorFocusedMotif(sharkViewerInstance);

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
        setHighlightedConnection({
          pre: parseInt(sourceId),
          post: parseInt(targetId),
        });
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
            // child.material = child.oldMaterial;
            child.material = isSynapseForFocusedMotif(child)
              ? child.oldMaterial
              : new THREE.MeshPhongMaterial({
                  color: Color.grey,
                });
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
          // child.material = child.oldMaterial;
          child.material = isSynapseForFocusedMotif(child)
            ? child.oldMaterial
            : new THREE.MeshPhongMaterial({
                color: Color.grey,
              });
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
    </div>
  );
}

export default Viewer;
