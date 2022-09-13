import pickle as pkl
from pathlib import Path

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


def get_motif(ids, motif, token):
    # ids = [1001453586, 1003474104, 5813091420]
    # motif = [[1], [2], [0]]
    filename = get_cache_filename(ids)
    path = Params.root / "cache" / "data" / "motifs"
    path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist

    filepath = path / (filename + ".pkl")
    if filepath.is_file() is False:
        # if True:
        yield {'status': 202, 'message': 'Downloading Motif'}
        try:
            motif_data_generator = compute_motif_data(ids, motif, token)
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


# def get_example_motif():
#     filepath = "cache/test/test_motif.pkl"
#     try:  # try to load from cache
#         f = open(filepath)
#         f.close()
#     except FileNotFoundError:
#         example_motif_data()  # download data if not available
#         f = open(filepath)
#     finally:
#         f = open(filepath, "rb")
#         motif = pkl.load(f)
#         f.close()
#         return motif.as_json()


def compute_motif_data(body_ids, motif, token):
    yield 'Beginning Computation'
    adjacency = apply_ids_to_motif_adjacency(body_ids, motif)
    yield 'Creating Motif Graph'
    motif_graph = nx.DiGraph(adjacency)
    yield 'Downloading Neurons and Synapses'
    motif = MyMotif(token, body_ids, motif_graph)
    yield 'Computing Motif Path'
    motif.compute_motif_paths()
    yield 'Compute Synapse Trajectory'
    motif.compute_synapse_trajectory()
    # yield 'Computing Motif Abstraction'
    # motif.compute_motif_abstraction()
    yield 'Computing Distances'
    motif.compute_synapse_soma_distances()

    filename = get_cache_filename(body_ids)
    path = Params.root / "cache" / "data" / "motifs"
    path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist

    filepath = path / (filename + ".pkl")

    with open(filepath, "wb") as f:
        print('Write Motif to cache ...')
        pkl.dump(motif, f)
    print('Done Write Motif to cache ...')

# def example_motif_data():
#     """
#     Returns neuron body IDs of an example motif.
#     Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
#     @return: Motif object
#     """
#     neurons = [1001453586, 1003474104, 5813091420]
#
#     motif_graph = nx.DiGraph([(neurons[0], neurons[1]), (neurons[1], neurons[2]), (neurons[2], neurons[0])])
#     motif = MyMotif(neurons, motif_graph)
#
#     motif.compute_motif_paths()
#
#     filename = "cache/test/test_motif.pkl"
#     with open(filename, "wb") as f:
#         print('Write Motif to cache ...')
#         pkl.dump(motif, f)
#     print('Done Write Motif to cache ...')
