import json
import time
from typing import Optional

import uvicorn
from fastapi import FastAPI
from fastapi import Request
from fastapi import WebSocket
from starlette.middleware.cors import CORSMiddleware

from models import nblast, count
from services import data_service, motifabstraction, motif_search, data_access

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/helloworld")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}


@app.get("/get_test_motif")
def get_test_motif():
    return motifabstraction.get_example_motif()


@app.post("/search")
async def search_motif(req: Request):
    req = await req.json()
    motif = req['motif']
    lim = req['lim']
    return motif_search.search_hemibrain_motif(motif, lim)


@app.get("/get_sample_node")
def get_sample_node():  # search one motif at a time
    return motif_search.get_sample_node()


@app.get("/display_motif/bodyIDs={ids}&motif={motif}")
def get_motif_data(ids, motif):
    ids = json.loads(ids)
    motif = json.loads(motif)
    return motifabstraction.get_motif(ids, motif)


# http://localhost:5050/display_motif/bodyIDs=[1001453586,5813032887,5813091420]&motif=[[2],[0],[1,0]]
@app.websocket("/ws_display_motif/bodyIDs={ids}&motif={motif}")
async def ws_get_motif_data(websocket: WebSocket, ids: str, motif: str):
    await websocket.accept()
    ids = json.loads(ids)
    motif = json.loads(motif)
    get_motif_generator = motifabstraction.get_motif(ids, motif)
    try:
        for val in get_motif_generator:
            payload = val
            await websocket.send_json(payload)
    except StopIteration:
        print('Done Fetching Motif')


# http://localhost:5050/display_motif/bodyIDs=[1001453586,5813032887,5813091420]&motif=[[2],[0],[1,0]]
# /bodyIDs={ids}&motif={motif}
@app.websocket_route("/display_motif_ws/")
async def ws_get_motif_data(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    timer = time.time()
    ids = json.loads(data['bodyIDs'])
    motif = json.loads(data['motif'])
    get_motif_generator = motifabstraction.get_motif(ids, motif)
    try:
        for val in get_motif_generator:
            payload = val
            await websocket.send_json(payload)
            await websocket.receive_text()
    except StopIteration:
        print('Done Fetching Motif')


@app.get("/synapses/neuron={neuron_id}&&inputNeurons={input_neurons}&&outputNeurons={output_neurons}")
def filter_synapses(neuron_id, input_neurons, output_neurons):
    access = data_access.DataAccess()
    neuron_id = int(neuron_id)
    input_neurons = json.loads(input_neurons)
    output_neurons = json.loads(output_neurons)
    return access.filter_synapses_by_group(neuron_id, input_neurons, output_neurons)



@app.get("/get_swc")
def get_swc():
    return {'swc': data_service.get_swc()}


@app.get("/nblast/{node_id}")
@app.get("/nblast/{node_id}/{top_n}")
def get_nblast(node_id: int, top_n: Optional[int] = None):
    return nblast.get_nblast_scores(node_id, top_n)


@app.get("/count/motif={motif}")
def get_motif_count(motif: str):
    return count.get(motif)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5050, log_level="info")
