import React from "react";
import "./DraggableView.css";
import SliderView from "./SliderView";
import PanelView from "./PanelView";
import GraphSummaryView from "./GraphSummaryView";
import RoiInfoView from "./RoiInfoView";

function DraggableView() {
  const viewId = "draggable-view";
  const nodeRef = React.useRef(null);
  return (
    <div id={viewId}>
      <SliderView></SliderView>
      <PanelView></PanelView>
      <GraphSummaryView></GraphSummaryView>
      <RoiInfoView></RoiInfoView>
    </div>
  );
}

export default DraggableView;
