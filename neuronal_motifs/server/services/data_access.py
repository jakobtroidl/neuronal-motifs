from pathlib import Path

import navis
import navis.interfaces.neuprint as neu
import networkit as nk
import pickle as pkl

from neuronal_motifs.server.models.neuron import Neuron
from neuronal_motifs.server.utils.authentication import *


class DataAccess:
    def __init__(self):
        neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

    def get_neuron_metadata(self):
        n = navis.example_neurons(n=1, kind='skeleton')
        test = ''

    def load_neuron_from_cache(self, neuron_id):
        """
        Loads neuron from cache, if exists. Returns None otherwise
        @param neuron_id: int
        @return: Neuron skeleton (pd.DataFrame)
        """
        filepath = Path("cache/data/neurons/" + str(neuron_id) + ".pkl")
        neuron = None
        if filepath.is_file():
            # load neuron from filepath
            with open(filepath, 'rb') as f:
                neuron = pkl.load(f)
                f.close()
        return neuron


    def dump_neurons_to_cache(self, neurons):
        """
        Dumps a list of neurons to cache
        @param neurons: [int] list of neuron ids
        """
        for neuron in neurons:
            with open('cache/data/neurons/' + str(neuron.id) + '.pkl', 'wb') as f:
                pkl.dump(neuron, f)
            f.close()

    def get_neurons(self, body_ids):
        """
        @param body_ids: array of neuron body ids
        @return: dict of Neuron objects
        """
        nl = navis.NeuronList([])  # list of neuron objects already in cache
        neurons_to_download = []  # list of neuron ids that have yet to be downloaded
        for id in body_ids:
            neuron = self.load_neuron_from_cache(id)
            if neuron is None:
                neurons_to_download.append(id)
            else:
                # download neuron
                nl.append(neuron)

        print("{} neurons loaded from cache".format(len(nl)))
        print("{} neurons to download".format(len(neurons_to_download)))

        if len(neurons_to_download) > 0:
            skeletons = neu.fetch_skeletons(x=neurons_to_download, with_synapses=True, parallel=True)
            self.dump_neurons_to_cache(skeletons)
            nl.append(skeletons)

        print("Download. Done.")

        output = []
        for skel in nl:
            healed_skel = navis.heal_skeleton(skel)

            # extract method
            nk_graph = nk.nxadapter.nx2nk(navis.neuron2nx(healed_skel))
            nk_graph = nk.graphtools.toUndirected(nk_graph)
            nk_graph.indexEdges()

            neuron = Neuron(id=skel.id, skeleton=healed_skel, skel_graph=nk_graph)
            output.append(neuron)
        return output

    def get_synapses(self, from_neurons, to_neighbors):
        """
        Returns synapses of all the neighbors of a given neuron
        @param from_neurons: neuron ids of which the neighbours are looked at
        @param to_neighbors: list of neighbor ids for which the synapses should be downloaded
        @return: list of synapses
        """
        return neu.fetch_synapse_connections(from_neurons, to_neighbors)
