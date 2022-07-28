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

export function CollapsableTableRow(props) {
  const { row, handleClick, columns } = props;
  const [open, setOpen] = React.useState(false);
  const context = useContext(AppContext);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell style={{ borderBottom: "unset", borderTop: "unset" }}>
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
          style={{ borderBottom: "unset", borderTop: "unset" }}
        >
          {row.name}
        </TableCell>
      </TableRow>
      <TableRow className={"motif-selection-div"}>
        <TableCell
          style={{
            paddingBottom: 0,
            paddingTop: 0,
          }}
          colSpan={6}
          onClick={() => {
            handleClick(row);
          }}
        >
          <Collapse in={open}>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="motifs">
                <TableHead>
                  <TableRow>
                    {columns
                      .filter((e) => e[1])
                      .map((col) => {
                        return <TableCell key={col[0]}>{col[0]}</TableCell>;
                      })}
                  </TableRow>
                </TableHead>
                <TableBody style={{ overFlowX: "scroll" }}>
                  {row.neurons.map((neuron, index) => (
                    <TableRow
                      key={neuron.nodeKey}
                      style={{
                        background: hexToRgbA(context.neuronColors[index], 0.4),
                        borderRadius: "20px",
                      }}
                    >
                      {columns
                        .filter((e) => e[1])
                        .map((col) => {
                          return (
                            <TableCell key={col[0]}>{neuron[col[0]]}</TableCell>
                          );
                        })}
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

CollapsableTableRow.propTypes = {
  row: PropTypes.shape({
    name: PropTypes.string.isRequired,
    neurons: PropTypes.arrayOf(
      PropTypes.shape({
        nodeKey: PropTypes.string.isRequired,
        bodyId: PropTypes.number.isRequired,
        instance: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  handleClick: PropTypes.func,
};
