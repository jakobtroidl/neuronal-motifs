import networkx as nx
import pickle as pkl

from neuronal_motifs.server.models.motif import MyMotif


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
        motif.compute_motif_paths()

        motif.simplify(factor=0.7)
        return motif.as_json()


def example_motif_data():
    """
    Returns neuron body IDs of an example motif.
    Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
    @return: Motif object
    """
    body_ids = [1003474104, 5813091420, 1001453586]

    motif_graph = nx.DiGraph([(1003474104, 5813091420), (5813091420, 1001453586), (1001453586, 1003474104)])
    motif = MyMotif(body_ids, motif_graph)

    filename = "cache/test_motif.pkl"
    with open(filename, "wb") as f:
        pkl.dump(motif, f)
