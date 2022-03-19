from typing import Optional
from fastapi import FastAPI
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from services import data_service
from services import motifabstraction
import motif_search
import uvicorn

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


@app.get("/search/{q}")
def search_motif(q: str): # search one motif at a time
    # call dotmotif search function here
    #if len(q) == 0:
    return "hi"
    #results = motif_search.search_hemibrain_motif(q)
    #return results
    #return {'q': q, 'results': {results} } # return whatever search returns; formatting rn might be weird


@app.get("/get_swc")
def get_swc():
    return {'swc': data_service.get_swc()}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5050, log_level="info")
