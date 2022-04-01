import React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Box, Collapse, IconButton} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import PropTypes from "prop-types";

function TableRow(props) {
    const {row, handleClick} = props;
    const [open, setOpen] = React.useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{'& > *': {borderBottom: 'unset'}}}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(e) => {
                            setOpen(!open)
                        }}
                    >
                        {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {row.name}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6} onClick={(event) => {
                    handleClick(row)
                }} className={"motif-selection-div"}>
                    <Collapse in={open}>
                        <Box sx={{margin: 1}}>
                            {/*<Typography variant="h6" gutterBottom component="div">*/}
                            {/*    History*/}
                            {/*</Typography>*/}
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Node</TableCell>
                                        <TableCell>Body ID</TableCell>
                                        <TableCell>Instance</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.neurons.map((neuron) => (
                                        <TableRow key={neuron.nodeKey}>
                                            <TableCell component="th" scope="row">
                                                {neuron?.nodeKey}
                                            </TableCell>
                                            <TableCell>{neuron?.bodyId}</TableCell>
                                            <TableCell align="right">{neuron?.instance}</TableCell>
                                            <TableCell align="right">{neuron?.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

TableRow.propTypes = {
    row: PropTypes.shape({
        name: PropTypes.string.isRequired,
        neurons: PropTypes.arrayOf(
            PropTypes.shape({
                nodeKey: PropTypes.string.isRequired,
                bodyId: PropTypes.number.isRequired,
                instance: PropTypes.string,
                type: PropTypes.string,
                status: PropTypes.string.isRequired
            }),
        ).isRequired,
    }).isRequired,
    handleClick: PropTypes.func
};