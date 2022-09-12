import axios from "axios";
import {getAuthToken} from "../utils/authentication";

export async function queryMotifs(motif, number) {
    const res = await axios.post(`http://${process.env.REACT_APP_API_URL}/search`, {
        withCredentials: true,
        motif: motif,
        lim: number,
        token: JSON.stringify(getAuthToken()),
    });
    return res.data;
}
