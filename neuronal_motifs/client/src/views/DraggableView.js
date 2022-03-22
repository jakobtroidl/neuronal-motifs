import React, {useState, useEffect} from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";
import MotifPanel from "../components/MotifPanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";

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
            <Draggable>
                <div className='drag-overlay'>
                    <MotifPanel/>
                </div>
            </Draggable>
        </div>


    );

}

export default DraggableView;