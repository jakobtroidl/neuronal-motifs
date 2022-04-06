import json
import pandas as pd
from networkx.readwrite import json_graph

from neuronal_motifs.server.services.data_access import DataAccess


class MyMotif:
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
            'graph': json_graph.node_link_data(self.graph),
            'neurons': neuron_json
        }

        return motif

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
        adjacency = self.get_adjacency(undirected=True)
        for neuron_id in adjacency:  # download relevant synapses
            neuron = self.neurons[neuron_id]
            outgoing_synapses = self.data_access.get_synapses([neuron_id], adjacency[neuron_id])
            incoming_synapses = self.data_access.get_synapses(adjacency[neuron_id], [neuron_id])
            synapses = pd.concat([outgoing_synapses, incoming_synapses], ignore_index=True, sort=False)
            neuron.set_synapses(synapses)

    def get_adjacency(self, undirected=True):
        """
        @param undirected: determines whether to return directed or undirected adjacency of the undirected graph
        @return: adjacent nodes for each node in the motif graph
        """
        graph = self.graph
        if undirected:
            graph = self.graph.to_undirected()
        return self.get_adjacencies(graph)

    def get_adjacencies(self, graph):
        """
        @return: Returns adjacent nodes for each node in the motif
        """

        adjacency = {}
        for neuron_id in self.neurons:
            neighbors = [n for n in graph.neighbors(neuron_id)]
            adjacency[neuron_id] = neighbors

        return adjacency
