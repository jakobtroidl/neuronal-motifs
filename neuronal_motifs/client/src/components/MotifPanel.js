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


    // useEffect(() => {
    //     // Don't search if the motif string is null
    //         if(motif){
    //             fetchMotifs()
    //         }        
    //     }, [])

    // const handleSubmit = async () => {
    //     try {
    //         await fetchMotifs()
    //     } catch (err) {
    //         if (err.response.status === 404) {
    //             console.log('Resource could not be found!');
    //         } else {
    //             console.log(err.message);
    //         }
    //     }
    // }
    
    const handleSubmit = (e) => {
        console.log(e)
        e.preventDefault()
        fetchMotifs()
    }

    const fetchMotifs = async () => {
        console.log(motif, typeof(motif))
        const res = await axios(`http://localhost:5050/search/${motif}`)
        //const res = await axios(`http://localhost:5050/helloworld`)
        //const motifs = await res.json()
        const motifs = res
        console.log(motifs)
        setSearchedMotifs(motifs.data)
      }

    return (
        <div>
            <form onSubmit={(event) => handleSubmit(event)}>
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
            <script>
                if(searchedMotifs.length !== 0){
                    console.log(motif.length, searchedMotifs, "cool")
                    //console.log(motif.length)
                }
            </script>
        </div>
    )
}

export default MotifPanel;