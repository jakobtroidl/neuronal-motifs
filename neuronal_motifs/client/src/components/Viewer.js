import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import * as THREE from 'three';
import axios from "axios";

function generateSphere(x, y, z, color, radius){
    // create a sphere shape
    let geometry = new THREE.SphereGeometry(radius, 16, 16);
    let material = new THREE.MeshBasicMaterial({color: color});
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    return mesh
}

function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [loadedNeurons, setLoadedNeurons] = useState()
    const [prevSliderValue, setPrevSliderValue] = useState()
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);


    const metadata = [{"label":"skeleton","type":0},{"label":"soma","type":1}, {"label":"x","type":2}, {"label":"y","type":3}]
    const debug_colors = ['#938b8b', '#e600ff', '#ff0000', '#ffc400']

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
            let scene = sharkViewerInstance.scene;
            let neurons = motif.neurons;
            const pre_synapse_color = new THREE.Color('rgb(255,154,0)');
            const post_synapse_color = new THREE.Color('rgb(203,85,85)');
            const soma_color = new THREE.Color('rgb(255,0,0)');

            neurons.forEach(neuron => {
                console.log(neuron.synapses);
                let pre_synapses = neuron.synapses.pre_syn;

                // add synapses
                pre_synapses.forEach(syn => {
                    scene.add(generateSphere(syn.x, syn.y, syn.z, pre_synapse_color, 50));
                })

                let post_synapses = neuron.synapses.post_syn;
                console.log(post_synapses);
                // add synapses
                post_synapses.forEach(syn => {
                    scene.add(generateSphere(syn.x, syn.y, syn.z, post_synapse_color, 50));
                })

                // add soma
                let soma = neuron.soma_pos;
                if (soma){
                    soma = soma[0];
                    scene.add(generateSphere(soma[0], soma[1], soma[2], soma_color, 300));
                }

            })
        }
    }, [motif, sharkViewerInstance])

    return (
        <div id={id} className={className}></div>
    );

}

export default Viewer;