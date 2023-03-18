import { TextField } from "@mui/material";
import { getAuthToken, setAuthToken } from "../utils/authentication";
import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { AppContext } from "../contexts/GlobalContext";
import { useContext, useEffect } from "react";
import CustomizedHook from "./ROIAutocomplete";
import axios from "axios";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export default function SettingsPanel(props) {
  let context = useContext(AppContext);
  const [roiNames, setRoiNames] = React.useState([]);

  function handleGreyOutCheckBoxChanged(event) {
    console.log("handleGreyOutCheckBoxChanged");
    context.setGreyOutNonMotifBranches(event.target.checked);
  }

  const handleDofEnabledChange = (event, value) => {
    console.log("handleDofEnabledChange: ", value);
    context.setDofEnabled(value);
  };

  const handleFocusChange = (event, value) => {
    console.log("handleFocusChange: ", value);
    context.setDofFocus(value);
  };

  const handleMaxBlurChange = (event, value) => {
    console.log("handleMaxBlurChange: ", value);
    context.setDofBlur(value);
  };

  function handleDrawArrowsOnLinesCheckBoxChanged(event) {
    console.log("handleDrawArrowsOnLinesCheckBoxChanged");
    context.setDrawArrowsOnLines(event.target.checked);
  }

  useEffect(async () => {
    if (roiNames.length === 0) {
      let token = getAuthToken();
      let rois = (
        await axios.get(
          `${process.env.REACT_APP_API_PROTOCOL}://${process.env.REACT_APP_API_URL}/all_rois/token=${token}`,
          {
            withCredentials: true,
          }
        )
      ).data;
      setRoiNames(rois);
    }
  }, []);

  return (
    <div>
      <TextField
        id="outlined-basic"
        label="Auth Token"
        variant="outlined"
        size={"small"}
        defaultValue={getAuthToken()}
        onChange={setAuthToken}
        style={{ marginTop: "15px" }}
      />
      <Divider style={{ marginTop: "15px", marginBottom: "15px" }} />

      <Typography gutterBottom>Rendering Settings</Typography>
      <CustomizedHook options={roiNames}></CustomizedHook>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={context.greyOutNonMotifBranches}
              onChange={handleGreyOutCheckBoxChanged}
              inputProps={{ "aria-label": "controlled" }}
            />
          }
          label="Grey out non-motif branches"
        />
      </FormGroup>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={context.drawArrowsOnLines}
              onChange={handleDrawArrowsOnLinesCheckBoxChanged}
              inputProps={{ "aria-label": "controlled" }}
            />
          }
          label="Draw arrows on lines in exploded view"
        />
      </FormGroup>
      <Box>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox defaultChecked={context.dofEnabled} />}
            label="DOF enabled"
            onChange={handleDofEnabledChange}
          />
        </FormGroup>
        <Typography gutterBottom>DOF focus</Typography>
        <Slider
          defaultValue={3}
          min={0}
          max={9}
          step={0.05}
          aria-label="Default"
          valueLabelDisplay="auto"
          onChange={handleFocusChange}
        />
        <Typography gutterBottom>DOF maxBlur</Typography>
        <Slider
          defaultValue={0.5}
          min={0.0}
          max={1.5}
          step={0.01}
          aria-label="Default"
          valueLabelDisplay="auto"
          onChange={handleMaxBlurChange}
        />
      </Box>
    </div>
  );
}
