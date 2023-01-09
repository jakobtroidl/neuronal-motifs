import pickle as pkl
from pathlib import Path
from services.data_access import DataAccess

import networkx as nx

from models.motif import MyMotif
from utils.data_conversion import get_cache_filename, apply_ids_to_motif_adjacency
from params import Params


def test_generator():
    yield 's'
    yield 'i'
    yield 'm'
    yield 'o'
    yield 'n'


def get_motif(ids, motif, token, prev_labels):
    filename = get_cache_filename(ids)
    path = Params.root / "cache" / "data" / "motifs"
    path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist

    filepath = path / (filename + ".pkl")
    # if filepath.is_file() is False:
    if True:
        yield {'status': 202, 'message': 'Downloading Motif'}
        try:
            motif_data_generator = compute_motif_data(ids, motif, token, prev_labels)
            for val in motif_data_generator:
                yield {'status': 202, 'message': val}
        except StopIteration:
            yield {'status': 202, 'message': 'Download Complete'}
    yield {'status': 202, 'message': 'Motif Cached'}
    f = open(filepath, "rb")
    motif = pkl.load(f)
    print("after file open")
    f.close()
    yield {'status': 200, 'payload': motif.as_json()}


def compute_motif_data(body_ids, motif, token, prev_labels):
    yield 'Beginning Computation'
    adjacency = apply_ids_to_motif_adjacency(body_ids, motif)
    yield 'Creating Motif Graph'
    motif_graph = nx.DiGraph(adjacency)
    yield 'Downloading Neurons and Synapses'
    data_access = DataAccess(token)
    neurons = data_access.get_neurons(body_ids)
    motif = MyMotif(neurons, motif_graph)
    yield 'Compute Synapse Clusters'
    motif.cluster_synapses()
    yield 'Computing Motif Path'
    motif.compute_motif_paths(prev_labels)
    yield 'Compute Synapse Trajectory'
    motif.compute_synapse_trajectory()
    # yield 'Computing Distances'
    # motif.compute_synapse_soma_distances()

    filename = get_cache_filename(body_ids)
    path = Params.root / "cache" / "data" / "motifs"
    path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist

    filepath = path / (filename + ".pkl")

    with open(filepath, "wb") as f:
        print('Write Motif to cache ...')
        pkl.dump(motif, f)
    print('Done Write Motif to cache ...')