import * as React from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

function ArrowTooltips(props) {
    let distances = props.props
    return (
        <div style={{position: 'absolute', top: 10, right: 20, zIndex: 100}}>
            {distances.pre_soma_dist > 0 &&
                <p>Distance to pre-synaptic soma {distances.pre_soma_dist} nm</p>
            }
            {distances.post_soma_dist > 0 &&
                <p>Distance to post-synaptic soma {distances.post_soma_dist} nm</p>
            }

        </div>
    );
}

export default ArrowTooltips;