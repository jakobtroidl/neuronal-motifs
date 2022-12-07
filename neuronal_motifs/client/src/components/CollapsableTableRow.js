import React, { useContext } from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { Box, Collapse, hexToRgb, IconButton } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import PropTypes from "prop-types";
import { AppContext } from "../contexts/GlobalContext";
import { hexToRgbA } from "../utils/rendering";
import CloseIcon from "@mui/icons-material/Close";
import _ from "lodash";
import ResultTableRowContextMenu from "./ResultTableRowContextMenu";

export function CollapsableTableRow(props) {
  const { row, columns, handleDelete } = props;
  const [open, setOpen] = React.useState(false);
  const context = useContext(AppContext);
  let deletable = false;
  let small = "20%";
  let big = "60%";

  if (handleDelete) {
    deletable = true;
  }

  let style_default = {
    borderBottom: "unset",
    borderTop: "unset",
  };
  let style_border_top_selected = {
    borderTop: "2px solid #c7d0fd",
    borderLeft: "2px solid #c7d0fd",
    borderRight: "2px solid #c7d0fd",
  };

  let style_top_focused = {
    ...style_border_top_selected,
    backgroundColor: "#ffedb3",
  };

  let style_border_bottom_selected = {
    borderBottom: "2px solid #c7d0fd",
    borderLeft: "2px solid #c7d0fd",
    borderRight: "2px solid #c7d0fd",
  };

  const handleClick = (row) => {
    context.setErrorMessage(null);
    console.log("Clicked on motif");
    let selectedMotifs_copy = [...context.selectedMotifs];
    const idx = selectedMotifs_copy.indexOf(row);
    if (idx > -1) {
      // motif is already selected
      let motif = selectedMotifs_copy.at(idx);
      context.setFocusedMotif({
        ...motif,
        index: idx,
      });
    } else {
      // motif is not selected yet

      // Check if new motif is already in context.selectedMotifs
      // Index is increased when the motif appends to the array. Enforce the same index value to check the motif exists or not.
      let copyOfMotif = {
        ...row,
        index: "omit",
      };
      let copyOfSelectedMotifs = context.selectedMotifs.map((obj) => {
        return { ...obj, index: "omit" };
      });
      if (!_.some(copyOfSelectedMotifs, copyOfMotif)) {
        let selectedMotif = { ...row, index: context.globalMotifIndex };
        context.setGlobalMotifIndex(context.globalMotifIndex + 1);
        context.setMotifToAdd(selectedMotif);
      } else {
        context.setErrorMessage("This motif instance is already selected.");
      }
    }
  };

  const getTopStyle = () => {
    let style = style_default;
    if (isFocused(row)) {
      style = style_top_focused;
    } else if (isSelected(row)) {
      style = style_border_top_selected;
    }
    return style;
  };
  // checks if this row is selected
  const isSelected = () => {
    return context.selectedMotifs.some((e) => e.name === row.name);
  };

  const isFocused = () => {
    if (context.focusedMotif) {
      return context.focusedMotif.name === row.name;
    }
    return false;
  };

  return (
    <React.Fragment>
      <TableRow style={getTopStyle()}>
        <TableCell style={{ ...style_default, width: "20%" }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => {
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell
          component="th"
          scope="row"
          style={{ ...style_default, width: "40%", cursor: "pointer" }}
          onClick={() => {
            handleClick(row);
          }}
        >
          {row.name}
        </TableCell>
        <TableCell style={{ ...style_default, width: "40%" }} align={"right"}>
          {" "}
          {deletable ? (
            <IconButton
              aria-label="delete row"
              size="small"
              onClick={(e) => {
                handleDelete(row);
              }}
            >
              {<CloseIcon />}
            </IconButton>
          ) : null}
        </TableCell>
      </TableRow>
      <TableRow
        className={"motif-selection-div"}
        style={isSelected() ? style_border_bottom_selected : {}}
      >
        <TableCell
          style={{
            padding: 0,
          }}
          colSpan={6}
        >
          <Collapse in={open}>
            <Box overflow={"auto"}>
              <Table
                size="small"
                aria-label="motifs"
                onClick={() => {
                  handleClick(row);
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell key="menu"></TableCell>
                    {columns
                      .filter((e) => e[1])
                      .map((col) => {
                        return <TableCell key={col[0]}>{col[0]}</TableCell>;
                      })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.neurons.map((neuron, index) => (
                    <TableRow
                      key={neuron.nodeKey}
                      style={{
                        background: hexToRgbA(context.neuronColors[index], 0.4),
                      }}
                    >
                      <>
                        <TableCell style={{ padding: 0 }}>
                          <ResultTableRowContextMenu
                            neuron={neuron}
                            neurons={row.neurons}
                          />
                        </TableCell>
                        {columns
                          .filter((e) => e[1])
                          .map((col) => {
                            return (
                              <TableCell
                                key={col[0]}
                                // onClick={() => {
                                //   handleClick(row);
                                // }}
                              >
                                {neuron[col[0]]}
                              </TableCell>
                            );
                          })}
                      </>
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
