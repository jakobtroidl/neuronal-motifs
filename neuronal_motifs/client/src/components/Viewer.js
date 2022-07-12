import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser, stretch, stretch_inv} from './shark_viewer';
import {bundle} from '../services/bundling';
import ArrowTooltips from './ArrowTooltips'
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import {InteractionManager} from "three.interactive";
import {Color} from '../utils/rendering'
import _ from 'lodash';


const setLineVisibility = (scene, visible) => {
    scene.children.forEach(child => {
        if (typeof child.name == 'string' && child.name.includes('lines')) {
            child.visible = visible;
        }
    })
}

const getEdgeGroups = (motif, boundary) => {
    let groups = {}

    let number_of_neurons = motif.neurons.length;
    let directions = getTranslationVectors(number_of_neurons);
    let factor = 20000;

    boundary = Math.round(boundary);

    motif.edges.forEach(edge => {
        let [pre_neuron, pre_neuron_number] = getNeuronListId(motif.neurons, edge.start_neuron_id);
        let [post_neuron, post_neuron_number] = getNeuronListId(motif.neurons, edge.end_neuron_id);

        if (motif.graph.links.some(e => e.source === edge.start_neuron_id && e.target === edge.end_neuron_id)) {

            let pre_loc = new THREE.Vector3();
            if (boundary in edge.abstraction.start) {
                pre_loc.fromArray(edge.abstraction.start[boundary]);
            } else if (boundary < pre_neuron.min_skel_label) {
                pre_loc.fromArray(pre_neuron.abstraction_center);
            } else {
                pre_loc.fromArray(edge.default_start_position);
            }

            let translate = new THREE.Vector3(factor * directions[pre_neuron_number][0], factor * directions[pre_neuron_number][1], factor * directions[pre_neuron_number][2]);
            let line_start = pre_loc.add(translate);

            let post_loc = new THREE.Vector3();
            if (boundary in edge.abstraction.end) {
                post_loc.fromArray(edge.abstraction.end[boundary]);
            } else if (boundary < post_neuron.min_skel_label) {
                post_loc.fromArray(post_neuron.abstraction_center);
            } else {
                post_loc.fromArray(edge.default_end_position);
            }

            translate = new THREE.Vector3(factor * directions[post_neuron_number][0], factor * directions[post_neuron_number][1], factor * directions[post_neuron_number][2]);
            let line_end = post_loc.add(translate);

            let group_id = edge.start_neuron_id + "-" + edge.end_neuron_id;
            if (!(group_id in groups)) {
                groups[group_id] = {
                    'start': [],
                    'end': [],
                    'start_id': edge.start_neuron_id,
                    'end_id': edge.end_neuron_id
                };
            }

            let group_points = groups[group_id];
            group_points['start'].push(line_start);
            group_points['end'].push(line_end);
        }
    })

    return groups;
}

const setSynapseVisibility = (scene, visible) => {
    scene.children.forEach(child => {
        if (typeof child.name == 'string' && child.name.includes('syn')) {
            child.visible = visible;
        }
    })
}

const getNeuronListId = (neurons, id) => {
    let out_id = -1;
    let out_neuron = undefined;
    neurons.forEach((neuron, i) => {
        if (neuron.id === id) {
            out_id = i;
            out_neuron = neuron;
        }
    })
    return [out_neuron, out_id];
}

/**
 * Computes uniformly distributed points on the unit sphere
 * @param count: number of points to sample
 * @return {[number,number,number][]}
 */
const getTranslationVectors = (count) => {
    // Following Saff and Kuijlaars via https://discuss.dizzycoding.com/evenly-distributing-n-points-on-a-sphere/
    const indices = _.range(0.5, count + 0.5);
    const phi = indices.map(ind => {
        return Math.acos(1 - 2 * ind / count)
    })
    const theta = indices.map(ind => {
        return Math.PI * (1 + Math.sqrt(5)) * ind;
    })
    let directions = _.range(count).map(i => {
        const x = Math.cos(_.toNumber(theta[i])) * Math.sin(phi[i]);
        const y = Math.sin(_.toNumber(theta[i])) * Math.sin(phi[i]);
        const z = Math.cos(phi[i])
        return [x, y, z]
    })
    return directions;
}

