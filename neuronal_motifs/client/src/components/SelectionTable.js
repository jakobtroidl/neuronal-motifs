import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import { CollapsableTableRow } from "./CollapsableTableRow";
import React from "react";
import { NodeFields } from "../config/NodeFields";

export default function SelectionTable(props) {
  let selection = props.selection;

  function getVisibleColumns() {
    let columns = {};
    Object.keys(NodeFields).map((k) => {
      columns[k] = false;
    });
    columns["nodeKey"] = true;
    columns["bodyId"] = true;
    columns["instance"] = true;
    columns["status"] = true;
    return columns;
  }

  const getSortedColumns = (columns) => {
    let sortedColumns = Object.entries(columns).sort((a, b) => {
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

  let columns = getSortedColumns(getVisibleColumns());

  function handleClick() {
    console.log("Clicked on selected motif");
  }

  return (
    <div className="results">
      <TableContainer>
        <Table aria-label="collapsible table" style={{ tableLayout: "fixed" }}>
          <TableBody>
            {selection.map((row) => (
              <CollapsableTableRow
                key={row.name}
                row={row}
                columns={columns}
                handleClick={handleClick}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
