import React, { useState } from "react";
import { IconButton, Menu, MenuItem, Divider } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function ResultTableRowContextMenu({ neuron, index }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShowDetails = () => {
    const url = `https://neuprint.janelia.org/results?dataset=hemibrain%3Av1.2.1&qt=findneurons&q=1&qr%5B0%5D%5Bcode%5D=fn&qr%5B0%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B0%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B0%5D%5Bpm%5D%5Ball_segments%5D=false&qr%5B0%5D%5Bpm%5D%5Bneuron_id%5D=${neuron.bodyId}&qr%5B0%5D%5BvisProps%5D%5BrowsPerPage%5D=25&qr%5B1%5D%5Bcode%5D=ng&qr%5B1%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B1%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B1%5D%5Bpm%5D%5Bskip%5D=true&qr%5B1%5D%5Bpm%5D%5BbodyIds%5D=${neuron.bodyId}&qr%5B1%5D%5Bpm%5D%5Bcoordinates%5D=26818.622333792922%2C34542.64478128056%2C-7872.670033223876%2C27034.185365661764%2C29434.147044504767%2C14769.874476957313&qr%5B2%5D%5Bcode%5D=sk&qr%5B2%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B2%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B2%5D%5Bpm%5D%5Bskip%5D=true&qr%5B2%5D%5Bpm%5D%5BbodyIds%5D=${neuron.bodyId}&tab=0&ftab=2`;
    window.open(url, "_blank");
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: "15ch",
          },
        }}
      >
        <MenuItem onClick={handleShowDetails}>Show details</MenuItem>
        <Divider />
        {/*<MenuItem onClick={handleShowDetails}>Search </MenuItem>*/}
      </Menu>
    </>
  );
}
