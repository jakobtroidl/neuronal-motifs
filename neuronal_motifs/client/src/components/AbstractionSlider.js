import React, {useState, useEffect, useContext} from 'react';
import {AppContext} from "../contexts/GlobalContext";
import './Viewer.css'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faUpDownLeftRight} from '@fortawesome/free-solid-svg-icons'
import Slider from '@mui/material/Slider';
import './AbstractionSlider.css'


function AbstractionSlider() {
    const abstractionSliderId = 'abstraction-slider-div'

    function valueLabelFormat(value) {
        return `Level ${value}`
    }
    // Global context holds abstraction state
    const context = useContext(AppContext);
    // Updates the state when it changes
    const handleChange = (event, val) => {
        if (val !== context.abstractionLevel) {
            context.setAbstractionLevel(val);
        }
    }

    return (
        <div id={abstractionSliderId}>
            {/*Drag Handler*/}
            <div className="handle">
                <FontAwesomeIcon icon={faUpDownLeftRight}/>
            </div>
            <div id='abstraction-slider-wrapper'>
                <div className='item title-wrapper'>
                    <span>Abstraction Level</span>
                </div>
                <div id="abstractionSlider" className='item'>
                    <Slider
                        aria-label="Abstraction"
                        defaultValue={0}
                        valueLabelFormat={valueLabelFormat}
                        valueLabelDisplay="auto"
                        step={0.1}
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