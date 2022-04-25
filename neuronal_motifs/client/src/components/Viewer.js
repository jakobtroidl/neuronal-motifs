import React, {useState, useEffect, useContext, useRef} from 'react';
import ReactTooltip from 'react-tooltip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ArrowTooltips from './ArrowTooltips'
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
            console.log(motif)
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
                        // n neurons with complexity level that are set to visible or set to invisible
                        // enabling the visibility of each of those. many objects in the threejs scene that correspond to what the neuron is
                        // highlight the right neuron for the current abstraction level
                        // each neuron has the same id space, the original neuron is id=0, id=1
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

                        console.log(motif.distances)
                        setDisplayTooltip(true)
                        setTooltipInfo({distances:motif.distances,event:event })
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
            { displayTooltip &&
            <ArrowTooltips props={tooltipInfo}></ArrowTooltips>
            }
        
        </div>
    );

}

export default Viewer;