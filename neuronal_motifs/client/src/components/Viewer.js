import React, {useState, useEffect, useContext, useRef} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";
import Draggable from 'react-draggable';

function Viewer() {
    const [motif, setMotif] = React.useState()
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
    const [intersected, setIntersected] = useState();
    const [currColor, setCurrColor] = useState();

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
        if (context.selectedMotif)
        {
            let selectedMotif = context.selectedMotif;
            let bodyIds = selectedMotif.map(m => m.bodyId);

            bodyIds = JSON.stringify(bodyIds);
            let motifQuery = JSON.stringify(context.motifQuery);

            let id_ranges = Array.from({length: selectedMotif.length}, (_, i) => i * 1000);
            setLoadedNeurons(id_ranges);

            let res = await axios.get(`http://localhost:5050/display_motif/bodyIDs=${bodyIds}&motif=${motifQuery}`);
            //let res = await axios.get(`http://localhost:5050/get_test_motif`);
            setMotif(res.data);
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

            // update the synapse picking ray with the camera and pointer position
            raycaster.setFromCamera(pointer, sharkViewerInstance.camera);

            neurons.forEach(neuron => {
                let synapses = neuron.synapses;
                let scene = sharkViewerInstance.scene;
                synapses.forEach(syn => {
                    // create a sphere shape
                    let geometry = new THREE.SphereGeometry(90, 16, 16);
                    let material = new THREE.MeshBasicMaterial({color: orange});
                    let mesh = new THREE.Mesh(geometry, material);

                    mesh.geometry.name = "synapse";

                    mesh.position.x = syn.x;
                    mesh.position.y = syn.y;
                    mesh.position.z = syn.z;

                    scene.add(mesh);
                })
            })
        }
    }, [motif, sharkViewerInstance])

    // synapse picking
    // neuron geometry is undefined; synapse geometry is SphereGeometry
    // useEffect(() => {
    //     if (motif && sharkViewerInstance) {
    //         let neurons = motif.neurons;
    //         let scene = sharkViewerInstance.scene;
    //         // let synapses = neuron.synapses; 

    //         // update the synapse picking ray with the camera and pointer position
    //         raycaster.setFromCamera(pointer, sharkViewerInstance.camera);

    //         // calculate objects intersecting the picking ray
	//         const intersects = raycaster.intersectObjects(scene.children);

    //         if (intersects.length > 0) {
    //             // color handling
    //             if (intersected != intersects[0].object) { // highlight only the first thing your ray intersects
    //                 if (intersected) {
    //                     // return the color of the object in old intersected back to original
    //                     // need to do something more complicated with state stuff
    //                     intersected.material.color.setHex(currColor);
    //                 }

    //                 setIntersected(intersects[0].object);

    //                 // set color to the current color of the intersected object
    //                 setCurrColor(intersected.material.color.getHex());

    //                 // need to do something more complicated with state stuff
    //                 intersects[0].object.material.color.setHex(0xff0000);
    //             }

    //             // display logic handling
    //             if (intersects[0].object.geometry.name == "synapse") {
    //                 synapseView();
    //             } else {
    //                 neuronView();
    //             }
    //         } else {
    //             if (intersected) {
    //                 // need to do something more complicated with state stuff
    //                 intersected.material.color.setHex(currColor);
    //             }
                
    //             setIntersected(null);
    //         }
    //     }
    // }, [motif, sharkViewerInstance])

    // function synapseView() {
    //     // load in data about the presynaptic and postsynaptic distance
    //     // need neurons that synapse connects
    //         // possibly need to give each synapse a field as well
    //     // some styling to make it show up right next to pointer
    //     return (
    //         <Draggable></Draggable>
    //     )
    // }

    // function neuronView() {
    //     // blah blah blah
    //     // info about the neurons
    //     // some styling to make it show up right next to pointer
    //     return (
    //         <Draggable></Draggable>
    //     )
    // }

    return (
        <div id={id} className={className} onMouseMove={onPointerMove}></div>
    );

}

export default Viewer;