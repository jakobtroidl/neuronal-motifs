import pandas as pd
import networkx as nx
from neuronal_motifs.server.utils.authentication import *
import navis.interfaces.neuprint as neu
import navis
import tempfile
from pathlib import Path


def get_swc():

    client = neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

    # lets test our abstraction on a simple motif
    # A -> B -> C -> A
    # Body IDs:
    # A: 1003474104
    # B: 5813091420
    # C: 1001453586
    body_ids = [1003474104, 5813091420, 1001453586]

    skeletons = neu.fetch_skeletons(x=body_ids, with_synapses=True, parallel=True)
    skeleton = skeletons[0]
    connectors = skeleton.connectors
    node_id = connectors.loc[connectors.index[0], 'node_id']

    synapses = neu.fetch_synapse_connections([1001453586], [1003474104])

    x = synapses.loc[synapses.index[0], 'x_post']
    y = synapses.loc[synapses.index[0], 'y_post']
    z = synapses.loc[synapses.index[0], 'z_post']

    for index, row in connectors.iterrows():
        conn_x = row['x']
        conn_y = row['y']
        conn_z = row['z']

        if conn_x == x and conn_y == y and conn_z == z:
            node_id = row['node_id']
            print('Success')

    neuron_graph = navis.neuron2nx(skeletons[0])
    neuron_graph = neuron_graph.to_undirected()

    nodes = skeleton.nodes
    print(nodes)

    d = {'x': [21482, 15914], 'y': [28204, 31676], 'z': [16440, 12424]}

    fp = tempfile.NamedTemporaryFile(suffix='.swc')
    skeleton.to_swc(Path(fp.name))
    fp.seek(0)
    swc_string = fp.read().decode('UTF-8')
    fp.close()
    return swc_string
