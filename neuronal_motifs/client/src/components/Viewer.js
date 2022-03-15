import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/AbstractionLevelContext";
import {getRandomColor} from '../utils/rendering';
import './Viewer.css'
import axios from "axios";

function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);
    let viewer;
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
    // Instantiates the viewer, will only run once on init
    useEffect(() => {
        setSharkViewerInstance(
            new SharkViewer({dom_element: id, metadata: metadata, colors: colors})
        )
    }, [])
    // Inits the viewer once it is created
    useEffect(() => {
        if (sharkViewerInstance) {
            sharkViewerInstance.init();
            sharkViewerInstance.animate();
        }
    }, [sharkViewerInstance])
    // Fetches the data, only runs on init
    useEffect(async () => {
        if (!motif) {
            // Update the document title using the browser API
            let res = await axios.get(`http://localhost:5050/get_test_motif`);
            setMotif(res.data);
        }
    }, []);
    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {
            console.log(context.store.abstractionLevel);
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
                if (context.store.abstractionLevel == 0) {
                    sharkViewerInstance.loadNeuron(n.id, null, parsedSwc);
                } else if (context.store.abstractionLevel == 1) {
                    sharkViewerInstance.unloadNeuron(n.id);
                    Object.keys(parsedSwc).forEach(key => {
                        if (parsedSwc[key].type !== 0 || parsedSwc[key].type !== 1) {
                            parsedSwc[key].radius = 0;
                        }
                    })
                    sharkViewerInstance.loadNeuron(n.id, null, parsedSwc);
                } else {
                    sharkViewerInstance.unloadNeuron(n.id);
                }
            })
        }

    }, [motif, sharkViewerInstance, context.store.abstractionLevel])

    return (
        <div id={id} className={className}></div>
    );

}

export default Viewer;