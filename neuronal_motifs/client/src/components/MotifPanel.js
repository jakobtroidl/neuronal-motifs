import React, { useContext, useEffect, useState } from "react";
import "./MotifPanel.css";
import "./Global.css";
import { AppContext } from "../contexts/GlobalContext";
import SketchPanel from "./SketchPanel";
import SearchIcon from "@mui/icons-material/Search";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Button from "@mui/material/Button";
import { Badge, FormControl, TextField } from "@mui/material";
import _ from "lodash";
import InfoButton from "./InfoButton";
import { queryMotifs } from "../services/data";
import ResultsTable from "./ResultsTable";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import SelectionTable from "./SelectionTable";
import SettingsPanel from "./SettingsPanel";
import { getAuthToken } from "../utils/authentication";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Typography>{children}</Typography>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function MotifPanel() {
  const [number, setNumber] = useState(1);
  const [searchedMotifs, setSearchedMotifs] = useState({});
  const [resultRows, setResultRows] = useState([]);
  const [enableAbsMotifCountInfo, setEnableAbsMotifCountInfo] = useState(false);
  const [selectedTab, setSelectedTab] = React.useState(0);

  const motifPanelId = "motif-panel-div";
  const context = useContext(AppContext);

  function showBadge() {
    return getAuthToken() === "";
  }

  const handleSubmit = () => {
    console.log("handle submit clicked");
    return fetchMotifs();
  };

  const handleTabChange = (event, newTab) => {
    setSelectedTab(newTab);
  };

  const fetchMotifs = async () => {
    console.log("Fetch Motifs");
    context.setLoadingMessage("Searching for Motifs");
    context.setErrorMessage(null);
    try {
      const motifs = await queryMotifs(context.motifQuery, number);
      context.setLoadingMessage(null);
      setSearchedMotifs(motifs);
    } catch (e) {
      console.log(e);
      context.setErrorMessage(e.message);
      context.setLoadingMessage(null);
    }
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
        return { name: "Motif Instance " + j, neurons: motifs };
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
      {/*<Alert severity="error" sx={{position:'absolute'}}>*/}
      {/*    This is an error alert — <strong>check it out!</strong>*/}
      {/*</Alert>*/}
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

        <Box sx={{ width: "100%", borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="basic tabs example"
            flexContainer
          >
            <Tab label="Results" {...a11yProps(0)} />
            <Tab label="Selection" {...a11yProps(1)} />
            <Tab
              label={
                <Badge color="primary" variant="dot" invisible={!showBadge()}>
                  {" "}
                  Settings{" "}
                </Badge>
              }
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>
        <div className="result-section">
          <TabPanel value={selectedTab} index={0} >
            {resultRows.length > 0 ? (
              <ResultsTable results={resultRows} />
            ) : (
              <span className="hint">Please search for motifs first </span>
            )}
          </TabPanel>
          <TabPanel value={selectedTab} index={1}>
            {context.selectedMotifs.length > 0 ? (
              <SelectionTable selection={context.selectedMotifs} />
            ) : (
              <span className="hint">This is where the selection will go </span>
            )}
          </TabPanel>
          <TabPanel value={selectedTab} index={2}>
            <SettingsPanel />
            {/*<span className="hint">This is where the settings will go </span>*/}
          </TabPanel>
        </div>
      </div>
    </div>
  );
}

export default MotifPanel;
