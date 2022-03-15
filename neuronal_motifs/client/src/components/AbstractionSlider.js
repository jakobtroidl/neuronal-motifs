import React, {useState, useEffect, useContext} from 'react';
import {AppContext} from "../contexts/AbstractionLevelContext";
import './Viewer.css'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faUpDownLeftRight} from '@fortawesome/free-solid-svg-icons'
import Slider from '@mui/material/Slider';
import './AbstractionSlider.css'


function AbstractionSlider() {


    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {

    });

    function valueLabelFormat(value) {
        return `Level ${value}`
    }

    const context = useContext(AppContext);
    const handleChange = (event, val) => {
        if (val !== context.store.abstractionLevel) {
            context.actions.changeAbstractionLevel(val);
        }
    }

    return (

        <div id='drag-div'>
            <div className="handle">
                <FontAwesomeIcon icon={faUpDownLeftRight}/>
            </div>
            <div id='drag-wrapper'>
                <div className='item title-wrapper'>
                    <span>Abstraction Level</span>
                </div>
                <div id="abstractionSlider" className='item'>
                    <Slider
                        aria-label="Abstraction"
                        defaultValue={0}
                        valueLabelFormat={valueLabelFormat}
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={0}
                        max={10}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );

}

export default AbstractionSlider;