import React, {useState, useEffect} from 'react';
import SharkViewer, {swcParser} from '@janelia/sharkviewer';
import './Viewer.css'

function Viewer() {
    const id = "my_shark_viewer";
    const className = 'shark_viewer';
    const swc = swcParser('\n# ORIGINAL_SOURCE NeuronStudio 0.8.80\n# CREATURE\n# REGION\n# FIELD/LAYER\n# TYPE\n# CONTRIBUTOR\n# REFERENCE\n# RAW\n# EXTRAS\n# SOMA_AREA\n# SHINKAGE_CORRECTION 1.0 1.0 1.0\n# VERSION_NUMBER 1.0\n# VERSION_DATE 2007-07-24\n# SCALE 1.0 1.0 1.0\n 1 1 14.566132 34.873772 7.857000 0.717830 -1\n 2 0 16.022520 33.760513 7.047000 0.463378 1\n 3 5 17.542000 32.604973 6.885001 0.638007 2\n 4 0 19.163984 32.022469 5.913000 0.602284 3\n 5 0 20.448090 30.822802 4.860000 0.436025 4\n 6 6 21.897903 28.881084 3.402000 0.471886 5\n 7 0 18.461960 30.289471 8.586000 0.447463 3\n 8 6 19.420759 28.730757 9.558000 0.496217 7\n')
    const mdata = JSON.parse('\n[{"label":"undefined","type":0},{"label":"soma","type":1},{"label":"axon","type":2},{"label":"dendrite","type":3},{"label":"apical dendrite","type":4},{"label":"fork point","type":5},{"label":"end point","type":6},{"label":"custom","type":7}]\n')
    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {
        // Update the document title using the browser API
        const viewer = new SharkViewer({dom_element: id});
        viewer.init();
        viewer.animate();
        viewer.loadNeuron('test', '#ff0000', swc);
    });

    return (
        <div id={id} className={className}></div>
    );
}

export default Viewer;