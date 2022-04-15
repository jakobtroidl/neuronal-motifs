import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";


function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [loadedNeurons, setLoadedNeurons] = useState()
    const [prevSliderValue, setPrevSliderValue] = useState()
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);


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
            let neurons = motif.neurons;
            const orange = new THREE.Color("rgb(255,154,0)");

            neurons.forEach(neuron => {
                let synapses = neuron.synapses;
                let scene = sharkViewerInstance.scene;
                synapses.forEach(syn => {
                    // create a sphere shape
                    let geometry = new THREE.SphereGeometry(90, 16, 16);
                    let material = new THREE.MeshBasicMaterial({color: orange});
                    let mesh = new THREE.Mesh(geometry, material);

                    mesh.position.x = syn.x;
                    mesh.position.y = syn.y;
                    mesh.position.z = syn.z;

                    scene.add(mesh);
                })
            })
        }
    }, [motif, sharkViewerInstance])

    return (
        <div id={id} className={className}></div>
    );

}

export default Viewer;