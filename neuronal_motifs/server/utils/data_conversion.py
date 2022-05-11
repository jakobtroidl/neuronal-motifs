import sys
import tempfile
from pathlib import Path
import os
import numpy as np


def get_cache_filename(ids):
    """
    TODO
    @param ids:
    @return:
    """
    return "_".join(map(str, ids))


def apply_ids_to_motif_adjacency(body_ids, motif):
    """
    TODO
    @param body_ids:
    @param motif:
    @return:
    """

    adj = [[] for i in range(len(motif['nodes']))]  # map motif adjacency to node ids
    for edge in motif['edges']:
        adj[edge['indices'][0]].append(body_ids[edge['indices'][1]])
    return dict(zip(body_ids, adj))


# def treeneurons_list_to_swc_string_list(skeletons):
#     """
#     TODO
#     @param skeletons:
#     @return:
#     """
#     out = [None] * len(skeletons)
#     for i in range(len(skeletons)):
#         skl = skeletons[i]
#         out[i] = treeneuron_to_swc_string(skl)
#     return out


def get_closest_point(nodes, position):
    closest_distance = sys.float_info.max
    node_id = -1
    for index, node in nodes.iterrows():
        x = node['x']
        y = node['y']
        z = node['z']

        point = np.array((x, y, z))
        dist = distance(point, position)

        if dist < closest_distance:
            closest_distance = dist
            node_id = node['node_id']
    return node_id


def distance(a, b):
    """
    Calculate absolute euclidean distance between two 3D np arrays
    @param a: point 1
    @param b: point 2
    @return: distance
    """
    # calculate Euclidean distance
    return abs(np.linalg.norm(a - b))


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


# Converts Query Builder Mongo-esque parameters to dotmotif query format
def nodes_and_edges_to_motif_string(motif):
    print(motif)
    edges = motif['edges']
    nodes = motif['nodes']
    output = "\n "
    # First list every edge like A -> B [weight > x]
    for edge in edges:
        edge_str = edge['label']
        if 'properties' in edge:
            edge_str += ' ['
            for i, prop in enumerate(list(edge['properties'].items())):
                if i != 0:
                    edge_str += ', '
                edge_str += prop[0]
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
    TODO
    @param synapse_df:
    @return:
    """
    synapses = [] * len(synapse_df.index)
    for index, synapse in synapse_df.iterrows():
        x_pre = synapse['x_pre']
        y_pre = synapse['y_pre']
        z_pre = synapse['z_pre']

        syn_pre_id = synapse['bodyId_pre']
        syn_pre = {'x': x_pre, 'y': y_pre, 'z': z_pre}
        syn_pre_soma_distance = synapse['soma_distance_pre']

        x_post = synapse['x_post']
        y_post = synapse['y_post']
        z_post = synapse['z_post']

        syn_post_id = synapse['bodyId_post']
        syn_post = {'x': x_post, 'y': y_post, 'z': z_post}
        syn_post_soma_distance = synapse['soma_distance_post']

        syn = {'pre_id': syn_pre_id, 'post_id': syn_post_id, 'pre': syn_pre, 'post': syn_post,
               'pre_soma_dist': syn_pre_soma_distance, 'post_soma_dist': syn_post_soma_distance}
        synapses.append(syn)

    return synapses
