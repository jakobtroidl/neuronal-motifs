import React, { useContext } from "react";
import "./Loading.css";
import { AppContext } from "../contexts/GlobalContext";
import { Grid, LinearProgress } from "@mui/material";

function Loading() {
  const context = useContext(AppContext);
  const loadingId = "loadingBar";
  return (
    <div id={loadingId}>
      {context.loadingMessage && (
        <Grid
          container
          direction="column"
          justifyContent="flex-start"
          alignItems="stretch"
        >
          <Grid item>
            <LinearProgress />
          </Grid>
          <Grid
            item
            style={{
              alignContent: "flex-end",
              textAlign: "right",
              paddingRight: "5px",
            }}
          >
            <span>{context.loadingMessage}</span>
          </Grid>
        </Grid>
      )}
    </div>
  );
}

export default Loading;
