import React, {Component} from 'react';
import {Query, Builder, BasicConfig, Utils as QbUtils} from 'react-awesome-query-builder';
import './QueryBuilder.css'

import 'antd/dist/antd.css'; // or import "react-awesome-query-builder/css/antd.less";
// For MUI 4/5 widgets only:

import MuiConfig from 'react-awesome-query-builder/lib/config/mui';


import 'react-awesome-query-builder/lib/css/styles.css';
import 'react-awesome-query-builder/lib/css/compact_styles.css';
import AbstractionSlider from "./AbstractionSlider"; //optional, for more compact styles

// Choose your skin (ant/material/vanilla):
const InitialConfig = MuiConfig; // or MaterialConfig or MuiConfig or BootstrapConfig or BasicConfig

// You need to provide your own config. See below 'Config format'
const config = {
    ...InitialConfig,
    fields: {
        qty: {
            label: 'Qty',
            type: 'number',
            fieldSettings: {
                min: 0,
            },
            valueSources: ['value'],
            preferWidgets: ['number'],
        },
        price: {
            label: 'Price',
            type: 'number',
            valueSources: ['value'],
            fieldSettings: {
                min: 10,
                max: 100,
            },
            preferWidgets: ['slider', 'rangeslider'],
        },
        color: {
            label: 'Color',
            type: 'select',
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    {value: 'yellow', title: 'Yellow'},
                    {value: 'green', title: 'Green'},
                    {value: 'orange', title: 'Orange'}
                ],
            }
        },
        is_promotion: {
            label: 'Promo?',
            type: 'boolean',
            operators: ['equal'],
            valueSources: ['value'],
        },
    }
};

delete config['conjunctions']['OR']
config['settings']['showNot'] = false;
config['settings']['groupOperators'] = false
config['settings']['canAddGroup'] = false;

// You can load query value from your backend storage (for saving see `Query.onChange()`)
const queryValue = {"id": QbUtils.uuid(), "type": "group"};


class QueryBuilder extends Component {

    state = {
        tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
        config: config
    };

    render = () => (
        <div>
            <Query
                {...config}
                value={this.state.tree}
                onChange={this.onChange}
                renderBuilder={this.renderBuilder}
            />
        </div>
    )

    renderBuilder = (props) => (
        <div className="query-builder-container" style={{padding: 0, minWidth: 300}}>
            <div className="query-builder qb-lite" style={{margin: 0}}>
                <Builder {...props} />
            </div>
        </div>
    )


    onChange = (immutableTree, config) => {
        // Tip: for better performance you can apply `throttle` - see `examples/demo`
        this.setState({tree: immutableTree, config: config});

        const jsonTree = QbUtils.getTree(immutableTree);
        console.log(jsonTree);
        // `jsonTree` can be saved to backend, and later loaded to `queryValue`
    }
}

export default QueryBuilder;