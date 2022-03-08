import json

from networkx.readwrite import json_graph

from neuronal_motifs.server.services.data_access import DataAccess


class Motif:
    def __init__(self, neuron_ids, graph):
        self.data_access = DataAccess()
        self.graph = graph  # networkx graph of the motif
        self.neurons = self.data_access.get_neurons(neuron_ids)
        self.download_synapses()

    def as_json(self):
        """
        Export the motif, including skeleton labels as a json string
        @return: json string
        """

        neuron_json = []
        for id, neuron in self.neurons.items():
            neuron_json.append(neuron.as_json())

        motif = {
            'graph': json.dumps(json_graph.node_link_data(self.graph)),
            'neurons': json.dumps(neuron_json)
        }

        return json.dumps(motif)


    def compute_motif_paths(self):
        """
        For each neuron in the motif, matches synapses with closest skeleton connector,
        finds the motif path and labels all neuron skeletons based on distance to motif path
        @return:
        """
        for id, neuron in self.neurons.items():
            nodes = neuron.get_nodes_of_motif_synapses()
            neuron.compute_skeleton_labels(nodes)

    def download_synapses(self):
        """
        Downloads all relevant synapses for the neurons in that given motif and safes them in each neuron object
        """
        adjacency = self.get_undirected_adjacency()
        for neuron_id in adjacency:  # download relevant synapses
            neuron = self.neurons[neuron_id]
            synapses = self.data_access.get_synapses(neuron_id, adjacency[neuron_id])
            neuron.set_synapses(synapses)

    def get_undirected_adjacency(self):
        """
        @return: Computes adjacent nodes for each node in the undirected motif graph
        """
        undirected_graph = self.graph.to_undirected()
        return self.get_adjacencies(undirected_graph)

    def get_adjacencies(self, graph):
        """
        @return: Returns adjacent nodes for each node in the motif
        """

        adjacency = {}
        for neuron_id in self.neurons:
            neighbors = [n for n in graph.neighbors(neuron_id)]
            adjacency[neuron_id] = neighbors

        return adjacency
