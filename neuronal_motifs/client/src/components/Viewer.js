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
                const metadata = [{"label": "in_path", "type": 0}, {"label": "not_in_path", "type": 1}];
                const viewer = new SharkViewer({dom_element: id, metadata: metadata});
                viewer.init();
                viewer.animate();
                let motif = res.data;
                let neurons = motif.neurons;
                neurons.forEach(n => {
                    let parsedSwc = swcParser(n.skeleton_swc);
                    // Iterate over our labels, assigning 0 = in_path, else not_in_path
                    n?.skeleton_labels.forEach((l, i) => {
                        //starting index in parsedSwc = 1
                        if (l === 0) {
                            parsedSwc[i + 1].type = 0
                        } else {
                            parsedSwc[i + 1].type = 1
                        }
                    })
                    // Null for color makes you color by type instead of the whole neuron
                    viewer.loadNeuron(n.id, null, parsedSwc);
                })
            })
    })

    return (
        <div id={id} className={className}></div>
    );
}

export default Viewer;