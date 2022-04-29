import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from './shark_viewer';
import ArrowTooltips from './ArrowTooltips'
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";
import {InteractionManager} from "three.interactive";
import {Color} from '../utils/rendering'


const setLineVisibility = (scene, visible) => {
    scene.children.forEach(child => {
        if (typeof child.name == 'string' && child.name.includes('line')) {
            child.visible = visible;
        }
    })
}

const setSynapseVisibility = (scene, visible) => {
    scene.children.forEach(child => {
        if (typeof child.name == 'string' && child.name.includes('syn')) {
            child.visible = visible;
        }
    })
}

const getNeuronListId = (neurons, id) => {
    let out = -1;
    neurons.forEach((neuron, i) => {
        if (neuron.id === id) {
            out = i;
        }
    })
    return out;
}


/* max count = 10 */
const getTranslationVectors = (count) => {
    let directions = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
        [1, 1, 1],
        [-1, -1, -1],
        [-1, 1, 1],
        [1, -1, -1]
    ]
    return directions.slice(0, count);
}

// const createMoveAnimation = ({ mesh, startPosition, endPosition }) => {
//   mesh.userData.mixer = new THREE.AnimationMixer(mesh);
//   let track = new THREE.VectorKeyframeTrack(
//     '.position',
//     [0, 1],
//     [
//       startPosition.x,
//       startPosition.y,
//       startPosition.z,
//       endPosition.x,
//       endPosition.y,
//       endPosition.z,
//     ]
//   );
//   const animationClip = new THREE.AnimationClip(null, 5, [track]);
//   const animationAction = mesh.userData.mixer.clipAction(animationClip);
//   animationAction.setLoop(THREE.LoopOnce);
//   animationAction.play();
//   mesh.userData.clock = new THREE.Clock();
// };

function Viewer() {
    const [motif, setMotif] = React.useState()
    /** @type {SharkViewer, function} */
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [loadedNeurons, setLoadedNeurons] = useState()
    const [prevSliderValue, setPrevSliderValue] = useState()
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);
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

    useEffect(() => {
        if (sharkViewerInstance) {

            // remove all previous loaded objects in three.js scene
            let scene = sharkViewerInstance.scene;
            scene.remove.apply(scene, scene.children);
        }
    }, [context.clearViewer])

    // Fetches the data, only runs on init
    useEffect(async () => {
        if (context.selectedMotif) {
            let selectedMotif = context.selectedMotif;
            let bodyIds = selectedMotif.map(m => m.bodyId);
            bodyIds = JSON.stringify(bodyIds);
            let motifQuery = JSON.stringify(context.motifQuery);
            let id_ranges = Array.from({length: selectedMotif.length}, (_, i) => i * 1000);
            setLoadedNeurons(id_ranges);
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

    useEffect(() => {
        if (motif && sharkViewerInstance) {
            // remove all previous loaded objects in three.js scene
            let scene = sharkViewerInstance.scene;
            scene.remove.apply(scene, scene.children);
            motif.neurons.forEach((neuron, i) => {

                let parsedSwc = swcParser(neuron.skeleton_swc);
                let color = context.colors[i];
                sharkViewerInstance.loadNeuron(neuron.id, color, parsedSwc, true);
            })

            let number_of_neurons = motif.neurons.length;
            let directions = getTranslationVectors(number_of_neurons);
            let factor = 8000;

            motif.synapses.forEach(syn => {
                let pre_neuron_number = getNeuronListId(motif.neurons, syn.pre_id);
                let pre_loc = new THREE.Vector3(syn.pre.x, syn.pre.y, syn.pre.z);
                let translate = new THREE.Vector3(factor * directions[pre_neuron_number][0], factor * directions[pre_neuron_number][1], factor * directions[pre_neuron_number][2]);
                let line_start = pre_loc.add(translate);

                let post_neuron_number = getNeuronListId(motif.neurons, syn.post_id);
                let post_loc = new THREE.Vector3(syn.post.x, syn.post.y, syn.post.z);
                translate = new THREE.Vector3(factor * directions[post_neuron_number][0], factor * directions[post_neuron_number][1], factor * directions[post_neuron_number][2]);
                let line_end = post_loc.add(translate);

                const material = new THREE.LineBasicMaterial({color: Color.orange});
                const points = [];
                points.push(line_start);
                points.push(line_end);

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, material);

                line.name = 'line-' + line_start.x + '-' + line_start.y + '-' + line_start.z + '-'
                    + line_end.x + '-' + line_end.y + '-' + line_end.z;
                line.visible = false;
                scene.add(line);
            })
        }
    }, [motif, sharkViewerInstance])

    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {
            sharkViewerInstance.setAbstractionThreshold(context.abstractionLevel);

            let scene = sharkViewerInstance.scene;

            let number_of_neurons = motif.neurons.length;
            let directions = getTranslationVectors(number_of_neurons);
            let factor = 8000;

            if (context.abstractionLevel > 0.9 && prevSliderValue <= 0.9) {
                motif.neurons.forEach((neuron, i) => {
                    let mesh = scene.getObjectByName(neuron.id);
                    mesh.translateX(factor * directions[i][0]);
                    mesh.translateY(factor * directions[i][1]);
                    mesh.translateZ(factor * directions[i][2]);

                    setSynapseVisibility(scene, false);
                    setLineVisibility(scene, true);
                });
            }
            if (context.abstractionLevel <= 0.9 && prevSliderValue > 0.9) {
                motif.neurons.forEach((neuron, i) => {
                    let mesh = scene.getObjectByName(neuron.id);
                    mesh.translateX(factor * -directions[i][0]);
                    mesh.translateY(factor * -directions[i][1]);
                    mesh.translateZ(factor * -directions[i][2]);

                    setSynapseVisibility(scene, true);
                    setLineVisibility(scene, false);
                });
            }


        }
        setPrevSliderValue(context.abstractionLevel);
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

            motif.neurons.forEach(neuron => {
                let geometry = new THREE.SphereGeometry(200, 16, 16);
                let material = new THREE.MeshPhongMaterial({color: Color.red});
                let mesh = new THREE.Mesh(geometry, material);
                mesh.name = "abstraction-center-" + neuron.abstraction_center[0] + "-" + neuron.abstraction_center[1] + "-" + neuron.abstraction_center[2];
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