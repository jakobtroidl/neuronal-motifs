import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar, ListItemIcon, ListItemText, Stack } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

function createRow(neuron, nodes, index) {
  const row = [];
  nodes.forEach((node, j) => {
    let color = j === index ? neuron.color : "#9d9d9d";
    let element = (
      <Avatar key={node} style={{ backgroundColor: color }}>
        {node}
      </Avatar>
    );
    row.push(element);
  });
  return row;
}
function determineMenuOptions(motif, neuron) {
  console.log(motif.nodes);

  let nodes = [];
  motif.nodes.forEach((node) => {
    nodes.push(node.label);
    nodes.push(node.label);
  });

  // remove duplicates from nodes
  nodes = [...new Set(nodes)];
  nodes.sort();

  const menuOptions = [];

  nodes.forEach((row, index) => {
    {
      menuOptions.push(
        <MenuItem
          key={row}
          onClick={(event) => handleClick(event, neuron, motif, row)}
        >
          <ListItemIcon>
            <Stack direction="row" spacing={2}>
              {createRow(neuron, nodes, index)}
            </Stack>
          </ListItemIcon>
        </MenuItem>
      );
    }
  });

  return menuOptions;
}

const handleClick = (event, neuron, motif, row) => {
  console.log("handleClick");
};

export default function BasicMenu(props) {
  let open = props.open;
  let position = props.position;
  let neuron = props.neuron;
  let motif = props.motif;

  return (
    <Menu
      id="basic-menu"
      anchorReference="anchorPosition"
      anchorPosition={{ left: position.x, top: position.y }}
      open={open}
      MenuListProps={{
        "aria-labelledby": "basic-button",
      }}
    >
      <MenuItem>
        {/*<ListItemIcon>*/}
        {/*  <FiberManualRecordIcon*/}
        {/*    style={{ color: neuron.color }}*/}
        {/*    fontSize="small"*/}
        {/*  />*/}
        {/*</ListItemIcon>*/}
        <ListItemText>Search close motifs</ListItemText>
      </MenuItem>
      {determineMenuOptions(motif, neuron).map((option) => {
        return option;
      })}
    </Menu>
  );
}
