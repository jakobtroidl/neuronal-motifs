import React, { useState, useEffect, useRef, useContext } from "react";
import {
  IconButton,
  MenuItem,
  Divider,
  ClickAwayListener,
  Paper,
  Popper,
  Grow,
  MenuList,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AppContext } from "../contexts/GlobalContext";

export default function ResultTableRowContextMenu({ neuron, neurons }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const context = useContext(AppContext);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const handleShowDetails = () => {
    const url = `https://neuprint.janelia.org/results?dataset=hemibrain%3Av1.2.1&qt=findneurons&q=1&qr%5B0%5D%5Bcode%5D=fn&qr%5B0%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B0%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B0%5D%5Bpm%5D%5Ball_segments%5D=false&qr%5B0%5D%5Bpm%5D%5Bneuron_id%5D=${neuron.bodyId}&qr%5B0%5D%5BvisProps%5D%5BrowsPerPage%5D=25&qr%5B1%5D%5Bcode%5D=ng&qr%5B1%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B1%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B1%5D%5Bpm%5D%5Bskip%5D=true&qr%5B1%5D%5Bpm%5D%5BbodyIds%5D=${neuron.bodyId}&qr%5B1%5D%5Bpm%5D%5Bcoordinates%5D=26818.622333792922%2C34542.64478128056%2C-7872.670033223876%2C27034.185365661764%2C29434.147044504767%2C14769.874476957313&qr%5B2%5D%5Bcode%5D=sk&qr%5B2%5D%5Bds%5D=hemibrain%3Av1.2.1&qr%5B2%5D%5Bpm%5D%5Bdataset%5D=hemibrain%3Av1.2.1&qr%5B2%5D%5Bpm%5D%5Bskip%5D=true&qr%5B2%5D%5Bpm%5D%5BbodyIds%5D=${neuron.bodyId}&tab=0&ftab=2`;
    window.open(url, "_blank");
  };

  const handleNodeConstraint = (neuron, node) => {
    context.setErrorMessage(null);
    context.setConstraintsToAddToSketch({
      nodeKey: node.nodeKey,
      bodyId: neuron.bodyId,
    });
    setOpen(false);
    context.setErrorMessage(
      `The bodyId ${neuron.bodyId} from node ${neuron.nodeKey} is assigned to node ${node.nodeKey}.`
    );
    context.setLoadingMessage(null);
  };

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle}>
        <MoreVertIcon />
      </IconButton>
      <Popper open={open} anchorEl={anchorRef.current} transition>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                  dense
                >
                  <MenuItem onClick={handleShowDetails}>Show details</MenuItem>
                  <Divider />
                  {neurons.map((node) => {
                    return (
                      <MenuItem
                        key={neuron.bodyId + node.nodeKey}
                        onClick={() => handleNodeConstraint(neuron, node)}
                      >
                        Set this neuron as a constraint for node {node.nodeKey}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
