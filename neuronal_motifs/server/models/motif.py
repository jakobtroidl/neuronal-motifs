import networkx as nx


class Motif:
    def __init__(self, neurons, graph):
        self.neurons = neurons # dict of neurons. id is the body id
        self.graph = graph # networkx graph of the motif

    def are_adjacent_in_motif(self, from_neuron, to_neuron):
        """
        @param from_neuron: body ID from start motif node
        @param to_neuron: body ID from end motif node
        @return: boolean value whether these two nodes are connected in the motif
        """
        return to_neuron in self.graph.neighbors(from_neuron)

    def get_adjacency_matrix(self):
        """
        Return the adjacency matrix of the motif graph as a numpy array
        @return: motif graph adjacency matrix as np array
        """
        matrix = nx.adjacency_matrix(self.graph)
        return matrix.toarray()
