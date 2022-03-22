import React, {useState, useEffect, useContext} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import {AppContext} from "../contexts/AbstractionLevelContext";
import {getRandomColor} from '../utils/rendering';
import './Viewer.css'
import axios from "axios";

function Viewer() {
    const [motif, setMotif] = React.useState()
    const [sharkViewerInstance, setSharkViewerInstance] = useState();
    const [colors, setColors] = useState()  // store motif colors
    const [loadedNeurons, setLoadedNeurons] = useState()
    const [prevSliderValue, setPrevSliderValue] = useState()
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Global context holds abstraction state
    const context = useContext(AppContext);


    // Instantiates the viewer, will only run once on init
    useEffect(() => {
        setColors(
            [
                getRandomColor(),
                getRandomColor(),
                getRandomColor()
            ]
        )

        setSharkViewerInstance(
            new SharkViewer({dom_element: id})
        )

        setLoadedNeurons(
            [0, 1000, 2000]
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
    // Fetches the data, only runs on init
    useEffect(async () => {
        if (!motif) {
            // Update the document title using the browser API
            let res = await axios.get(`http://localhost:5050/get_test_motif`);
            setMotif(res.data);
        }
    }, []);

    useEffect(() => {
        if (motif && sharkViewerInstance) {
            let i = 0
            motif.neurons.forEach(n => {
                let j = 0
                n.skeleton_abstractions.forEach(abstraction => {
                    let parsedSwc = swcParser(abstraction.swc)
                    let id = i * 1000 + j

                    if (j === 0) {
                        sharkViewerInstance.loadNeuron(id, colors[i], parsedSwc, true);
                        sharkViewerInstance.setNeuronVisible(id, true)
                    } else {
                        sharkViewerInstance.loadNeuron(id, colors[i], parsedSwc, false);
                        sharkViewerInstance.setNeuronVisible(id, false)
                    }
                    j++
                })
                i += 1
            })
        }
    }, [motif, sharkViewerInstance])
    // Updates the motifs, runs when data, viewer, or abstraction state change
    useEffect(() => {
        if (motif && sharkViewerInstance) {
            let neurons = motif.neurons;
            let j = 0;
            neurons.forEach(n => {
                let slider_value = context.store.abstractionLevel;

                let level = Math.round((n.skeleton_abstractions.length - 1) * slider_value);
                let load_id = loadedNeurons[j] + level;
                let unload_id = loadedNeurons[j] + prevSliderValue;

                if (load_id !== unload_id) {
                    // console.log('load -> ', load_id);
                    // console.log('unload -> ', unload_id);
                    sharkViewerInstance.setNeuronVisible(load_id, true)//, colors[j], parsedSwc, false);
                    sharkViewerInstance.setNeuronVisible(unload_id, false);
                }
                setPrevSliderValue(level);
                j += 1;
            })
        }
    }, [context.store.abstractionLevel])

    return (
        <div id={id} className={className}></div>
    );

}

export default Viewer;