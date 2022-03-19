import React, { useState, useEffect } from 'react';
import axios from "axios";
/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* search is a get command */
/* think about using d3 with react for the grab components */
/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [number, setNumber] = useState(0);
    const [searchedMotifs, setSearchedMotifs] = useState({});
    
    const handleSubmit = (e) => {
        console.log(e)
        e.preventDefault()
        fetchMotifs()
    }

    const fetchMotifs = async () => {
        console.log(motif, typeof(motif))
        const res = await axios(`http://localhost:5050/search/motif=${motif}&lim=${number}`)
        const motifs = res
        console.log(motifs)
        setSearchedMotifs(motifs.data)
    }

    // const displaySearch = () => {
    //     if (searchedMotifs) {
    //         return (
    //             searchedMotifs.map((item) => (
    //                 <li>{item}</li>
    //                 ))
    //         )
    //     }
    //     else {
    //         return (
    //             <div>No motifs found</div>
    //         )
    //     }
    // }

    return (
        <div>
            <form onSubmit={(event) => handleSubmit(event)}>
                <div>
                    <label>
                    Motif BodyID: 
                    <input type="text" onChange={event => setMotif(event.target.value)} />
                    </label>
                </div>

                <div>
                    <label>Number: 
                    <input 
                        type="number"
                        value="1"
                        onChange={event => setNumber(event.target.value)} />
                    </label>
                </div>

                <input type="submit" value="Search" />
            </form>
            
            {/* {displaySearch} */}
        </div>
    )
}

export default MotifPanel;