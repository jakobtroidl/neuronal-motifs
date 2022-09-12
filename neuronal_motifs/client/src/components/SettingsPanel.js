import { TextField } from "@mui/material";
import { getAuthToken, setAuthToken } from "../utils/authentication";

export default function SettingsPanel(props) {
  return (
    <div>
      <TextField
        id="outlined-basic"
        label="Auth Token"
        variant="outlined"
        size={"small"}
        defaultValue={getAuthToken()}
        onChange={setAuthToken}
      />
    </div>
  );
}
