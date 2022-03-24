import networkx as nx
import pickle as pkl

from neuronal_motifs.server.models.motif import MyMotif
from neuronal_motifs.server.utils.data_conversion import *


def get_example_motif():
    filepath = "cache/test_motif.pkl"
    try:  # try to load from cache
        f = open(filepath)
        f.close()
    except FileNotFoundError:
        example_motif_data()  # download data if not available
        f = open(filepath)
    finally:
        f = open(filepath, "rb")
        motif = pkl.load(f)
        f.close()
        return motif.as_json()


# def get_pruned_motif(factor):
#     filepath = "cache/test_motif.pkl"
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
#         motif.simplify(factor=factor)
#         return motif.as_json()

def compute_motif_data(body_ids, motif):

    adjacency = apply_ids_to_motif_adjacency(body_ids, motif)
    motif_graph = nx.DiGraph(adjacency)

    motif = MyMotif(body_ids, motif_graph)
    motif.compute_motif_paths()

    filename = "_".join(map(str, body_ids))

    path = "cache/" + filename + ".pkl"
    with open(path, "wb") as f:
        print('Write Motif to cache ...')
        pkl.dump(motif, f)
    print('Done Write Motif to cache ...')


def example_motif_data():
    """
    Returns neuron body IDs of an example motif.
    Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
    @return: Motif object
    """
    neurons = [1001453586, 1003474104, 5813091420]

    motif_graph = nx.DiGraph([(neurons[0], neurons[1]), (neurons[1], neurons[2]), (neurons[2], neurons[0])])
    motif = MyMotif(neurons, motif_graph)

    motif.compute_motif_paths()

    filename = "cache/test_motif.pkl"
    with open(filename, "wb") as f:
        print('Write Motif to cache ...')
        pkl.dump(motif, f)
    print('Done Write Motif to cache ...')
