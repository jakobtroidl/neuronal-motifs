from neuronal_motifs.server.utils.authentication import *
import navis.interfaces.neuprint as neu

from neuronal_motifs.server.models.neuron import Neuron


class DataAccess:
    def __init__(self):
        neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

    def get_neurons(self, body_ids):
        """
        @param body_ids: array of neuron body ids
        @return: dict of Neuron objects
        """

        skeletons = neu.fetch_skeletons(x=body_ids, with_synapses=True, parallel=True)
        neurons = {}
        for i in range(0, len(body_ids)):
            neuron = Neuron(id=body_ids[i], skeleton=skeletons[i])
            neurons[neuron.id] = neuron
        return neurons

    def get_synapses(self, from_neuron, to_neighbors):
        """
        Returns synapses of all the neighbors of a given neuron
        @param from_neuron: neuron id of which the neighbours are looked at
        @param to_neighbors: list of neighbor ids for which the synapses should be downloaded
        @return: list of synapses
        """
        return neu.fetch_synapse_connections([from_neuron], to_neighbors)
