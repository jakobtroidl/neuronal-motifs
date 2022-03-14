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
                const metadata = [{"label": "in_path", "type": 0},
                    {"label": "synapse", "type": 1},
                    {"label": "neuron 1", "type": 2},
                    {"label": "neuron 2", "type": 3},
                    {"label": "neuron 3", "type": 4}];

                let colors = [
                    '#ff9a00',
                    '#ff0000',
                    '#010fff',
                    '#00ff17',
                    '#dd01ff',
                ]

                const viewer = new SharkViewer({dom_element: id, metadata: metadata, colors: colors});
                viewer.init();
                viewer.animate();

                let motif = res.data;
                let neurons = motif.neurons;

                neurons.forEach(n => {
                    let parsedSwc = swcParser(n.skeleton_swc)
                    // Iterate over our labels, assigning 0 = in_path, else not_in_path
                    for (let i = 1; i <= n.skeleton_labels.length; i++) {
                        let label = n.skeleton_labels[i]
                        let new_id = n.node_map[i]  // remap original id to new id.
                        // Necessary due to some data shuffling in swc export
                        if (label === 0) {
                            parsedSwc[new_id].type = 0
                        } else if (label === 1) {
                            parsedSwc[new_id].type = 1
                        } else if (label === -1) {
                            parsedSwc[new_id].type = 2
                        } else if (label === -2) {
                            parsedSwc[new_id].type = 3
                        } else if (label === -3) {
                            parsedSwc[new_id].type = 4
                        }
                    }

                    // Null for color makes you color by type instead of the whole neuron
                    viewer.loadNeuron(n.id, null, parsedSwc);
                })
            })
    });

        return (
            <div id={id} className={className}></div>
        );

}

export default Viewer;