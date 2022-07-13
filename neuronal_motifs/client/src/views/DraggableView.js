import React from "react";
import "./DraggableView.css";
import SliderView from "./SliderView";
import PanelView from "./PanelView";

function DraggableView() {
  const viewId = "draggable-view";
  const nodeRef = React.useRef(null);
  return (
    <div id={viewId}>
      <SliderView></SliderView>
      <PanelView></PanelView>
    </div>
  );
}

export default DraggableView;
