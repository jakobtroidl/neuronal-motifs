import React, {useState, useEffect} from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";
import MotifPanel from "../components/MotifPanel";

function DraggableView() {
    const viewId = 'draggable-view'
    return (
        <div id={viewId}>
            <Draggable handle=".handle">
                <div className='drag-overlay'>
                    <AbstractionSlider/>
                </div>
            </Draggable>
            <Draggable handle=".handle">
                <div className='drag-overlay'>
                    <MotifPanel/>
                </div>
            </Draggable>
        </div>
    );
}

export default DraggableView;