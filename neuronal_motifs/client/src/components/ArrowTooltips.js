import * as React from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

function ArrowTooltips(props) {
    console.log(props.props)
    let prop = props.props
    var distances = null
    if (prop != null) {
        distances = Object.values(prop.distances)
    }

    return (
        <div style={{position: 'absolute', top: 10, right: 20, zIndex: 100}}>
            <p>Distance from Presynaptic Neuron {distances}</p>

        </div>
    );
}

export default ArrowTooltips;