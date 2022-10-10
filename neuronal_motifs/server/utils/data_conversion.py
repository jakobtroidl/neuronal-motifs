import json
import os
import tempfile
from pathlib import Path

import networkx as nx
from scipy.spatial import KDTree
from neuprint import fetch_all_rois


def get_cache_filename(ids):
    """
    Returns filename of cached motif
    @param ids: ids of neurons in that motif
    @return: filename as string
    """
    return "_".join(map(str, ids))


def apply_ids_to_motif_adjacency(body_ids, motif):
    """
    @param body_ids: ids of neurons forming the motif
    @param motif: motif adjacency matrix
    @return: dict of motif adjacency. Keys are body ids, values are adjacency
    """

    # print additional connections
    adj = [[] for i in range(len(motif['nodes']))]  # map motif adjacency to node ids
    for edge in motif['edges']:
        adj[edge['indices'][0]].append(body_ids[edge['indices'][1]])
    return dict(zip(body_ids, adj))


def get_closest_point(nodes, position):
    node_array = nodes.iloc[:, 1:4].values
    kdtree = KDTree(node_array)
    dist, point = kdtree.query(position, 1)
    node = nodes.iloc[point]
    return int(node['node_id'])


def treeneuron_to_swc_string(neuron_skeleton):
    """
    Takes a TreeNeuron skeleton and returns its swc formatted data string
    @param neuron_skeleton: TreeNeuron object
    @return: swc string and mapping from new node id to old node id
    """
    fp = tempfile.NamedTemporaryFile(suffix='.swc', delete=False)
    map_old_to_new = neuron_skeleton.to_swc(Path(fp.name), write_meta=True, labels='abstraction_label',
                                            return_node_map=True)
    fp.seek(0)
    swc_string = fp.read()
    fp.close()
    os.unlink(fp.name)
    out = swc_string.decode("utf-8")
    map_new_to_old = {int(x): int(y) for x, y in map_old_to_new.items()}

    return {'swc': out, 'map': map_new_to_old}


def nodes_and_edges_to_networkx(motif):
    '''
    Converts node and edge string to networkx graph
    @param motif: node and edge string
    @return: directed networkx graph
    '''
    graph = nx.DiGraph()
    motif = json.loads(motif)
    for edge in motif['edges']:
        graph.add_edge(edge['indices'][0], edge['indices'][1])
    return graph


# Converts Query Builder Mongo-esque parameters to dotmotif query format
def nodes_and_edges_to_motif_string(motif):
    print(motif)
    edges = motif['edges']
    nodes = motif['nodes']
    output = "\n "

    rois = fetch_all_rois()
    # First list every edge like A -> B [weight > x]
    for edge in edges:
        edge_str = edge['label']
        if 'properties' in edge and edge['properties'] is not None:
            edge_str += ' ['
            for i, prop in enumerate(list(edge['properties'].items())):
                if i != 0:
                    edge_str += ', '
                array = []
                if prop[0] in rois:
                    array = ["\"" + prop[0] + '.pre"', "\"" + prop[0] + '.post"']
                else:
                    array = [prop[0]]
                for i, el in enumerate(array):
                    if i != 0:
                        edge_str += ', '
                    edge_str += el
                    if type(prop[1]) == int or type(prop[1]) == float:
                        edge_str += ' == ' + str(prop[1])
                    elif '$lt' in prop[1]:
                        edge_str += ' < ' + str(prop[1]['$lt'])
                    elif '$gt' in prop[1]:
                        edge_str += ' > ' + str(prop[1]['$gt'])

            edge_str += ']'
        edge_str += ' \n'
        output += edge_str
    # Now list every node property like A['prop'] == True
    for node in nodes:
        node_str = str(node['label']) + '.status = "Traced" \n'
        if 'properties' in node and node['properties'] is not None:
            for prop in list(node['properties'].items()):
                if type(prop[1]) == bool or type(prop[1]) == int or type(prop[1]) == float:
                    node_str += str(node['label']) + "['" + str(prop[0]) + "'] = " + str(prop[1]) + '\n'
                elif type(prop[1]) == str:
                    node_str += str(node['label']) + "['" + str(prop[0]) + "'] = " + '"' + str(prop[1]) + '"' + '\n'
                elif '$lt' in prop[1]:
                    node_str += str(node['label']) + "['" + str(prop[0]) + "'] < " + str(prop[1]['$lt']) + '\n'
                elif '$gt' in prop[1]:
                    node_str += str(node['label']) + "['" + str(prop[0]) + "'] > " + str(prop[1]['$gt']) + '\n'
        output += node_str
    return output


def edges_to_json(edges):
    edge_list = []
    for edge in edges:
        edge_json = edge.as_json()
        edge_list.append(edge_json)
    return edge_list


def synapse_array_to_object(synapse_df):
    """
    Convert df of synapses to serializable objecy
    @param synapse_df: pd.df
    @return: list of synapse objects
    """
    synapses = [] * len(synapse_df.index)
    for index, synapse in synapse_df.iterrows():
        x_pre = synapse['x_pre']
        y_pre = synapse['y_pre']
        z_pre = synapse['z_pre']

        syn_pre_id = synapse['bodyId_pre']
        syn_pre = {'x': x_pre, 'y': y_pre, 'z': z_pre}
        syn_pre_soma_distance = 0
        if 'soma_distance_pre' in synapse_df.columns:
            syn_pre_soma_distance = synapse['soma_distance_pre']

        x_post = synapse['x_post']
        y_post = synapse['y_post']
        z_post = synapse['z_post']

        syn_post_id = synapse['bodyId_post']
        syn_post = {'x': x_post, 'y': y_post, 'z': z_post}
        syn_post_soma_distance = 0
        if 'soma_distance_post' in synapse_df.columns:
            syn_post_soma_distance = synapse['soma_distance_post']

        syn = {'pre_id': syn_pre_id, 'post_id': syn_post_id, 'pre': syn_pre, 'post': syn_post,
               'pre_soma_dist': syn_pre_soma_distance, 'post_soma_dist': syn_post_soma_distance}
        synapses.append(syn)

    return synapses
