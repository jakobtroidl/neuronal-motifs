import React, {useState, useEffect} from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight} from "@fortawesome/free-solid-svg-icons";

function DraggableView() {

    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {

    });

    return (
        <Draggable handle=".handle">
            <div id='drag-overlay'>
                <AbstractionSlider/>
            </div>
        </Draggable>
    );

}

export default DraggableView;