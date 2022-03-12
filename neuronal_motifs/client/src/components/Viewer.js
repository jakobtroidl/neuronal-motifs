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
                    {"label": "not_in_path", "type": 2}];
                //const annotation = [{'x': 15934, 'y': 31645, 'z': 12408}]
                //const annotation_color = '#ff9a00'

                let colors = [
                    '#ff9a00',
                    '#ff0000',
                    '#646464',
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
                        let new_id = n.node_map[i]
                        //console.log("old id: ", i, ". new id: ", new_id)
                        if (label === 0) {
                            parsedSwc[new_id].type = 0
                        } else if (label === 1) {
                            parsedSwc[new_id].type = 1
                        } else {
                            parsedSwc[new_id].type = 2
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