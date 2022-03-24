import tempfile
from pathlib import Path
import os


def apply_ids_to_motif_adjacency(body_ids, motif):
    """
    TODO
    @param body_ids:
    @param motif:
    @return:
    """

    adj = [[] for i in range(len(motif))]  # map motif adjacency to node ids
    for i in range(0, len(motif)):
        for connection in motif[i]:
            mapped = body_ids[connection]
            adj[i].append(mapped)

    return dict(zip(body_ids, adj))

def treeneurons_list_to_swc_string_list(skeletons):
    """
    TODO
    @param skeletons:
    @return:
    """
    out = [None] * len(skeletons)
    for i in range(len(skeletons)):
        skl = skeletons[i]
        out[i] = treeneuron_to_swc_string(skl)
    return out


def treeneuron_to_swc_string(neuron_skeleton):
    """
    Takes a TreeNeuron skeleton and returns its swc formatted data string
    @param neuron_skeleton: TreeNeuron object
    @return: swc string and mapping from new node id to old node id
    """
    fp = tempfile.NamedTemporaryFile(suffix='.swc', delete=False)
    map_old_to_new = neuron_skeleton.to_swc(Path(fp.name), write_meta=True, return_node_map=True)
    fp.seek(0)
    swc_string = fp.read()
    fp.close()
    os.unlink(fp.name)
    out = swc_string.decode("utf-8")
    map_new_to_old = {int(x): int(y) for x, y in map_old_to_new.items()}

    return {'swc': out, 'map': map_new_to_old}


def adjacency_list_to_motif_string(adjacency_list):
    print(adjacency_list)
    output = "\n "
    for i in range(0, len(adjacency_list)):
        first = chr(65 + int(i))
        if len(adjacency_list[i]) > 0:
            for neighbor in adjacency_list[i]:
                second = chr(65 + int(neighbor))
                output += first + " -> " + second + " \n"
    return output


def synapse_array_to_object(synapse_df):
    """
    TODO
    @param synapse_df:
    @return:
    """
    synapses = [] * len(synapse_df.index) * 2
    for index, synapse in synapse_df.iterrows():
        x_pre = synapse['x_pre']
        y_pre = synapse['y_pre']
        z_pre = synapse['z_pre']
        syn_pre = {'x': x_pre, 'y': y_pre, 'z': z_pre}

        x_post = synapse['x_post']
        y_post = synapse['y_post']
        z_post = synapse['z_post']
        syn_post = {'x': x_post, 'y': y_post, 'z': z_post}

        synapses.append(syn_pre)
        synapses.append(syn_post)

    return synapses
