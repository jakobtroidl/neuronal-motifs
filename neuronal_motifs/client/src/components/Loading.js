import React, {useState, useEffect, useContext} from 'react';
import './Loading.css'
import {AppContext} from "../contexts/GlobalContext";
import {Card, CircularProgress, Grid} from "@mui/material";
import * as PropTypes from "prop-types";

function Item(props) {
    return null;
}

Item.propTypes = {children: PropTypes.node};

function Loading() {
    const context = useContext(AppContext);
    const loadingId = 'loadingBar'
    return (
        <div id={loadingId}>
            {context.loadingMessage &&
            <Card variant="outlined">
                <Grid container
                      align="left"
                      justify="left"
                >
                    <Grid item xs={11}>
                        <span style={{
                            marginRight: 0, marginTop: 0, marginBottom: 0, marginLeft: '10px'
                        }}>{context.loadingMessage}</span>
                    </Grid>
                    <Grid item xs={1}>
                        <CircularProgress size={20}/>
                    </Grid>
                </Grid>
            </Card>
            }
        </div>


    );
}

export default Loading;