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
  let nodes = [];
  motif.forEach((edge) => {
    nodes.push(edge.fromNode.label);
    nodes.push(edge.toNode.label);
  });

  // remove duplicates from nodes
  nodes = [...new Set(nodes)];
  nodes.sort();

  const menuOptions = [];

  nodes.forEach((row, index) => {
    {
      menuOptions.push(
        <MenuItem key={row}>
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

export default function BasicMenu(props) {
  let open = props.open;
  let position = props.position;
  let neuron = props.neuron;
  let motif = props.motif;

  const handleClick = () => {
    console.log("handleClick");
    open = false;
  };

  return (
    <Menu
      id="basic-menu"
      anchorReference="anchorPosition"
      anchorPosition={{ left: position.x, top: position.y }}
      open={open}
      onClose={handleClick}
      MenuListProps={{
        "aria-labelledby": "basic-button",
      }}
    >
      <MenuItem onClick={handleClick}>
        <ListItemIcon>
          <FiberManualRecordIcon
            style={{ color: neuron.color }}
            fontSize="small"
          />
        </ListItemIcon>
        <ListItemText>Search close motifs</ListItemText>
        {/*<Typography variant="body2" color="text.secondary">*/}
        {/*  ⌘X*/}
        {/*</Typography>*/}
      </MenuItem>
      {determineMenuOptions(motif, neuron).map((option) => {
        return option;
      })}
    </Menu>
  );
}
