import tempfile
from pathlib import Path
import os


def neuron_to_swc_string(neuron_skeleton):
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
