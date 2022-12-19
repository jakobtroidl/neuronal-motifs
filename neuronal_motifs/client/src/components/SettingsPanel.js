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

export default function SettingsPanel(props) {
  let context = useContext(AppContext);
  const [roiNames, setRoiNames] = React.useState([]);

  function handleGreyOutCheckBoxChanged(event) {
    console.log("handleGreyOutCheckBoxChanged");
    context.setGreyOutNonMotifBranches(event.target.checked);
  }

  function handleDrawArrowsOnLinesCheckBoxChanged(event) {
    console.log("handleDrawArrowsOnLinesCheckBoxChanged");
    context.setDrawArrowsOnLines(event.target.checked);
  }

  useEffect(async () => {
    if (roiNames.length === 0) {
      let token = getAuthToken();
      let rois = (
        await axios.get(
          `${process.env.REACT_APP_PROTOCOL}://${process.env.REACT_APP_API_URL}/all_rois/token=${token}`,
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
      <CustomizedHook options={roiNames}></CustomizedHook>
      <TextField
        id="outlined-basic"
        label="Auth Token"
        variant="outlined"
        size={"small"}
        defaultValue={getAuthToken()}
        onChange={setAuthToken}
        style={{ marginTop: "15px" }}
      />
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
    </div>
  );
}
