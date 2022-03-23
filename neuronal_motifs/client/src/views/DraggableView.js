import React, {useState, useEffect} from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";
import MotifPanel from "../components/MotifPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";
import SketchPanel from "../components/SketchPanel";

function DraggableView() {
    const viewId = 'draggable-view'

    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {

    });

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
            <Draggable handle=".handle">
                <div className='drag-overlay'>
                    <SketchPanel/>
                </div>
            </Draggable>
        </div>


    );

}

export default DraggableView;