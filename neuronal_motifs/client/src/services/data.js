import axios from "axios";
import { getAuthToken } from "../utils/authentication";

export async function queryMotifs(motif, number) {
  const res = await axios.post("http://localhost:5050/search", {
    motif: motif,
    lim: number,
    token: JSON.stringify(getAuthToken()),
  });
  return res.data;
}
