import axios from "axios";

export async function queryMotifs(motif, number) {
  const res = await axios.post("http://localhost:5050/search", {
    motif: motif,
    lim: number,
  });
  return res.data;
}
