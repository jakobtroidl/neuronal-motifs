import pickle as pkl
from params import Params
import networkx as nx
import scipy.special

from utils import nodes_and_edges_to_networkx


def get_random(motif):
    """
    Gets the expected number of occurrences of a given motif in a random network.
    @param motif: motif
    @return: expected occurrences of the motif in a random network
    """
    graph = nodes_and_edges_to_networkx(motif)
    num_nodes = len(graph.nodes())
    num_edges = len(graph.edges())

    hemibrain_nodes = 21_740  # number of neurons in hemibrain
    hemibrain_edges = 4_000_000  # number of edges in hemibrain

    lamda = 0.5
    p = hemibrain_edges / ((hemibrain_nodes - 1) * hemibrain_nodes)

    binom = scipy.special.binom(hemibrain_nodes, num_nodes)

    return lamda * binom * (p ** num_edges) * (1 - p) ** (num_nodes * (num_nodes - 1) - num_edges)


def get_relative(motif):
    """

    @param motif:
    @return:
    """

    absolute_count = int(get_absolute(motif))
    random_count = int(get_random(motif))

    print(f"abs: {absolute_count}")
    print(f"ran: {random_count}")

    if random_count <= 1:
        return 2
    return 2 * (absolute_count / random_count) - 2


def get_absolute(motif):
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
    path = Params.root / "cache" / "motifcounts" / "withoutedgecolor" / partial_path
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
