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
    const [loadedNeurons, setLoadedNeurons] = useState()
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);


    // Instantiates the viewer, will only run once on init
    useEffect(() => {
        const metadata = [{"label": "in_path", "type": 0},
            {"label": "synapse", "type": 1}, {"label": "off_path", "type": 2}, {"label": "unlabeled", "type": 3}];
        setColors(
            [
                '#ff9a00',
                '#000000'
                //getRandomColor(),
                //getRandomColor(),
                //getRandomColor()
            ]
        )

        let col = ['#ff9a00', '#ff0000', '#000000', '#f6ff00']

        setSharkViewerInstance(
            new SharkViewer({dom_element: id, metadata: metadata, colors: col})
        )
        setInitialized(
            false
        )



        setLoadedNeurons(
            [0,
                1000,
                2000]
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
            let neurons = motif.neurons;
            let i = 0;

            console.log(neurons)
            neurons.forEach(n => {
                //if(i===1) {
                    let slider_value = context.store.abstractionLevel
                    //let level = Math.round((n.skeleton_abstractions.length - 1) * slider_value)
                    //let abstr = n.skeleton_abstractions[level]
                    let parsedSwc = swcParser(n.skeleton_swc)
                    // Iterate over our labels, assigning 0 = in_path, else not_in_path
                    //console.log(n.skeleton_labels)
                    for (let i in n.skeleton_labels) {
                        let label = n.skeleton_labels[i]
                        let new_id = n.node_map[i]  // remap original id to new id.
                        // Necessary due to some data shuffling in swc export
                        if (label === 0) {
                            parsedSwc[new_id].type = 0
                        }
                        if (label === 1) {
                            parsedSwc[new_id].type = 1
                        }
                        if (label > 2) {
                            parsedSwc[new_id].type = 2
                        }
                        if (label < 0) {
                            parsedSwc[new_id].type = 3
                        }
                    }

                    //console.log(parsedSwc)

                    //let id = i * 1000 + level

                    //console.log(loadedNeurons)

                    if (!initialized) {
                        sharkViewerInstance.loadNeuron(n.id, null, parsedSwc);
                        setInitialized(true)
                    } else {
                        sharkViewerInstance.unloadNeuron(n.id);
                        sharkViewerInstance.loadNeuron(n.id, null, parsedSwc, false);
                    }


                    // let tmp = loadedNeurons
                    // tmp[i] = id
                    // setLoadedNeurons(tmp)
                //}
                i += 1

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