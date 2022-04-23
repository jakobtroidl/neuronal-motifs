import React, {useState, useEffect, useContext, useRef} from 'react';
import ReactTooltip from 'react-tooltip';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";
import { InteractionManager } from "three.interactive";

import Draggable from 'react-draggable';

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
    const [currColor, setCurrColor] = useState(0xffffff);

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    function onPointerMove(e) {
        pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
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


            // setMotif(res.data);
        }

    }, [context.selectedMotif]);

    useEffect(() => {
        if (motif && sharkViewerInstance) {

            // remove all previous loaded objects in three.js scene
            let scene = sharkViewerInstance.scene;
            scene.remove.apply(scene, scene.children);

            let neuron_number = 0
            //console.log(context.colors);
            motif.neurons.forEach(n => {
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
                neuron_number += 1
            })
        }
    }, [motif, sharkViewerInstance])
    
    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {
            let neurons = motif.neurons;
            let neuron_number = 0;
            neurons.forEach(n => {
                let slider_value = context.abstractionLevel;
                let level = Math.round((n.skeleton_abstractions.length - 1) * slider_value);
                let load_id = loadedNeurons[neuron_number] + level;
                let unload_id = loadedNeurons[neuron_number] + prevSliderValue;

                if (load_id !== unload_id) {
                    sharkViewerInstance.setNeuronVisible(load_id, true);
                    sharkViewerInstance.setNeuronVisible(unload_id, false);
                }
                setPrevSliderValue(level);
                neuron_number += 1;
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

            neurons.forEach(neuron => {
                let synapses = neuron.synapses;
                let scene = sharkViewerInstance.scene;

                synapses.forEach(syn => {
                    // create a sphere shape
                    let geometry = new THREE.SphereGeometry(400, 16, 16);
                    let material = new THREE.MeshBasicMaterial({color: orange});
                    let mesh = new THREE.Mesh(geometry, material);

                    mesh.geometry.name = "synapse";
                    if (!mesh.geometry.userData.neurons) {
                        mesh.geometry.userData = { neurons: [neuron.id] } // need to change what this is
                    } else { // may need fixing because we seem to be creating "two" synapses
                        mesh.geometry.userData.neurons.push(neuron.id)
                        console.log("added neuron")
                    }

                    mesh.position.x = syn.x;
                    mesh.position.y = syn.y;
                    mesh.position.z = syn.z;

                    mesh.addEventListener("mouseover", (event) => {
                        event.target.material.color.set(0xff0000);
                        document.body.style.cursor = "pointer";
                        synapseView();

                        // change the colors of the neurons
                        let currNeurons;
                        if (event.target.geometry.userData) {
                            currNeurons = event.target.geometry.userData.neurons;
                        }

                        for (let i = 0; i < currNeurons.length; i++) {
                            // this is an opacity change
                            const newNeuron = scene.getObjectByName(currNeurons[i]); // need to fix name7

                            newNeuron.children.forEach(child => {
                                    child.material.opacity = 0.5
                                }
                            )

                            // setCurrColor(newNeuron.material.color.getHex());
                        }
                    });

                    mesh.addEventListener("mouseout", (event) => {
                        event.target.material.color.set(orange);
                        document.body.style.cursor = "default";

                        // change the colors of the neurons back
                        let prevNeurons;
                        if (event.target.geometry.userData) {
                            prevNeurons = event.target.geometry.userData.neurons;
                        }

                        for (let i = 0; i < prevNeurons.length; i++) {
                            // this is an opacity change
                            const oldNeuron = scene.getObjectByName(prevNeurons[i]);

                            oldNeuron.children.forEach(child => {
                                child.material.opacity = 1
                            })
                        }
                    });

                    scene.add(mesh);
                    interactionManager.add(mesh);
                })
            })
        }
    }, [motif, sharkViewerInstance])

    // synapse picking
    // neuron geometry is undefined; synapse geometry is SphereGeometry
    // a lot of this may be superfluous now
    useEffect(() => {
        return;
        if (motif && sharkViewerInstance) {
            let scene = sharkViewerInstance.scene;

            // update the synapse picking ray with the camera and pointer position
            raycaster.setFromCamera(pointer, sharkViewerInstance.camera);

            // calculate objects intersecting the picking ray
	        const intersects = raycaster.intersectObjects(scene.children);

            if (intersects.length > 0) {
                // go through logic only if synapse
                if (intersects[0].object.geometry.name === "synapse") {
                    if (intersected != intersects[0].object) {
                        // load in geodesic distances
                        if (intersects[0].object.geometry.name === "synapse") {

                        // return the color of the object in old intersected back to original
                        if (intersected) {
                            let prevNeurons;
                            if (intersected.geometry.userData) {
                                // console.log(intersected.geometry.userData)
                                prevNeurons = intersected.geometry.userData.neurons;
                            }

                            // console.log(prevNeurons)
                        
                            for (let i = 0; i < prevNeurons.length; i++) {
                                // this is an opacity change
                                const oldNeuron = scene.getObjectByName(prevNeurons[i]);

                                if (oldNeuron) {
                                    // console.log(oldNeuron)
                                    oldNeuron.material.color.setHex(currColor);
                                }
                            }
                        }

                        intersected = intersects[0].object;
                        console.log(intersected)

                        // set color to the current color of the intersected object
                        setCurrColor("#" + intersected.material.color.getHex().toString(16));
                        console.log(currColor)

                        // change neuron color
                        let connectedNeurons = intersected.geometry.userData.neurons;
                        if (connectedNeurons.length > 0) {
                            for (let i = 0; i < connectedNeurons.length; i++) {
                                // set color of neuron
                                const newNeuron = scene.getObjectByName(connectedNeurons[i]);

                                if (newNeuron) {
                                    // console.log(newNeuron)
                                    newNeuron.material.color.setHex("#ff0000");
                                }
                            }
                        }
                    }
                }
            } else {
                if (intersected) {
                    let prevNeurons = intersected.geometry.userData.neurons;
                    for (let i = 0; i < prevNeurons.length; i++) {
                        // this is an opacity change
                        const neuron = scene.getObjectByName(prevNeurons[i]);

                        if (neuron) {
                            neuron.material.color.setHex(currColor);
                        }
                    }
                }
                
                intersected = null;
            }
        }
    }, [motif, sharkViewerInstance])

    // displays data about presynaptic and postsynaptic distance
    function synapseView() {
        return (
            <div>
                <ReactTooltip place="top">jfdslkfjskdlfjsl</ReactTooltip>
            </div>
        )
    }

    return (
        <div id={id} className={className} onMouseMove={onPointerMove}></div>
    );

}

export default Viewer;