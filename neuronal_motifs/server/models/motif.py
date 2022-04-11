import json
import time
import navis

import pandas as pd
from networkx.readwrite import json_graph
from line_profiler_pycharm import profile

from neuronal_motifs.server.services.data_access import DataAccess


class MyMotif:
    def __init__(self, neuron_ids=None, graph=None, distances=None):
        self.data_access = DataAccess()
        self.graph = graph  # networkx graph of the motif
        self.neurons = self.data_access.get_neurons(neuron_ids)
        self.distances = distances
        self.download_synapses()

    def as_json(self):
        """
        Export the motif, including skeleton labels as a json string
        @return: json string
        """

        neuron_json = []
        for neuron in self.neurons:
            neuron_json.append(neuron.as_json())

        motif = {
            'graph': json_graph.node_link_data(self.graph),
            'neurons': neuron_json
        }

        return motif

    @profile
    def compute_motif_paths(self):
        """
        For each neuron in the motif, matches synapses with closest skeleton connector,
        finds the motif path and labels all neuron skeletons based on distance to motif path
        @return:
        """
        for neuron in self.neurons:
            nodes = neuron.get_nodes_of_motif_synapses()

            print("Compute compute node labels for skeleton {} ...".format(neuron.id))
            t = time.time()
            neuron.compute_skeleton_labels(nodes)
            print("Done. Took {} sec".format(time.time() - t))

    def compute_motif_abstraction(self):
        """
        Computes the levels of abstraction for the motif path
        """
        for neuron in self.neurons:
            print("Compute Motif Abstraction for Neuron {} ...".format(neuron.id))
            t = time.time()
            neuron.set_skeleton_abstractions(7)
            print('Done. Took {} sec'.format(time.time() - t))

    def download_synapses(self):
        """
        Downloads all relevant synapses for the neurons in that given motif and safes them in each neuron object
        """
        print('Download Synapses')

        adjacency = self.get_adjacency(undirected=True)
        for neuron in self.neurons:  # download relevant synapses
            outgoing_synapses = self.data_access.get_synapses([neuron.id], adjacency[neuron.id])
            incoming_synapses = self.data_access.get_synapses(adjacency[neuron.id], [neuron.id])
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
        for neuron in self.neurons:
            neighbors = [n for n in graph.neighbors(neuron.id)]
            adjacency[neuron.id] = neighbors
        return adjacency

    def get_distances(self): 
        """
        Generates geodesic distance matrix across all nodes in motif
        The graph is directed to preserve presynaptic/postsynaptic distances
        """
        distances = {}
        for neuron in self.neurons: # can be optimized
            neighbors = [n.id for n in self.graph.neighbors(neuron.id)]
            distances[neuron.id] = navis.geodesic_matrix(neuron, from_=neighbors)
            print(distances[neuron.id])
        
        self.distances = distances

