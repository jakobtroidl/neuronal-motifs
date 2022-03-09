import networkx as nx

from neuronal_motifs.server.models.motif import MyMotif


def get_example_motif():
    motif = example_motif_data()
    motif.compute_motif_paths()
    return motif.as_json()


def example_motif_data():
    """
    Returns neuron body IDs of an example motif.
    Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
    @return: Motif object
    """
    body_ids = [1003474104, 5813091420, 1001453586]
    motif_graph = nx.DiGraph([(1003474104, 5813091420), (5813091420, 1001453586), (1001453586, 1003474104)])
    return MyMotif(body_ids, motif_graph)


def compute_motif_path(motif):
    """
    Determines the nodes/edges for each neuron that define the motif path
    """
    motif.compute_motif_paths()
