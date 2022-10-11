import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import "./ResultsTable.css";
import TableBody from "@mui/material/TableBody";
import { CollapsableTableRow } from "./CollapsableTableRow";
import React, { useContext, useEffect } from "react";
import { NodeFields } from "../config/NodeFields";

export default function ResultsTable(props) {
  const [visibleColumns, setVisibleColumns] = React.useState({});
  let results = props.results;

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
          <TableBody>
            {results.map((row) => (
              <CollapsableTableRow
                key={row.name}
                row={row}
                columns={getSortedColumns()}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
