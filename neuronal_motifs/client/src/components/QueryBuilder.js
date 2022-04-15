import React, {useState, useEffect, useContext} from 'react';
import {AppContext} from "../contexts/GlobalContext";
import {NodeFields} from "../config/NodeFields";
import {EdgeFields} from "../config/EdgeFields";
import {Query, Builder, BasicConfig, Utils as QbUtils} from 'react-awesome-query-builder';
import './QueryBuilder.css'

import 'antd/dist/antd.css'; // or import "react-awesome-query-builder/css/antd.less";
// For MUI 4/5 widgets only:

import MuiConfig from 'react-awesome-query-builder/lib/config/mui';


import 'react-awesome-query-builder/lib/css/styles.css';
import 'react-awesome-query-builder/lib/css/compact_styles.css';
import DragHandleIcon from "@mui/icons-material/DragHandle";
import Slider from "@mui/material/Slider"; //optional, for more compact styles

let InitialConfig = MuiConfig; // or MaterialConfig or MuiConfig or BootstrapConfig or BasicConfig
delete InitialConfig['conjunctions']['OR']
InitialConfig['settings']['showNot'] = false;
InitialConfig['settings']['groupOperators'] = false
InitialConfig['settings']['canAddGroup'] = false;

// You can load query value from your backend storage (for saving see `Query.onChange()`)


function QueryBuilder() {
    let [tree, setTree] = useState()
    const context = useContext(AppContext);

    useEffect(() => {
            const queryValue = {"id": QbUtils.uuid(), "type": "group"};
            setTree(QbUtils.checkTree(QbUtils.loadTree(queryValue), {...InitialConfig, fields: NodeFields}));
        },
        []
    )

    useEffect(() => {
        const queryValue = {"id": QbUtils.uuid(), "type": "group"};
        if (context.selectedSketchElement && context.selectedSketchElement.type === 'edge') {
            setTree(QbUtils.checkTree(QbUtils.loadTree(queryValue), {...InitialConfig, fields: EdgeFields}));
        } else {
            setTree(QbUtils.checkTree(QbUtils.loadTree(queryValue), {...InitialConfig, fields: NodeFields}));

        }
    }, [context.selectedSketchElement])

    const renderBuilder = (props) => (
        <div className="query-builder-container" style={{padding: 0, minWidth: 300}}>
            <div className="query-builder qb-lite" style={{margin: 0}}>
                <Builder {...props} />
            </div>
        </div>
    )
    const onChange = (immutableTree, config) => {
        // Tip: for better performance you can apply `throttle` - see `examples/demo`
        // this.setState({, config: config});
        let query = QbUtils.mongodbFormat(immutableTree, config);
        setTree(immutableTree);
        let updatedElem = {
            ...context.selectedSketchElement,
            tree: immutableTree,
            query: query
        };
        context.setSelectedSketchElement(updatedElem);
    }
    return (
        <div>
            {tree && context?.selectedSketchElement?.type === 'node' &&
            <Query
                // config={() ? {...config, fields: EdgeFields} : {
                //     ...config,
                //     fields: NodeFields
                // }}
                {...InitialConfig}
                fields={NodeFields}
                value={context.selectedSketchElement.tree || tree}
                onChange={onChange}
                renderBuilder={renderBuilder}
            />
            }

            {tree && context?.selectedSketchElement?.type === 'edge' &&
            <Query
                {...InitialConfig}
                fields={EdgeFields}
                value={context.selectedSketchElement.tree || tree}
                onChange={onChange}
                renderBuilder={renderBuilder}
            />
            }
        </div>
    );
}


export default QueryBuilder;