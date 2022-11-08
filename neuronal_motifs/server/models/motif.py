import time

import navis
import pandas as pd
import numpy as np
from networkx.readwrite import json_graph

from models.edge import NodeLink3DEdge, compute_line_abstractions
from utils.data_conversion import synapse_array_to_object, edges_to_json


class MyMotif:
    def __init__(self, neurons=None, graph=None, synapses=None, edges=None):
        self.graph = graph  # networkx graph of the motif
        self.neurons = neurons
        self.synapses = synapses
        self.nodeLinkEdges = edges
        self.compute_motif_synapses()
        self.syn_clusters = None

    def as_json(self):
        """
        Export the motif, including skeleton labels as a json string
        @return: json string
        """

        neuron_json = []
        for neuron in self.neurons:
            neuron_json.append(neuron.as_json())

        syn_export = synapse_array_to_object(self.synapses)
        edges_export = edges_to_json(self.nodeLinkEdges)

        motif = {
            'graph': json_graph.node_link_data(self.graph),
            'neurons': neuron_json,
            'synapses': syn_export,
            'edges': edges_export,
            'syn_clusters': self.syn_clusters
        }

        return motif

    def compute_synapse_trajectory(self):
        edges = []
        print('Compute synapse trajectories...')
        t = time.time()

        for idx, syn in self.synapses.iterrows():
            pre_id = syn['bodyId_pre']
            post_id = syn['bodyId_post']
            if post_id in self.graph.neighbors(pre_id):
                pre_x = syn['x_pre']
                pre_y = syn['y_pre']
                pre_z = syn['z_pre']

                pre_neuron = self.get_neuron(pre_id)
                pre_node = pre_neuron.get_closest_connector(pre_x, pre_y, pre_z)

                post_x = syn['x_post']
                post_y = syn['y_post']
                post_z = syn['z_post']

                post_neuron = self.get_neuron(post_id)
                post_node = post_neuron.get_closest_connector(post_x, post_y, post_z)

                edge = NodeLink3DEdge(pre_neuron.id, pre_neuron.skeleton_nk_graph, [pre_x, pre_y, pre_z],
                                      post_neuron.id, post_neuron.skeleton_nk_graph, [post_x, post_y, post_z])

                start_abs = compute_line_abstractions(edge.start_skel_graph, pre_neuron.skeleton.nodes, pre_node,
                                                      pre_neuron.abstraction_center)
                edge.set_start_abstraction(start_abs)

                end_abs = compute_line_abstractions(edge.end_skel_graph, post_neuron.skeleton.nodes, post_node,
                                                    post_neuron.abstraction_center)
                edge.set_end_abstraction(end_abs)

                edges.append(edge)
        self.nodeLinkEdges = edges
        print("Done. Took {} sec".format(time.time() - t))

    def compute_motif_paths(self, prev_labels):
        """
        For each neuron in the motif, matches synapses with the closest skeleton connector,
        finds the motif path and labels all neuron skeletons based on distance to motif path
        @return:
        """
        for neuron in self.neurons:
            synapse_nodes = neuron.get_nodes_of_motif_synapses()
            print("Compute compute node labels for skeleton {} ...".format(neuron.id))
            t = time.time()
            my_labels = None
            if str(neuron.id) in prev_labels:
                my_labels = prev_labels[str(neuron.id)]
            neuron.compute_skeleton_labels(synapse_nodes, my_labels)
            print("Done. Took {} sec".format(time.time() - t))

    def compute_motif_synapses(self):
        """
        Relevant synapses for the neurons in that given motif and safes them in each neuron object
        """
        all_synapses = []
        adjacency = self.get_adjacency(undirected=False)
        for neuron in self.neurons:  # download relevant synapses
            # find outgoing synapses of neuron
            outgoing_synapses = neuron.outgoing_synapses.loc[
                neuron.outgoing_synapses['bodyId_post'].isin(adjacency[neuron.id])]
            # find incoming synapses of neuron
            incoming_ids = []  # for each neuron get ids of neurons that input to it
            for id, adj in adjacency.items():  # iterate over all adjacency of other neurons
                if neuron.id in adj:
                    incoming_ids.append(id)
            incoming_synapses = neuron.incoming_synapses.loc[neuron.incoming_synapses['bodyId_pre'].isin(incoming_ids)]
            synapses = pd.concat([outgoing_synapses, incoming_synapses], ignore_index=True, sort=False)
            all_synapses.append(synapses)
            neuron.set_motif_synapses(synapses)
        self.synapses = pd.concat(all_synapses)

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
        """
        Returns the neuron object with the given id
        @param id: int
        @return: neuron object
        """
        out = None
        for neuron in self.neurons:
            if neuron.id == id:
                out = neuron
        if out is None:
            out = self.data_access.get_neurons([id])[0]
        return out

    def syn_soma_distance(self, neuron_id, syn_pos):
        """
        Computes the geodesic distance between a synapse and the soma of a neuron
        @param neuron_id: int
        @param syn_pos: 3D position of synapse
        @return: geodesic distance between synapse and soma
        """
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

    def cluster_synapse_group(self, group):
        """
        Hierarchical clustering of synapses. @n_clusters is the number of clusters to be generated
        @return: list of cluster labels for each cluster hierarchy
        """
        from sklearn.cluster import AgglomerativeClustering

        locations = group[['x_pre', 'y_pre', 'z_pre']].to_numpy()
        n_clusters = min(int(len(locations) / 3), 10)

        clusters_per_synapse = {int(idx): [] for idx in range(0, len(locations))}
        synapses_per_cluster = []

        for i in range(1, n_clusters):
            model = AgglomerativeClustering(n_clusters=i)
            y = model.fit_predict(locations)

            # determine which clusters each synapse belongs to
            for j in range(0, y.size):
                clusters_per_synapse[j].append(int(y[j]))

            # for each cluster, which synapses belong to it
            cluster_indices = {}
            for j in np.unique(y):
                indices = np.where(y == j)[0]
                cluster_indices[int(j)] = indices.tolist()
            synapses_per_cluster.append(cluster_indices)

        return synapses_per_cluster, clusters_per_synapse

    def cluster_synapses(self):
        """
        Clusters synapses for each motif neuron based on their spatial location
        @return: hierarchy of synapse clusters per group
        """
        # group synapses based on their pre and post synaptic neurons
        groups = self.synapses.groupby(['bodyId_pre', 'bodyId_post'])
        results = []
        for ((pre_id, post_id), data) in groups:
            pre_loc = data[['x_pre', 'y_pre', 'z_pre']].to_numpy()
            post_loc = data[['x_post', 'y_post', 'z_post']].to_numpy()
            synapses_per_cluster, clusters_per_synapse = self.cluster_synapse_group(data)

            results.append({"pre": int(pre_id), "post": int(post_id), "synapses_per_cluster": synapses_per_cluster,
                            "clusters_per_synapse": clusters_per_synapse, "pre_loc": pre_loc.tolist(),
                            "post_loc": post_loc.tolist()})
        self.syn_clusters = results
