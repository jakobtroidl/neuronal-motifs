import axios from "axios";
import {getAuthToken} from "../utils/authentication";

export async function queryMotifs(motif, number) {
    try {
        const res = await axios.post(
            `http://${process.env.REACT_APP_API_URL}/search`,
            {
                withCredentials: true,
                motif: motif,
                lim: number,
                token: JSON.stringify(getAuthToken()),
            }
        );
        return res.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`${error.response.status}: ${error.response.data?.detail?.error}`);
        }
        throw error
    }
}
