import json
from typing import Optional

import uvicorn
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi import WebSocket
from requests.exceptions import HTTPError
from starlette.middleware.cors import CORSMiddleware

from models import nblast, count
from services import motifabstraction, motif_search, data_access

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/helloworld")
def read_root():
    return {"Hello": "World!"}


@app.get("/401")
def four_zero_one():
    raise HTTPException(status_code=401, detail="401: Unauthorized")


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}


@app.post("/search")
async def search_motif(req: Request):
    req = await req.json()
    motif = req['motif']
    lim = req['lim']
    token = req['token']
    try:
        return motif_search.search_hemibrain_motif(motif, lim, token)
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=json.loads(e.response.text))
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})


# downloads the data for the given body ids
@app.websocket_route("/display_motif_ws/")
async def ws_get_motif_data(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    ids = json.loads(data['bodyIDs'])
    motif = json.loads(data['motif'])
    token = json.loads(data['token'])
    prev_labels = json.loads(data['labels'])
    get_motif_generator = motifabstraction.get_motif(ids, motif, token, prev_labels)
    try:
        for val in get_motif_generator:
            payload = val
            await websocket.send_json(payload)
            await websocket.receive_text()
    except StopIteration:
        print('Done Fetching Motif')


@app.get("/synapses/neuron={neuron_id}&&inputNeurons={input_neurons}&&outputNeurons={output_neurons}&&token={token}")
def filter_synapses(neuron_id, input_neurons, output_neurons, token):
    access = data_access.DataAccess(token)
    neuron_id = int(neuron_id)
    input_neurons = json.loads(input_neurons)
    output_neurons = json.loads(output_neurons)
    return access.filter_synapses_by_group(neuron_id, input_neurons, output_neurons)


@app.get("/nblast/{node_id}")
@app.get("/nblast/{node_id}/{top_n}")
def get_nblast(node_id: int, top_n: Optional[int] = None):
    return nblast.get_nblast_scores(node_id, top_n)


@app.get("/count/motif={motif}")
def get_motif_count(motif: str):
    return count.get_absolute(motif)


@app.get("/rel_count/motif={motif}")
def get_relative_motif_count(motif: str):
    return count.get_relative(motif)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80, log_level="info")
