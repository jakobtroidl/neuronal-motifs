import React, {useState, useEffect, useContext} from 'react';
import axios from "axios";
import './MotifPanel.css'
import {AppContext} from "../contexts/GlobalContext";
import SketchPanel from "./SketchPanel";
import SearchIcon from "@mui/icons-material/Search";
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Button from "@mui/material/Button";
import {
    TextField,
    FormControl,
    Grid,
    Tooltip,
    IconButton, Popper, Box, FormControlLabel, Switch, FormGroup, FormLabel, Typography
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import _ from 'lodash';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {CollapsableTableRow} from './CollapsableTableRow'
<<<<<<< HEAD
import {NodeFields} from "../config/NodeFields";
=======

>>>>>>> 008c71b... i think i got the geodesic distances?

function MotifPanel() {
    const [number, setNumber] = useState(1);
    const [nodeAttribute, setNodeAttribute] = useState("");
    const [nodeAttributeProperties, setNodeAttributeProperties] = useState([]);
    const [edgeAttribute, setEdgeAttribute] = useState("");
    const [edgeAttributeProperties, edgeNodeAttributeProperties] = useState([]);
    const [searchedMotifs, setSearchedMotifs] = useState({});
    const [resultRows, setResultRows] = useState([]);
    const [columnFilterAnchorEl, setColumnFilterAnchorEl] = React.useState(null);
    const [columnFilterOpen, setColumnFilterOpenOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState({});

    const handleVisibleColumnChange = (event) => {
        setVisibleColumns({
            ...visibleColumns,
            [event.target.name]: event.target.checked,
        });
    };

    const handleColumnFilterClick = (event) => {
        setColumnFilterAnchorEl(event.currentTarget);
        setColumnFilterOpenOpen((previousOpen) => !previousOpen);
    };
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
        const res = await axios.post('http://localhost:5050/search', {
            motif: context.motifQuery,
            lim: number
        })
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

    const getSortedColumns = () => {
        let sortedColumns = Object.entries(visibleColumns).sort((a, b) => {
            if (a[0] === 'nodeKey') return -1;
            if (b[0] === 'nodeKey') return 1;
            if (a[0] === 'bodyId') return -1;
            if (b[0] === 'bodyId') return 1;
            if (a[0] === 'instance') return -1;
            if (b[0] === 'instance') return 1;
            if (a[0] === 'status') return -1;
            if (b[0] === 'status') return 1;
            return (a[1] === b[1]) ? 0 : a[1] ? -1 : 1;
        })
        return sortedColumns;
    }

    // Creat list of visible columns
    useEffect(() => {
        let columns = {}
        Object.keys(NodeFields).map(k => {
            columns[k] = false;
        });
        columns['nodeKey'] = true;
        columns['bodyId'] = true;
        columns['instance'] = true;
        columns['status'] = true;
        setVisibleColumns(columns);
    }, [])

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
                        <Table aria-label="collapsible table" style={{tableLayout: 'fixed'}}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={20}/>
                                    <TableCell>Name</TableCell>
                                    <TableCell>
                                        <Tooltip title="Filter Columns" placement="top">
                                            <IconButton onClick={handleColumnFilterClick}>
                                                <ViewColumnIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Popper open={columnFilterOpen} anchorEl={columnFilterAnchorEl}>
                                            <Box sx={{border: 1, p: 1, bgcolor: 'background.paper'}}
                                            >
                                                <FormControl component="fieldset" variant="standard"
                                                             style={{
                                                                 maxHeight: 250,
                                                                 overflowY: 'scroll'
                                                             }}>
                                                    <FormLabel component="legend">Visible Columns</FormLabel>
                                                    <FormGroup style={{paddingLeft: 8}}>
                                                        {getSortedColumns().map(col => {
                                                            return <FormControlLabel
                                                                control={
                                                                    <Switch checked={col[1]}
                                                                            style={{transitionDuration: 0}}
                                                                            size="small"
                                                                            onChange={handleVisibleColumnChange}
                                                                            name={col[0]}/>
                                                                }
                                                                label={
                                                                    <Typography sx={{fontSize: 12}}>
                                                                        {col[0]}
                                                                    </Typography>
                                                                }
                                                                key={col[0]}
                                                            />
                                                        })
                                                        }
                                                    </FormGroup>
                                                </FormControl>
                                            </Box>
                                        </Popper>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    resultRows.map((row) => (
                                        <CollapsableTableRow key={row.name} row={row}
                                                             columns={getSortedColumns()}
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