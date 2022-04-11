import React, {useState, useEffect, useContext} from 'react';
import './Loading.css'
import {AppContext} from "../contexts/GlobalContext";
import {Card, LinearProgress, Grid} from "@mui/material";
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
                <Grid
                    container
                    direction="column"
                    justifyContent="flex-start"
                    alignItems="stretch"
                >
                    <Grid item>
                        <LinearProgress/>
                    </Grid>
                    <Grid item>
                        <span>{context.loadingMessage}</span>
                    </Grid>
                </Grid>
            </Card>
            }
        </div>


    );
}

export default Loading;