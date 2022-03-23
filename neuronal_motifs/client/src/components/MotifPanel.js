import React, {useState, useEffect, useContext} from 'react';
import axios from "axios";
import './MotifPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEraser, faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";
import {AppContext} from "../contexts/AbstractionLevelContext";
import SketchPanel from "./SketchPanel";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* search is a get command */
/* think about using d3 with react for the grab components */

/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [number, setNumber] = useState(1);
    const [searchedMotifs, setSearchedMotifs] = useState({});
    const [resultRows, setResultRows] = useState([]);
    const motifPanelId = 'motif-panel-div'
    const context = useContext(AppContext);


    const handleSubmit = () => {
        console.log('handle submit clicked')
        //e.preventDefault()
        fetchMotifs()
    }

    const fetchMotifs = async () => {
        //const encodedMotif = encodeURIComponent(Object.keys(context.store.motifQuery).join('\n'));
        const encodedMotif = JSON.stringify(context.store.motifQuery);

        console.log(encodedMotif);

        const res = await axios(`http://localhost:5050/search/motif=${encodedMotif}&lim=${number}`)
        const motifs = res.data
        console.log(motifs)
        setSearchedMotifs(motifs)
    }
    useEffect(() => {
        if (searchedMotifs && searchedMotifs?.length > 0) {
            let rows = searchedMotifs.map(motif => {
                let motifs = Object.entries(motif).map(([k, v], i) => {
                    return {...v, nodeKey: k}
                })
                motifs.sort((a, b) => {
                    return a.nodeKey.localeCompare(b.nodeKey)
                })
                return motifs;

            })
            setResultRows(rows);
        }

    }, [searchedMotifs])


    const displaySearch = () => {
        if (searchedMotifs.length !== undefined) {
            //    bodyId, instance, type, status

        } else {
            return (
                <div>No motifs found</div>
            )
        }
    }

    return (
        <div id={motifPanelId}>
            <div className='form'>
                <div className="handle">
                    <FontAwesomeIcon icon={faUpDownLeftRight}/>
                </div>
                <div id='motif-panel-wrapper'>
                    <SketchPanel/>
                    <div className="formRow">
                        <div >
                            <TextField
                                id="outlined-number"
                                label="Number"
                                type="number"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin="normal"
                                defaultValue={1}
                                onChange={event => setNumber(event.target.value)}
                            />
                        </div>
                        <div className="buttonDiv">
                            <Button variant="contained" startIcon={<SearchIcon/>} onClick={handleSubmit}>
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {resultRows?.length > 0 &&
            < div className='results'>
                <TableContainer component={Paper} className='table'>
                    <Table sx={{minWidth: 400, maxWidth: 400}} size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <div className='textContainer'>Node</div>
                                </TableCell>
                                <TableCell>
                                    <div className='textContainer'>Body ID</div>
                                </TableCell>
                                <TableCell>
                                    <div className='textContainer'>Instance</div>
                                </TableCell>
                                <TableCell>
                                    <div className='textContainer'>Type</div>
                                </TableCell>
                                <TableCell>
                                    <div className='textContainer'>Status</div>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resultRows.map((motif, i) => motif.map((row, j) => (
                                <TableRow className={`row-${j}`}
                                          key={`${row.nodeKey}-${i}`}
                                          sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                >
                                    <TableCell component="th" scope="row">
                                        <div className='textContainer'>  {row.nodeKey}</div>
                                    </TableCell>


                                    <TableCell>
                                        <div className='textContainer'>{row?.bodyId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='textContainer'>{row?.instance}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='textContainer'>{row?.type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='textContainer'>{row?.status}</div>
                                    </TableCell>
                                </TableRow>
                            )))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            }
        </div>
    )
}

export default MotifPanel;