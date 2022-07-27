import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import "./ResultsTable.css";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  Popper,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableBody from "@mui/material/TableBody";
import { CollapsableTableRow } from "./CollapsableTableRow";
import React, { useContext, useEffect } from "react";
import { AppContext } from "../contexts/GlobalContext";
import { NodeFields } from "../config/NodeFields";

export default function ResultsTable(props) {
  const [columnFilterAnchorEl, setColumnFilterAnchorEl] = React.useState(null);
  const [columnFilterOpen, setColumnFilterOpenOpen] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState({});

  const context = useContext(AppContext);
  let results = props.results;

  const handleColumnFilterClick = (event) => {
    setColumnFilterAnchorEl(event.currentTarget);
    setColumnFilterOpenOpen((previousOpen) => !previousOpen);
  };

  const handleVisibleColumnChange = (event) => {
    setVisibleColumns({
      ...visibleColumns,
      [event.target.name]: event.target.checked,
    });
  };

  const handleMotifSelection = (motif) => {
    context.setSelectedMotif(motif.neurons);
  };

  const getSortedColumns = () => {
    let sortedColumns = Object.entries(visibleColumns).sort((a, b) => {
      if (a[0] === "nodeKey") return -1;
      if (b[0] === "nodeKey") return 1;
      if (a[0] === "bodyId") return -1;
      if (b[0] === "bodyId") return 1;
      if (a[0] === "instance") return -1;
      if (b[0] === "instance") return 1;
      if (a[0] === "status") return -1;
      if (b[0] === "status") return 1;
      return a[1] === b[1] ? 0 : a[1] ? -1 : 1;
    });
    return sortedColumns;
  };

  // Creat list of visible columns
  useEffect(() => {
    let columns = {};
    Object.keys(NodeFields).map((k) => {
      columns[k] = false;
    });
    columns["nodeKey"] = true;
    columns["bodyId"] = true;
    columns["instance"] = true;
    columns["status"] = true;
    setVisibleColumns(columns);
  }, []);

  return (
    <div className="results">
      <TableContainer>
        <Table aria-label="collapsible table" style={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow style={{ borderBottom: "1px solid lightgrey" }}>
              <TableCell width={20} style={{ borderBottom: "unset" }} />
              <TableCell style={{ borderBottom: "unset" }}>Name</TableCell>
              <TableCell style={{ borderBottom: "unset" }}>
                <Tooltip title="Filter Columns" placement="top">
                  <IconButton onClick={handleColumnFilterClick}>
                    <ViewColumnIcon />
                  </IconButton>
                </Tooltip>
                <Popper open={columnFilterOpen} anchorEl={columnFilterAnchorEl}>
                  <Box>
                    <FormControl
                      component="fieldset"
                      variant="standard"
                      style={{
                        maxHeight: 250,
                        overflowY: "scroll",
                      }}
                    >
                      <FormLabel component="legend">Visible Columns</FormLabel>
                      <FormGroup style={{ paddingLeft: 8 }}>
                        {getSortedColumns().map((col) => {
                          return (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={col[1]}
                                  style={{ transitionDuration: 0 }}
                                  size="small"
                                  onChange={handleVisibleColumnChange}
                                  name={col[0]}
                                />
                              }
                              label={
                                <Typography sx={{ fontSize: 12 }}>
                                  {col[0]}
                                </Typography>
                              }
                              key={col[0]}
                            />
                          );
                        })}
                      </FormGroup>
                    </FormControl>
                  </Box>
                </Popper>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row) => (
              <CollapsableTableRow
                key={row.name}
                row={row}
                columns={getSortedColumns()}
                handleClick={handleMotifSelection}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
