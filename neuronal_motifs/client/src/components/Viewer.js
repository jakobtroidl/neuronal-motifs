import React, {useState, useEffect} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {getRandomColor} from '../utils/rendering';
import './Viewer.css'
import axios from "axios";

function Viewer() {
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {
        // Update the document title using the browser API
        axios.get(`http://localhost:5050/get_test_motif`)
            .then(res => {
                const viewer = new SharkViewer({dom_element: id});
                viewer.init();
                viewer.animate();
                let motif = JSON.parse(res.data);
                let neurons = JSON.parse(motif.neurons);

                for (let i = 0; i < neurons.length; i++) {
                    let neuron = JSON.parse(neurons[i]);
                    let parsedSwc = swcParser(neuron.skeleton_swc);
                    viewer.loadNeuron(neuron.id, getRandomColor(), parsedSwc);
                }
            })
    })

    return (
        <div id={id} className={className}></div>
    );
}

export default Viewer;