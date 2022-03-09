import React, { useState, useEffect } from 'react';
import axios from "axios";
/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* search is a get command */
/* think about using d3 with react for the grab components */
/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [searchedMotifs, setSearchedMotifs] = useState({});

    useEffect(() => {
            fetchMotifs()
        }, [])

    const handleSubmit = async () => {
        try {
            await fetchMotifs()
        } catch (err) {
            if (err.response.status === 404) {
                console.log('Resource could not be found!');
            } else {
                console.log(err.message);
            }
        }
    }

    console.log(motif)

    const fetchMotifs = async () => {
        const res = await axios(`http://localhost:5050/search/${motif}`)
        const motifs = await res.json()

        console.log(motifs)
        setSearchedMotifs(motifs.data)
      }

    return (
        <div>
            <form onSubmit={() => handleSubmit()}>
                <label>
                Motif:  
                <input type="text" onChange={event => setMotif(event.target.value)} />
                </label>
                <input type="submit" value="Submit" />
            </form>
            {/* <div>
                {searchedMotifs.map((item) => (
                <li>{item}</li>
                ))}
            </div> */}
        </div>
    )
}

export default MotifPanel;