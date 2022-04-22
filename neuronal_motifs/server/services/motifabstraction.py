import networkx as nx
import pickle as pkl
import pathlib
from neuronal_motifs.server.models.motif import MyMotif
from neuronal_motifs.server.utils.data_conversion import *


def test_generator():
    yield 's'
    yield 'i'
    yield 'm'
    yield 'o'
    yield 'n'


def get_motif(ids, motif):
    # ids = [1001453586, 1003474104, 5813091420]
    # motif = [[1], [2], [0]]
    filename = get_cache_filename(ids)
    filepath = Path("cache/data/" + filename + ".pkl")
    if filepath.is_file() is False:
    # if True:
        yield {'status': 202, 'message': 'Downloading Motif'}
        try:
            motif_data_generator = compute_motif_data(ids, motif)
            for val in motif_data_generator:
                yield {'status': 202, 'message': val}
        except StopIteration:
            yield {'status': 202, 'message': 'Download Complete'}
    yield {'status': 202, 'message': 'Motif Cached'}
    f = open(filepath, "rb")
    motif = pkl.load(f)
    f.close()
    yield {'status': 200, 'payload': motif.as_json()}


def get_example_motif():
    filepath = "cache/test/test_motif.pkl"
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
    yield 'Beginning Computation'
    adjacency = apply_ids_to_motif_adjacency(body_ids, motif)
    yield 'Creating Motif Graph'
    motif_graph = nx.DiGraph(adjacency)
    yield 'Downloading Neurons and Synapses'
    motif = MyMotif(body_ids, motif_graph)
    yield 'Computing Motif Path'
    motif.compute_motif_paths()
    yield 'Computing Motif Abstraction'
    motif.compute_motif_abstraction()

    filename = get_cache_filename(body_ids)

    path = "cache/data/" + filename + ".pkl"
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

    filename = "cache/test/test_motif.pkl"
    with open(filename, "wb") as f:
        print('Write Motif to cache ...')
        pkl.dump(motif, f)
    print('Done Write Motif to cache ...')
