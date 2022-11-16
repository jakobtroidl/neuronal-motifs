import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import { CollapsableTableRow } from "./CollapsableTableRow";
import React, { useContext, useState } from "react";
import { NodeFields } from "../config/NodeFields";
import { AppContext } from "../contexts/GlobalContext";

export default function SelectionTable(props) {
  const [selection, setSelection] = useState(props.selection);
  const context = useContext(AppContext);

  function getVisibleColumns() {
    let columns = {};
    Object.keys(NodeFields).map((k) => {
      columns[k] = false;
    });
    columns["nodeKey"] = true;
    columns["bodyId"] = true;
    columns["type"] = true;

    // columns["instance"] = true;
    columns["status"] = true;
    return columns;
  }

  const getSortedColumns = (columns) => {
    let sortedColumns = Object.entries(columns).sort((a, b) => {
      if (a[0] === "nodeKey") return -1;
      if (b[0] === "nodeKey") return 1;
      if (a[0] === "bodyId") return -1;
      if (b[0] === "bodyId") return 1;
      if (a[0] === "type") return -1;
      if (b[0] === "type") return 1;
      // if (a[0] === "instance") return -1;
      // if (b[0] === "instance") return 1;
      if (a[0] === "status") return -1;
      if (b[0] === "status") return 1;
      return a[1] === b[1] ? 0 : a[1] ? -1 : 1;
    });
    return sortedColumns;
  };

  let columns = getSortedColumns(getVisibleColumns());

  // function handleClick(row) {
  //   console.log("Clicked on selected motif");
  //   let selectedMotifs_copy = [...context.selectedMotifs];
  //   const idx = selectedMotifs_copy.indexOf(row);
  //   if (idx > -1) {
  //     let motif = selectedMotifs_copy.at(idx);
  //     context.setFocusedMotif(motif);
  //   }
  // }

  function handleDelete(row) {
    let selectedMotifs_copy = [...context.selectedMotifs];
    const idx = selectedMotifs_copy.indexOf(row);
    if (idx > -1) {
      context.setMotifToDelete(selectedMotifs_copy.at(idx));
      setSelection(selection.filter((r) => r !== row));
      selectedMotifs_copy.splice(idx, 1);
      context.setSelectedMotifs(selectedMotifs_copy);
      context.setGlobalMotifIndex(context.globalMotifIndex - 1);
      if (selectedMotifs_copy.length > 0) {
        let focusedMotif = selectedMotifs_copy.at(-1);
        context.setFocusedMotif({
          ...focusedMotif,
          index: selectedMotifs_copy.length - 1,
        });
      }
    } else {
      console.log("Motif Selection Delete. Row index not found.");
    }
  }

  return (
    <div className="results">
      <TableContainer>
        <Table aria-label="collapsible table" style={{ tableLayout: "fixed" }}>
          <TableBody>
            {selection.map((row) => (
              <CollapsableTableRow
                key={row.name + row.index}
                row={row}
                columns={columns}
                //handleClick={handleClick}
                handleDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
