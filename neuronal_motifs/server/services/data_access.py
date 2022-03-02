from neuronal_motifs.server.utils.authentication import *
import navis.interfaces.neuprint as neu

from neuronal_motifs.server.models.neuron import Neuron


class DataAccess:
    def __init__(self):
        neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

    def get_neuron_data(self, body_ids):
        """
        @param body_ids: array of neuron body ids
        @return: array of Neuron objects
        """

        skeletons = neu.fetch_skeletons(x=body_ids, with_synapses=True, parallel=True)
        neurons = []
        for i in range(0, len(body_ids)):
            neuron = Neuron(id=body_ids[i], skeleton=skeletons[i])
            neurons.append(neuron)
        return neurons

    def get_synapses(self, from_neuron, to_neuron):
        return neu.fetch_synapse_connections([from_neuron], [to_neuron])
