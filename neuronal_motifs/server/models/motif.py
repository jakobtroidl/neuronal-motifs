import json
import time
import navis

import pandas as pd
from networkx.readwrite import json_graph
from line_profiler_pycharm import profile

from neuronal_motifs.server.services.data_access import DataAccess
from neuronal_motifs.server.utils import data_conversion as conversion


class MyMotif:
    def __init__(self, neuron_ids=None, graph=None, synapses=None):
        self.data_access = DataAccess()
        self.graph = graph  # networkx graph of the motif
        self.neurons = self.data_access.get_neurons(neuron_ids)
        self.synapses = synapses
        self.download_synapses()

    def as_json(self):
        """
        Export the motif, including skeleton labels as a json string
        @return: json string
        """

        neuron_json = []
        for neuron in self.neurons:
            neuron_json.append(neuron.as_json())

        syn_export = conversion.synapse_array_to_object(self.synapses)

        motif = {
            'graph': json_graph.node_link_data(self.graph),
            'neurons': neuron_json,
            'synapses': syn_export
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
            synapse_nodes = neuron.get_nodes_of_motif_synapses()
            # neuron.abstraction_center = neuron.compute_abstraction_root(synapse_nodes)
            print("Compute compute node labels for skeleton {} ...".format(neuron.id))
            t = time.time()
            neuron.compute_skeleton_labels(synapse_nodes)
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
            motif_path = neuron.skeleton_abstractions[-1]
            neuron.compute_abstraction_root(motif_path)

    def download_synapses(self):
        """
        Downloads all relevant synapses for the neurons in that given motif and safes them in each neuron object
        """
        print('Download Synapses')

        all_synapses = []
        adjacency = self.get_adjacency(undirected=True)
        for neuron in self.neurons:  # download relevant synapses
            outgoing_synapses = self.data_access.get_synapses([neuron.id], adjacency[neuron.id])
            incoming_synapses = self.data_access.get_synapses(adjacency[neuron.id], [neuron.id])
            synapses = pd.concat([outgoing_synapses, incoming_synapses], ignore_index=True, sort=False)
            all_synapses.append(synapses)
            neuron.set_synapses(synapses)
        foo = pd.concat(all_synapses)
        self.synapses = foo

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

    def get_neuron(self, id):
        for neuron in self.neurons:
            if neuron.id == id:
                return neuron
        return None

    def syn_soma_distance(self, neuron_id, syn_pos):
        neuron = self.get_neuron(neuron_id)
        syn_node, snap_distance = neuron.skeleton.snap(syn_pos)
        soma = neuron.get_soma()
        if soma is not None:
            distance = navis.dist_between(neuron.skeleton, soma, syn_node)
            return round(distance)
        else:
            return 0

    def compute_synapse_soma_distances(self):
        """
        Generates geodesic distance matrix across all nodes in motif
        The graph is directed to preserve presynaptic/postsynaptic distances
        """
        print('Compute synapse soma distances...')
        t = time.time()
        pre_synaptic_soma_distances = []
        post_synaptic_soma_distances = []
        for index, synapse in self.synapses.iterrows():  # can be optimized
            pre_distance = self.syn_soma_distance(synapse['bodyId_pre'],
                                                  [synapse['x_pre'], synapse['y_pre'], synapse['z_pre']])
            pre_synaptic_soma_distances.append(pre_distance)

            post_distance = self.syn_soma_distance(synapse['bodyId_post'],
                                                   [synapse['x_post'], synapse['y_post'], synapse['z_post']])
            post_synaptic_soma_distances.append(post_distance)

        self.synapses['soma_distance_pre'] = pre_synaptic_soma_distances
        self.synapses['soma_distance_post'] = post_synaptic_soma_distances
        print('Done. Took {} sec'.format(time.time() - t))
