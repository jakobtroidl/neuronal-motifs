import pickle as pkl
from params import Params
import networkx as nx

from utils import nodes_and_edges_to_networkx


def get(motif):
    """
    Returns the number of occurrences of a given motif in the hemibrain dataset.
    @param motif: string describing the motif
    @return: int number of occurrences of the motif
    """

    graph = nodes_and_edges_to_networkx(motif)
    # get number of nodes in graph
    num_nodes = len(graph.nodes())
    if not (3 <= num_nodes <= 5):  # currently only supports 2 or 3 node motifs
        return 0

    # relative path to motif-size-003.pickle
    partial_path = "motif-size-00{}.pickle".format(num_nodes)
    print(Params.root)
    path = Params.root / "server" / "cache" / "motifcounts" / "withoutedgecolor" / partial_path
    print(path)

    # load motif counts from pickle
    with open(path, 'rb') as f:
        motif_counts = pkl.load(f)

    count = 0
    hits = 0
    # iterate over motif_count
    for key in motif_counts:
        # if motif_count is a match, return count
        if nx.is_isomorphic(graph, key):
            count = motif_counts[key]
            hits += 1
    print(f"{hits} isomorphs found for {motif}")
    return count
