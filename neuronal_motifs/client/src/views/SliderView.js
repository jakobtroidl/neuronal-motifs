import React from 'react';
import Draggable from 'react-draggable';
import './DraggableView.css'
import AbstractionSlider from "../components/AbstractionSlider";

function SliderView() {
    const nodeRef = React.useRef(null);
    return (
        <Draggable handle=".handle" nodeRef={nodeRef}>
            <div className='drag-overlay' ref={nodeRef}>
                <AbstractionSlider/>
            </div>
        </Draggable>
    );
}

export default SliderView;