import React, {useState, useEffect} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import './Viewer.css'
import axios from "axios";

function Viewer() {
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {
        // Update the document title using the browser API
        axios.get(`http://localhost:5050/get_swc`)
            .then(res => {
                const viewer = new SharkViewer({dom_element: id});
                viewer.init();
                viewer.animate();
                let parsedSwc = swcParser(res.data.swc);
                viewer.loadNeuron('test', '#ff0000', parsedSwc);
            })


    })

    return (
        <div id={id} className={className}></div>
    );
}

export default Viewer;