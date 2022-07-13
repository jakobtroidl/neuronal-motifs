import React, { useContext, useEffect } from "react";
import { AppContext } from "../contexts/GlobalContext";
import "./Viewer.css";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import Slider from "@mui/material/Slider";
import "./AbstractionSlider.css";

function AbstractionSlider() {
  const abstractionSliderId = "abstraction-slider-div";

  function valueLabelFormat(value) {
    return `Level ${value}`;
  }

  // Global context holds abstraction state
  const context = useContext(AppContext);
  // Updates the state when it changes
  const handleChange = (event, val) => {
    if (val !== context.abstractionLevel) {
      context.setAbstractionLevel(val);
    }
  };

  useEffect(() => {
    console.log("Reset Slider");
  }, [context.resetUICounter]);

  return (
    <div id={abstractionSliderId}>
      {/*Drag Handler*/}
      <div className="handle">
        <DragHandleIcon />
      </div>
      <div id="abstraction-slider-wrapper">
        <div className="item title-wrapper">
          <span>Abstraction Level</span>
        </div>
        <div id="abstractionSlider" className="item">
          <Slider
            key={context.resetUICounter}
            aria-label="Abstraction"
            defaultValue={0}
            valueLabelFormat={valueLabelFormat}
            valueLabelDisplay="auto"
            step={0.005}
            marks
            min={0}
            max={1}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}

export default AbstractionSlider;
