import { TextField } from "@mui/material";
import { getAuthToken, setAuthToken } from "../utils/authentication";
import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { AppContext } from "../contexts/GlobalContext";
import { useContext } from "react";

export default function SettingsPanel(props) {
  let context = useContext(AppContext);
  function handleGreyOutCheckBoxChanged(event) {
    console.log("handleGreyOutCheckBoxChanged");
    context.setGreyOutNonMotifBranches(event.target.checked);
  }
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
    </div>
  );
}
