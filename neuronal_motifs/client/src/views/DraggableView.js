import React, {useState, useEffect} from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";
import MotifPanel from "../components/MotifPanel";
import SliderView from "./SliderView";
import PanelView from "./PanelView";

function DraggableView() {
    const viewId = 'draggable-view';
    const nodeRef = React.useRef(null);
    return (
        <div id={viewId}>
            <SliderView></SliderView>
            <PanelView></PanelView>
        </div>
    );
}

export default DraggableView;