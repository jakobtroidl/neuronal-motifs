import navis
import networkx as nx
import numpy as np
import pandas as pd


class Neuron:
    def __init__(self, id, skeleton=None, mesh=None, synapses=None, skeleton_labels=None):
        self.id = id
        self.skeleton = skeleton
        self.mesh = mesh
        self.synapses = synapses
        self.skeleton_label = skeleton_labels

        print(self.skeleton)

    def set_mesh(self, mesh):
        self.mesh = mesh

    def set_skeleton(self, skeleton):
        self.skeleton = skeleton

    def set_synapses(self, synapses):
        self.synapses = synapses

    def compute_skeleton_labels(self, motif_synapse_nodes):
        number_skeleton_nodes = len(self.skeleton.nodes.index)
        node_labels = np.array([-1] * number_skeleton_nodes)
        self.skeleton = navis.heal_skeleton(self.skeleton)
        skeleton_graph = self.skeleton_2_nx_graph(self.skeleton, undirected=True)
        components = nx.number_connected_components(skeleton_graph)
        motif_nodes = self.multiple_shortest_paths(skeleton_graph, motif_synapse_nodes[0], motif_synapse_nodes[1:])
        node_labels[motif_nodes] = 0

        label = 1
        non_labeled_elements = np.count_nonzero(node_labels < 0)
        while non_labeled_elements > 0:
            for edge in self.skeleton.edges:
                x = edge[0] - 1  # node 1 of an
                y = edge[1] - 1
                if node_labels[x] >= 0 and node_labels[y] == -1:
                    node_labels[y] = label
                elif node_labels[y] >= 0 and node_labels[x] == -1:
                    node_labels[x] = label
            non_labeled_elements = np.count_nonzero(node_labels < 0)
            label += 1

        self.skeleton_label = node_labels

    def get_nodes_of_motif_synapses(self):
        """
        computes the nodes of the skeleton that are closest to the synapses that participate in a motif
        @return: list of node indices
        """
        nodes = []
        connectors = self.skeleton.connectors
        for id, synapse in self.synapses.iterrows():
            x_pre = synapse['x_pre']
            y_pre = synapse['y_pre']
            z_pre = synapse['z_pre']

            x_post = synapse['x_post']
            y_post = synapse['y_post']
            z_post = synapse['z_post']

            [connector_id, distance] = self.skeleton.snap([x_pre, y_pre, z_pre], to='connectors')
            node_id = connectors.loc[connector_id, 'node_id']
            nodes.append(node_id)

        return nodes

    def skeleton_2_nx_graph(self, skeleton, undirected=False):
        """
        @param skeleton: Navis TreeNeuron to be converted into a networkx graph
        @param undirected: if true a undirected graph is generated, if false the graph is directed
        @return: networkx graph
        """
        graph = navis.neuron2nx(skeleton)
        if undirected:
            graph = graph.to_undirected()
        return graph

    def shortest_path(self, graph, start_node, end_node):
        """
        @param graph: networkx graph
        @param start_node: node id in the graph to start the shortest path search from
        @param end_node: node id in the graph to end the shortest path search
        @return: list of graph node ids that are part of the shorest path between @start_node and @end_node
        """
        return nx.shortest_path(graph, source=start_node, target=end_node)

    def multiple_shortest_paths(self, graph, start_node, end_node_list):
        nodes = []
        for end_node in end_node_list:
            n = np.array(self.shortest_path(graph, start_node, end_node))
            nodes = np.concatenate((nodes, n), axis=0)
        uniques = np.unique(nodes)  # remove duplicates
        return uniques.astype(int)
