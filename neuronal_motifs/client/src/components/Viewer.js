import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from './shark_viewer';
import ArrowTooltips from './ArrowTooltips'
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";
import {InteractionManager} from "three.interactive";


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
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let intersected = null;
    const [currColor, setCurrColor] = useState("#ffffff");
    const [displayTooltip, setDisplayTooltip] = useState(false);
    const [tooltipInfo, setTooltipInfo] = useState()

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    function onPointerMove(e) {
        return;
    }


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
        setPrevSliderValue(0)
    }, [sharkViewerInstance])

    useEffect(() => {
        if (sharkViewerInstance && motif && loadedNeurons) {
            let neuron_number = 0
            motif.neurons.forEach(n => {
                let abstraction_level = 0
                n.skeleton_abstractions.forEach(abstraction => {
                    let id = loadedNeurons[neuron_number] + abstraction_level
                    sharkViewerInstance.unloadNeuron(id);
                    abstraction_level += 1
                })
                neuron_number += 1
            })
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

            let neuron_number = 0
            let objects_to_add = [];
            let number_of_neurons = motif.neurons.length;
            let directions = getTranslationVectors(number_of_neurons);
            let neuron_order = [];
            let factor = 8000;

            motif.neurons.forEach((n) => {
                let abstraction_level = 0
                n.skeleton_abstractions.forEach(abstraction => {
                    let parsedSwc = swcParser(abstraction.swc)
                    let id = loadedNeurons[neuron_number] + abstraction_level
                    let color = context.colors[neuron_number];
                    if (abstraction_level === 0) {  // initialize view instance
                        sharkViewerInstance.loadNeuron(id, color, parsedSwc, true);
                        sharkViewerInstance.setNeuronVisible(id, true)
                    } else {  // load all neurons but set the all to invisible
                        sharkViewerInstance.loadNeuron(id, color, parsedSwc, false);
                        sharkViewerInstance.setNeuronVisible(id, false)
                    }
                    abstraction_level += 1
                })
                neuron_order.push(n.id);

                let id = loadedNeurons[neuron_number] + abstraction_level - 1
                let most_abstract_mesh = scene.getObjectByName(id);
                most_abstract_mesh = most_abstract_mesh.clone(true);
                most_abstract_mesh.name = loadedNeurons[neuron_number] + abstraction_level;
                most_abstract_mesh.visible = false;
                most_abstract_mesh.translateX(factor * directions[neuron_number][0]);
                most_abstract_mesh.translateY(factor * directions[neuron_number][1]);
                most_abstract_mesh.translateZ(factor * directions[neuron_number][2]);
                objects_to_add.push(most_abstract_mesh);

                neuron_number += 1
            })
            objects_to_add.forEach(obj => {
                scene.add(obj);
            })

            motif.neurons.forEach(neuron => {
                neuron.synapses.forEach(syn => {
                    let pre_neuron_number = neuron_order.indexOf(syn.pre_id);
                    let pre_loc = new THREE.Vector3(syn.pre.x, syn.pre.y, syn.pre.z);
                    let translate = new THREE.Vector3(factor * directions[pre_neuron_number][0], factor * directions[pre_neuron_number][1], factor * directions[pre_neuron_number][2]);
                    let line_start = pre_loc.add(translate);

                    let post_neuron_number = neuron_order.indexOf(syn.post_id);
                    let post_loc = new THREE.Vector3(syn.post.x, syn.post.y, syn.post.z);
                    translate = new THREE.Vector3(factor * directions[post_neuron_number][0], factor * directions[post_neuron_number][1], factor * directions[post_neuron_number][2]);
                    let line_end = post_loc.add(translate);

                    const material = new THREE.LineBasicMaterial({color: new THREE.Color("rgb(230,0,255)")});
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
            })
        }
    }, [motif, sharkViewerInstance])

    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {
            console.log(motif)
            let scene = sharkViewerInstance.scene;
            let neurons = motif.neurons;
            let neuron_number = 0;
            let slider_value = context.abstractionLevel * 1.1;
            neurons.forEach(n => {
                let level = Math.round((n.skeleton_abstractions.length - 1) * slider_value);
                let load_id = loadedNeurons[neuron_number] + level;
                let unload_id = loadedNeurons[neuron_number] + prevSliderValue;

                if (load_id !== unload_id) {
                    sharkViewerInstance.setNeuronVisible(load_id, true);
                    sharkViewerInstance.setNeuronVisible(unload_id, false);
                }
                setPrevSliderValue(level);
                neuron_number += 1;

                if (slider_value > 1.0) {
                    setLineVisibility(scene, true);
                    setSynapseVisibility(scene, false);
                } else {
                    setLineVisibility(scene, false);
                    setSynapseVisibility(scene, true);
                }

            })
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

            /** @type {InteractionManager} */
            let interactionManager = sharkViewerInstance.scene.interactionManager;

            let neurons = motif.neurons;
            const orange = new THREE.Color("rgb(255,154,0)");
            let scene = sharkViewerInstance.scene;

            const white =new THREE.Color("rgb(255,255,255)");
            const ambientLight = new THREE.AmbientLight(white, 1.0);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(white, 0.7);
            scene.add(directionalLight);

            neurons.forEach(neuron => {
                let synapses = neuron.synapses;

                synapses.forEach(syn => {
                    // create a sphere shape
                    let geometry = new THREE.SphereGeometry(100, 16, 16);
                    let material = new THREE.MeshStandardMaterial({color: orange, transparent: true, opacity: 1.0});
                    let mesh = new THREE.Mesh(geometry, material);

                    mesh.geometry.name = "synapse";
                    if (!mesh.geometry.userData.neurons) {
                        mesh.geometry.userData = {neurons: [neuron.id]} // need to change what this is
                        // n neurons with complexity level that are set to visible or set to invisible
                        // enabling the visibility of each of those. many objects in the threejs scene that correspond to what the neuron is
                        // highlight the right neuron for the current abstraction level
                        // each neuron has the same id space, the original neuron is id=0, id=1
                    } else { // may need fixing because we seem to be creating "two" synapses
                        mesh.geometry.userData.neurons.push(neuron.id)
                        console.log("added neuron")
                    }
                    mesh.name = "syn-" + syn.post.x + "-" + syn.post.y + "-" + syn.post.z;
                    mesh.position.x = (syn.post.x + syn.pre.x) / 2.0;
                    mesh.position.y = (syn.post.y + syn.pre.y) / 2.0;
                    mesh.position.z = (syn.post.z + syn.pre.z) / 2.0;
                    mesh.addEventListener("mouseover", (event) => {
                        event.target.material.color.set(0xff0000);
                        document.body.style.cursor = "pointer";

                        console.log(motif.distances)
                        setDisplayTooltip(true)
                        setTooltipInfo({distances: motif.distances, event: event})
                        // let currNeurons;
                        // if (event.target.geometry.userData) {
                        //     currNeurons = event.target.geometry.userData.neurons;
                        // }

                        // for (let i = 0; i < currNeurons.length; i++) {
                        //     // this is an opacity change
                        //     // const newNeuron = scene.getObjectByName(currNeurons[i]); // need to fix name
                        //     const newNeuron = scene.getObjectByName(0);

                        //     console.log(newNeuron)

                        //     newNeuron.children.forEach(child => {
                        //             child.material.opacity = 0.5
                        //         }
                        //     )

                        //     console.log(newNeuron)

                        //     // setCurrColor(newNeuron.material.color.getHex());
                        // }

                        // return <ArrowTooltips distances={motif.distances}/>
                        // ArrowTooltips(motif.distances)
                        // console.log(motif.distances)
                        // synapseView()
                        // event.target.material.color.set(0xff0000);
                        // document.body.style.cursor = "pointer";
                    });

                    mesh.addEventListener("mouseout", (event) => {
                        setDisplayTooltip(false);
                        event.target.material.color.set(orange);
                        document.body.style.cursor = "default";
                    });

                    scene.add(mesh);
                    interactionManager.add(mesh);
                })
            })
        }
    }, [motif, sharkViewerInstance])

    // synapse picking
    // neuron geometry is undefined; synapse geometry is SphereGeometry
    // this may be superfluous now
    useEffect(() => {
        return;
    }, [motif, sharkViewerInstance])

    // displays data about presynaptic and postsynaptic distance
    function synapseView() {
        console.log("hi")
        return (
            <h1>hi</h1>
            // <Tooltip title="Add" arrow>
            // <Button>Arrow</Button>
            // </Tooltip>
        );
    }

    return (
        <div id={id} className={className}>
            {displayTooltip &&
                <ArrowTooltips props={tooltipInfo}></ArrowTooltips>
            }

        </div>
    );

}

export default Viewer;