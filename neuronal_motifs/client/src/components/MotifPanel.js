import React, {useState, useEffect, useContext} from 'react';
import axios from "axios";
import './MotifPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";
import SearchButton from "./Button";
import {faEraser, faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";
import {AppContext} from "../contexts/AbstractionLevelContext";
import SketchPanel from "./SketchPanel";
/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* search is a get command */
/* think about using d3 with react for the grab components */

/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [number, setNumber] = useState(1);
    const [searchedMotifs, setSearchedMotifs] = useState({});
    const motifPanelId = 'motif-panel-div'
    const context = useContext(AppContext);


    const handleSubmit = (e) => {
        console.log(e)
        e.preventDefault()
        fetchMotifs()
    }

    const fetchMotifs = async () => {
        const encodedMotif = encodeURIComponent(Object.keys(context.store.motifQuery).join('\n'));
        const res = await axios(`http://localhost:5050/search/motif=${encodedMotif}&lim=${number}`)
        const motifs = res.data
        console.log(motifs)
        setSearchedMotifs(motifs)
    }

    const displaySearch = () => {
        if (searchedMotifs.length !== undefined) {
            var list = document.getElementById('returned_value');
            var heading = document.createElement('h5')
            heading.appendChild(document.createTextNode("Returned Neuron Ids"));
            list.appendChild(heading);
            console.log(searchedMotifs)

            searchedMotifs.forEach(motif => {
                console.log(motif)
                for (const [name, neuron] of Object.entries(motif)) {
                    console.log(neuron);
                    var entry = document.createElement('li');
                    entry.appendChild(document.createTextNode(neuron.bodyId));
                    list.appendChild(entry);
                }
            })



        } else {
            return (
                <div>No motifs found</div>
            )
        }
    }

    return (
        <div id={motifPanelId}>
            <div className="handle">
                <FontAwesomeIcon icon={faUpDownLeftRight}/>
            </div>
            <div id='motif-panel-wrapper'>
                <SketchPanel/>
                <form onSubmit={(event) => handleSubmit(event)}>
                    <div>
                        <label>Number:
                            <input
                                type="number"
                                defaultValue="1"
                                onChange={event => setNumber(event.target.value)}/>
                        </label>
                    </div>
                    <SearchButton/>
                    <input type="submit" value="Search"/>
                </form>
                <ul id="returned_value"></ul>


                <script>
                    {displaySearch()}
                </script>
            </div>
        </div>
    )
}

export default MotifPanel;