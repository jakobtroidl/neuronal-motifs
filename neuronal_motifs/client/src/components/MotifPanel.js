import React, { useContext, useEffect, useState } from "react";
import "./MotifPanel.css";
import { AppContext } from "../contexts/GlobalContext";
import SketchPanel from "./SketchPanel";
import SearchIcon from "@mui/icons-material/Search";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Button from "@mui/material/Button";
import { FormControl, TextField } from "@mui/material";
import _ from "lodash";
import InfoButton from "./InfoButton";
import { queryMotifs } from "../services/data";
import ResultsTable from "./ResultsTable";

function MotifPanel() {
  const [number, setNumber] = useState(1);
  const [searchedMotifs, setSearchedMotifs] = useState({});
  const [resultRows, setResultRows] = useState([]);
  const [enableAbsMotifCountInfo, setEnableAbsMotifCountInfo] = useState(false);

  const motifPanelId = "motif-panel-div";
  const context = useContext(AppContext);

  const handleSubmit = () => {
    console.log("handle submit clicked");
    return fetchMotifs();
  };

  const fetchMotifs = async () => {
    console.log("Fetch Motifs");
    context.setLoadingMessage("Searching for Motifs");
    const motifs = await queryMotifs(context.motifQuery, number);
    context.setLoadingMessage(null);
    setSearchedMotifs(motifs);
  };

  useEffect(() => {
    if (searchedMotifs && searchedMotifs?.length > 0) {
      let rows = searchedMotifs.map((motif, j) => {
        let motifs = Object.entries(motif).map(([k, v], i) => {
          return { ...v, nodeKey: k };
        });
        motifs.sort((a, b) => {
          return a.nodeKey.localeCompare(b.nodeKey);
        });
        return { name: "Motif" + j, neurons: motifs };
      });
      setResultRows(rows);
    }
  }, [searchedMotifs]);

  // catch change in context absmotifcount
  useEffect(() => {
    if (context.absMotifCount == null || context.absMotifCount <= 0) {
      setEnableAbsMotifCountInfo(false);
    } else {
      setEnableAbsMotifCountInfo(true);
    }
  }, [context.absMotifCount]);

  return (
    <div id={motifPanelId}>
      <div className="form">
        <div className="handle">
          <DragHandleIcon />
          <InfoButton
            text={context.absMotifCount}
            disabled={!enableAbsMotifCountInfo}
            color="primary"
            icon={<SearchIcon />}
          />
          {enableAbsMotifCountInfo ? (
            <InfoButton text="Medium" color="secondary" />
          ) : null}
          {context.showWarning ? (
            <InfoButton color="error" icon={<PriorityHighIcon />} />
          ) : null}
        </div>
        <div id="motif-panel-wrapper">
          <SketchPanel />
          <div className="sketch-panel-options-style">
            <FormControl sx={{ m: 1, maxWidth: 80 }}>
              <TextField
                id="outlined-number"
                label="Number"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                margin="normal"
                style={{ marginTop: 0 }}
                defaultValue={1}
                onChange={(event) => setNumber(_.toNumber(event.target.value))}
              />
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 100 }}>
              <Button
                size="medium"
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSubmit}
              >
                Search
              </Button>
            </FormControl>
          </div>
        </div>

        {resultRows?.length > 0 && (
          <div className="results">
            <ResultsTable results={resultRows}> {""}</ResultsTable>
          </div>
        )}
      </div>
    </div>
  );
}

export default MotifPanel;
