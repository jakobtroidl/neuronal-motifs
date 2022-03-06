import React, { useState } from 'react';
/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* logic: 
    1. search bar takes in the motif 
    2. when submitted, the motif gets sent to the backend
    3.
*/

/* think about using d3 with react for the grab components */
/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [searchedMotifs, setSearchedMotifs] = useState('');

    const handleSubmit = () => {
        /* do something with `motif` here - call another function */
    }

    return (
        <form onSubmit={handleSubmit()}>
            <label>
            Motif:  
            <input type="text" value={motif} onChange={motif => setMotif(motif)} />
            </label>
            <input type="submit" value="Submit" />
        </form>
    )
}

export default MotifPanel;