import navis.interfaces.neuprint as neu
import navis

from neuronal_motifs.server.models.neuron import Neuron
from neuronal_motifs.server.utils.authentication import *


class DataAccess:
    def __init__(self):
        neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

    def get_neuron_metadata(self):
        n = navis.example_neurons(n=1, kind='skeleton')
        test = ''



    def get_neurons(self, body_ids):
        """
        @param body_ids: array of neuron body ids
        @return: dict of Neuron objects
        """
        print('Download Neurons')
        skeletons = neu.fetch_skeletons(x=body_ids, with_synapses=True, parallel=True)
        neurons = []
        for skel in skeletons:
            neuron = Neuron(id=skel.id, skeleton=skel)
            neurons.append(neuron)
        return neurons

    def get_synapses(self, from_neurons, to_neighbors):
        """
        Returns synapses of all the neighbors of a given neuron
        @param from_neurons: neuron ids of which the neighbours are looked at
        @param to_neighbors: list of neighbor ids for which the synapses should be downloaded
        @return: list of synapses
        """
        return neu.fetch_synapse_connections(from_neurons, to_neighbors)