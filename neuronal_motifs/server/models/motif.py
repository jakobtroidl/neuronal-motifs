import networkx as nx

from neuronal_motifs.server.services.data_access import DataAccess


class Motif:
    def __init__(self, neuron_ids, graph):
        self.data_access = DataAccess()
        self.graph = graph  # networkx graph of the motif
        self.neurons = self.data_access.get_neurons(neuron_ids)
        self.download_synapses()

    def compute_motif_paths(self):
        for id, neuron in self.neurons.items():
            nodes = neuron.get_nodes_of_motif_synapses()
            neuron.compute_skeleton_labels(nodes)

    def download_synapses(self):
        """
        TODO
        @return:
        """
        adjacency = self.get_undirected_adjacency()
        for neuron_id in adjacency:  # download relevant synapses
            neuron = self.neurons[neuron_id]
            synapses = self.data_access.get_synapses(neuron_id, adjacency[neuron_id])
            neuron.set_synapses(synapses)

    def get_undirected_adjacency(self):
        """
        TODO
        @return:
        """
        undirected_graph = self.graph.to_undirected()
        return self.get_adjacencies(undirected_graph)

    def get_adjacencies(self, graph):
        """
        Returns adjacent nodes for each node in the motif
        @return: adjacent nodes for each node
        """

        adjacency = {}
        for neuron_id in self.neurons:
            neighbors = [n for n in graph.neighbors(neuron_id)]
            adjacency[neuron_id] = neighbors

        return adjacency

    # def are_adjacent_in_motif(self, from_neuron, to_neuron):
    #     """
    #     @param from_neuron: body ID from start motif node
    #     @param to_neuron: body ID from end motif node
    #     @return: boolean value whether these two nodes are connected in the motif
    #     """
    #     return to_neuron in self.graph.neighbors(from_neuron)
    #
    # def get_adjacency_matrix(self):
    #     """
    #     Return the adjacency matrix of the motif graph as a numpy array
    #     @return: motif graph adjacency matrix as np array
    #     """
    #     matrix = nx.adjacency_matrix(self.graph)
    #     return matrix.toarray()