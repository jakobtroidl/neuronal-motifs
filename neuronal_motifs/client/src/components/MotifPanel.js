import React, {useState, useEffect, useContext} from 'react';
import axios from "axios";
import './MotifPanel.css'
import {AppContext} from "../contexts/GlobalContext";
import SketchPanel from "./SketchPanel";
import SearchIcon from "@mui/icons-material/Search";
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Button from "@mui/material/Button";
import {TextField, FormHelperText, InputLabel, Select, MenuItem, FormControl, Grid} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import _ from 'lodash';

import {CollapsableTableRow} from './CollapsableTableRow'


/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* search is a get command */
/* think about using d3 with react for the grab components */

/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

function MotifPanel() {
    const [number, setNumber] = useState(1);
    const [nodeAttribute, setNodeAttribute] = useState("");
    const [nodeAttributeProperties, setNodeAttributeProperties] = useState([]);
    const [edgeAttribute, setEdgeAttribute] = useState("");
    const [edgeAttributeProperties, edgeNodeAttributeProperties] = useState([]);
    const [searchedMotifs, setSearchedMotifs] = useState({});
    const [resultRows, setResultRows] = useState([]);
    const motifPanelId = 'motif-panel-div'
    const context = useContext(AppContext);


    const handleSubmit = () => {
        console.log('handle submit clicked')
        return fetchMotifs()
    }

    const handleMotifSelection = (motif) => {
        //context.setAbstractionLevel(0);
        context.setSelectedMotif(motif.neurons);
    }

    const fetchMotifs = async () => {
        console.log('Fetch Motifs');
        context.setLoadingMessage('Searching for Motifs')
        const res = await axios.post('http://localhost:5050/search',{
            motif: context.motifQuery,
            lim: number})
        const motifs = res.data;
        context.setLoadingMessage(null)
        setSearchedMotifs(motifs)
    }
    useEffect(() => {
        if (searchedMotifs && searchedMotifs?.length > 0) {
            let rows = searchedMotifs.map((motif, j) => {
                let motifs = Object.entries(motif).map(([k, v], i) => {
                    return {...v, nodeKey: k}
                })
                motifs.sort((a, b) => {
                    return a.nodeKey.localeCompare(b.nodeKey)
                })
                return {name: 'Motif' + j, neurons: motifs};

            })
            setResultRows(rows);
        }

    }, [searchedMotifs])

    return (
        <div id={motifPanelId}>
            <div className='form'>
                <div className="handle">
                    <DragHandleIcon/>
                </div>
                <div id='motif-panel-wrapper'>
                    <div className="formRow">
                        <SketchPanel/>
                    </div>
                    <div className="formRow" style={{marginTop: "10px"}}>
                        <Grid
                            container
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                        >
                            <Grid item>
                                <FormControl sx={{m: 1, maxWidth: 80}}>
                                    <TextField
                                        id="outlined-number"
                                        label="Number"
                                        type="number"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        margin="normal"
                                        style={{marginTop: 0}}
                                        defaultValue={1}
                                        onChange={event => setNumber(_.toNumber(event.target.value))}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item>
                                <FormControl sx={{m: 1, minWidth: 100}}>
                                    <Button style={{height: 52}} variant="contained" startIcon={<SearchIcon/>}
                                            onClick={handleSubmit}>
                                        Search
                                    </Button>
                                </FormControl>
                            </Grid>

                        </Grid>
                    </div>

                </div>


                {resultRows?.length > 0 &&
                < div className='results'>
                    <TableContainer component={Paper} sx={{backgroundColor: 'rgba(255, 255, 255, 0.0)'}}>
                        <Table aria-label="collapsible table">
                            <TableHead>
                                <TableRow>
                                    <TableCell/>
                                    <TableCell>Name</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    resultRows.map((row) => (
                                        <CollapsableTableRow key={row.name} row={row}
                                                             handleClick={handleMotifSelection}/>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
                }
            </div>
        </div>
    )
}

export default MotifPanel;