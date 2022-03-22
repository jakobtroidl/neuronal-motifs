import React, {useState, useEffect} from 'react';
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
    const motifPanelId = 'motif-panel-div'

    const handleSubmit = (e) => {
        console.log(e)
        e.preventDefault()
        fetchMotifs()
    }

    const fetchMotifs = async () => {
        console.log(motif, typeof (motif))
        const res = await axios(`http://localhost:5050/search/motif=${motif}&lim=${number}`)
        const motifs = res
        console.log(motifs)
        setSearchedMotifs(motifs.data)
    }

    const displaySearch = () => {
        if (searchedMotifs.length !== undefined) {
            var list = document.getElementById('returned_value');
            var heading = document.createElement('h5')
            heading.appendChild(document.createTextNode("Returned Neuron Ids"));
            list.appendChild(heading);
            console.log(searchedMotifs[0].length)
            for (let i = 0; i < searchedMotifs.length; i++) {
                for (let j = 0; j < searchedMotifs[i].length; j++) {
                    var entry = document.createElement('li');
                    entry.appendChild(document.createTextNode(searchedMotifs[i][j]));
                    list.appendChild(entry);
                }
            }

        } else {
            return (
                <div>No motifs found</div>
            )
        }
    }

    return (
        <div id={motifPanelId}>
            <form onSubmit={(event) => handleSubmit(event)}>
                <div>
                    <label>
                        Motif BodyID:
                        <textarea type="text" onChange={event => setMotif(event.target.value)}/>
                    </label>
                </div>

                <div>
                    <label>Number:
                        <input
                            type="number"
                            defaultValue="1"
                            onChange={event => setNumber(event.target.value)}/>
                    </label>
                </div>

                <input type="submit" value="Search"/>
            </form>
            <ul id="returned_value"></ul>


            {/* {displaySearch} */}
            <script>
                {displaySearch()}
            </script>
        </div>
    )
}

export default MotifPanel;