function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [prevSliderValue, setPrevSliderValue] = useState()
    const [edgesEnabled, setEdgesEnabled] = useState(false);
    const [edgeGroups, setEdgeGroups] = useState();
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    const context = useContext(AppContext); // Global context holds abstraction state
    // for synapse selecting & highlighting
    const [displayTooltip, setDisplayTooltip] = useState(false);
    const [tooltipInfo, setTooltipInfo] = useState({})

    // Instantiates the viewer, will only run once on init
    useEffect(() => {
        setSharkViewerInstance(
            new SharkViewer({dom_element: id})
        )
    }, [])

    // Inits the viewer once it is created
    useEffect(() => {
        if (sharkViewerInstance) {
            sharkViewerInstance.init();

            const updateLoop = () => {
                requestAnimationFrame(updateLoop);
                sharkViewerInstance.scene?.interactionManager?.update();
            }
            updateLoop();
            sharkViewerInstance.animate();
        }
        setPrevSliderValue(0);
    }, [sharkViewerInstance])

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
        if (context.selectedMotif) {
            let selectedMotif = context.selectedMotif;
            let bodyIds = selectedMotif.map(m => m.bodyId);
            bodyIds = JSON.stringify(bodyIds);
            let motifQuery = JSON.stringify(context.motifQuery);
            const ws = new WebSocket(`ws://localhost:5050/display_motif_ws/`)
            ws.onopen = function (e) {
                console.log("[open] Connection established", new Date().getSeconds());
                console.log("Sending to server", new Date().getSeconds());
                ws.send(JSON.stringify({'bodyIDs': bodyIds, 'motif': motifQuery}));
            };

            ws.onmessage = function (event) {
                console.log(`[message] Data received from server: ${event.data}`, new Date().getSeconds());
                let data = JSON.parse(event.data);
                if (data?.status === 200) {
                    setMotif(data.payload);
                    context.setLoadingMessage(null)
                } else {
                    context.setLoadingMessage(data?.message || 'Error');
                }
                ws.send(null);
            };

            ws.onclose = function (event) {
                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`, new Date().getSeconds());
                } else {
                    // e.g. server process killed or network down
                    // event.code is usually 1006 in this case
                    console.log('[close] Connection died', new Date().getSeconds());
                }
            };
        }

    }, [context.selectedMotif]);

    function addEdgeGroupToScene(groups, scene) {
        let lines_identifier = 'lines';
        let prevLines = scene.getObjectByName(lines_identifier);
        scene.remove(prevLines);

        let i = 0;
        let lines = new THREE.Object3D();
        lines.name = lines_identifier;
        lines.visible = edgesEnabled;
        for (const [id, group] of Object.entries(groups)) {
            let line_group = bundle(group, 0.3, context.synapseColors[i]);
            line_group.forEach((line, i) => {
                lines.children.push(line);
            });
            i++;
        }
        scene.add(lines);
    }

    useEffect(() => {
        if (motif && sharkViewerInstance) {

            // remove all previous loaded objects and reset slider
            let scene = sharkViewerInstance.scene;
            scene.remove.apply(scene, scene.children);
            context.setResetUICounter(context.resetUICounter + 1); // reset slider

            motif.neurons.forEach((neuron, i) => {

                let parsedSwc = swcParser(neuron.skeleton_swc);
                let color = context.neuronColors[i];
                sharkViewerInstance.loadNeuron(neuron.id, color, parsedSwc, true);
            })

            let groups = getEdgeGroups(motif, 1.0);
            setEdgeGroups(groups);
            addEdgeGroupToScene(groups, scene);
        }

    }, [motif, sharkViewerInstance])

    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {

            let level = stretch(context.abstractionLevel);
            sharkViewerInstance.setAbstractionThreshold(level);

            let motif_path_threshold = sharkViewerInstance.getMotifPathThreshold();
            let abstraction_boundary = sharkViewerInstance.getAbstractionBoundary(level);

            let scene = sharkViewerInstance.scene;
            let number_of_neurons = motif.neurons.length;
            let directions = getTranslationVectors(number_of_neurons);
            let factor = 20000;
            let offset = 0.001;

            if (edgesEnabled) {
                let groups = getEdgeGroups(motif, abstraction_boundary);
                setEdgeGroups(groups);
                addEdgeGroupToScene(groups, scene);
            }

            if (level > motif_path_threshold + offset && prevSliderValue <= motif_path_threshold + offset) {
                motif.neurons.forEach((neuron, i) => {
                    let mesh = scene.getObjectByName(neuron.id);
                    mesh.translateX(factor * directions[i][0]);
                    mesh.translateY(factor * directions[i][1]);
                    mesh.translateZ(factor * directions[i][2]);

                    let center = scene.getObjectByName('abstraction-center-' + neuron.id);
                    center.translateX(factor * directions[i][0]);
                    center.translateY(factor * directions[i][1]);
                    center.translateZ(factor * directions[i][2]);

                    setSynapseVisibility(scene, false);
                    setLineVisibility(scene, true);

                    setEdgesEnabled(true);
                });
            }
            if (level <= motif_path_threshold + offset && prevSliderValue > motif_path_threshold + offset) {
                motif.neurons.forEach((neuron, i) => {
                    let mesh = scene.getObjectByName(neuron.id);
                    mesh.translateX(factor * -directions[i][0]);
                    mesh.translateY(factor * -directions[i][1]);
                    mesh.translateZ(factor * -directions[i][2]);

                    let center = scene.getObjectByName('abstraction-center-' + neuron.id);
                    center.translateX(factor * -directions[i][0]);
                    center.translateY(factor * -directions[i][1]);
                    center.translateZ(factor * -directions[i][2]);

                    setSynapseVisibility(scene, true);
                    setLineVisibility(scene, false);

                    setEdgesEnabled(false);
                });
            }
            setPrevSliderValue(level);
        }
    }, [context.abstractionLevel])

    useEffect(() => {
        if (motif && sharkViewerInstance) {
            if (!sharkViewerInstance.scene.interactionManager) {
                sharkViewerInstance.scene.interactionManager = new InteractionManager(
                    sharkViewerInstance.renderer,
                    sharkViewerInstance.camera,
                    sharkViewerInstance.renderer.domElement
                );
            }

            let scene = sharkViewerInstance.scene;
            let interactionManager = sharkViewerInstance.scene.interactionManager;

            const ambientLight = new THREE.AmbientLight(Color.white, 1.0);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(Color.white, 0.7);
            scene.add(directionalLight);

            motif.neurons.forEach((neuron, i) => {
                let geometry = new THREE.SphereGeometry(200, 16, 16);
                let material = new THREE.MeshPhongMaterial({color: context.neuronColors[i]});
                let mesh = new THREE.Mesh(geometry, material);
                mesh.name = "abstraction-center-" + neuron.id;
                mesh.position.x = neuron.abstraction_center[0];
                mesh.position.y = neuron.abstraction_center[1];
                mesh.position.z = neuron.abstraction_center[2];

                scene.add(mesh);
                interactionManager.add(mesh);
            })

            motif.synapses.forEach(syn => {
                // create a sphere shape
                let geometry = new THREE.SphereGeometry(100, 16, 16);
                let material = new THREE.MeshPhongMaterial({color: Color.orange});
                let mesh = new THREE.Mesh(geometry, material);

                mesh.name = "syn-" + syn.post.x + "-" + syn.post.y + "-" + syn.post.z;
                mesh.position.x = (syn.post.x + syn.pre.x) / 2.0;
                mesh.position.y = (syn.post.y + syn.pre.y) / 2.0;
                mesh.position.z = (syn.post.z + syn.pre.z) / 2.0;
                mesh.addEventListener("mouseover", (event) => {
                    mesh.material = new THREE.MeshPhongMaterial({color: Color.red});
                    mesh.material.needsUpdate = true;
                    document.body.style.cursor = "pointer";
                    setDisplayTooltip(true)
                    setTooltipInfo({pre_soma_dist: syn.pre_soma_dist, post_soma_dist: syn.post_soma_dist, event: event})
                });

                mesh.addEventListener("mouseout", (event) => {
                    setDisplayTooltip(false);
                    mesh.material = new THREE.MeshPhongMaterial({color: Color.orange});
                    mesh.material.needsUpdate = true;
                    document.body.style.cursor = "default";
                });

                scene.add(mesh);
                interactionManager.add(mesh);
            })
        }
    }, [motif, sharkViewerInstance])

    return (
        <div id={id} className={className}>
            {displayTooltip &&
                <ArrowTooltips props={tooltipInfo}></ArrowTooltips>
            }

        </div>
    );

}

export default Viewer;