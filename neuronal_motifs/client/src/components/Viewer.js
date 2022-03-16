import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/AbstractionLevelContext";
import {getRandomColor} from '../utils/rendering';
import './Viewer.css'
import axios from "axios";

function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [initialized, setInitialized] = useState()  // track whether scene was initialized or not. e.g., used for camera updates
    const [colors, setColors] = useState()  // store motif colors
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);
    const metadata = [{"label": "in_path", "type": 0},
        {"label": "synapse", "type": 1},
        {"label": "neuron 1", "type": 2},
        {"label": "neuron 2", "type": 3},
        {"label": "neuron 3", "type": 4}];

    // Instantiates the viewer, will only run once on init
    useEffect(() => {
        setSharkViewerInstance(
            new SharkViewer({dom_element: id, metadata: metadata, colors: colors})
        )
        setInitialized(
            false
        )

        setColors(
            [
                getRandomColor(),
                getRandomColor(),
                getRandomColor()
            ]
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
    useEffect( () => {
        if (motif && sharkViewerInstance) {
            let neurons = motif.neurons;
            let i = 0;
            neurons.forEach(n => {
                let slider_value = context.store.abstractionLevel
                let level = Math.round((n.skeleton_abstractions.length - 1) * slider_value)
                let abstr = n.skeleton_abstractions[level]
                let parsedSwc = swcParser(abstr.swc)
                // Iterate over our labels, assigning 0 = in_path, else not_in_path
                // for (let i = 1; i <= n.skeleton_labels.length; i++) {
                //     let label = n.skeleton_labels[i]
                //     let new_id = n.node_map[i]  // remap original id to new id.
                //     // Necessary due to some data shuffling in swc export
                //     if (label === 0) {
                //         parsedSwc[new_id].type = 0
                //     } else if (label === 1) {
                //         parsedSwc[new_id].type = 1
                //     } else if (label === -1) {
                //         parsedSwc[new_id].type = 2
                //     } else if (label === -2) {
                //         parsedSwc[new_id].type = 3
                //     } else if (label === -3) {
                //         parsedSwc[new_id].type = 4
                //     }
                // }
                sharkViewerInstance.unloadNeuron(n.id);


                if (!initialized)
                {
                    sharkViewerInstance.loadNeuron(n.id, colors[i], parsedSwc);
                    setInitialized(true)
                }
                else {
                    sharkViewerInstance.loadNeuron(n.id, colors[i], parsedSwc, false);
                }
                i+=1

            })
        }

    }, [motif, sharkViewerInstance, context.store.abstractionLevel])

    // useEffect(async() => {
    //     console.log(context.store.abstractionLevel);
    //     // let factor = context.store.abstractionLevel / 10.0
    //     // let res = await axios.get(`http://localhost:5050/get_pruned_test_motif/` + factor);
    //     // setMotif(res.data)
    //
    // }, [context.store.abstractionLevel])

    return (
        <div id={id} className={className}></div>
    );

}

export default Viewer;