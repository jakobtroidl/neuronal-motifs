from services.data_access import DataAccess

import networkx as nx

from models.motif import MyMotif
from utils.data_conversion import apply_ids_to_motif_adjacency


def test_generator():
    yield 's'
    yield 'i'
    yield 'm'
    yield 'o'
    yield 'n'


def get_motif(ids, motif, token, prev_labels):
    if True:
        yield {'status': 202, 'message': 'Downloading Motif'}
        try:
            motif = compute_motif_data(ids, motif, token, prev_labels)
            # for val in motif_data_generator:
            #     yield {'status': 202, 'message': val}
        except StopIteration:
            yield {'status': 202, 'message': 'Download Complete'}
    yield {'status': 202, 'message': 'Motif Cached'}
    yield {'status': 200, 'payload': motif.as_json()}


def compute_motif_data(body_ids, motif, token, prev_labels):
    print('Beginning Computation')
    adjacency = apply_ids_to_motif_adjacency(body_ids, motif)
    print('Creating Motif Graph')
    motif_graph = nx.DiGraph(adjacency)
    print('Downloading Neurons and Synapses')
    data_access = DataAccess(token)
    neurons = data_access.get_neurons(body_ids)
    motif = MyMotif(neurons, motif_graph)
    print('Compute Synapse Clusters')
    motif.cluster_synapses()
    print('Computing Motif Path')
    motif.compute_motif_paths(prev_labels)
    print('Compute Synapse Trajectory')
    motif.compute_synapse_trajectory()
    # yield 'Computing Distances'
    # motif.compute_synapse_soma_distances()

    return motif
