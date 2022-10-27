import DragHandleIcon from "@mui/icons-material/DragHandle";
import React, {useContext} from "react";
import {AppContext} from "../contexts/GlobalContext";

import "./RoiInfo.css";


function RoiInfo() {
    const [elements, setElements] = React.useState(true);
    const id = "roi-info-div";
    let context = useContext(AppContext);
    let roiInfo = context.roiInfo;


    return (
        <>
            {roiInfo && (
                <div id={id}>
                    <div className="handle">
                        <DragHandleIcon/>
                    </div>
                    <div id="roi-info-wrapper">
                        <div className="item title-wrapper">
                            <span>ROI Info</span>
                        </div>
                        <div id="graph">
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RoiInfo;
