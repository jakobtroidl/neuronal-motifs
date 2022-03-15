import json

import navis
import networkx as nx
import numpy as np

import pandas as pd

import plotly
import plotly.express as px

from neuronal_motifs.server.utils import data_conversion as conversion


def skeleton_2_nx_graph(skeleton, undirected=False):
    """
    @param skeleton: Navis TreeNeuron to be converted into a networkx graph
    @param undirected: if true a undirected graph is generated, if false the graph is directed
    @return: networkx graph
    """
    graph = navis.neuron2nx(skeleton)  # convert skeleton to networkx graph
    if undirected:  # make graph undirected if specified
        graph = graph.to_undirected()
    return graph  # return networkx graph


def shortest_path(graph, start_node, end_node):
    """
    @param graph: networkx graph
    @param start_node: node id in the graph to start the shortest path search from
    @param end_node: node id in the graph to end the shortest path search
    @return: list of graph node ids that are part of the shorest path between @start_node and @end_node
    """
    return nx.shortest_path(graph, source=start_node, target=end_node)


def multiple_shortest_paths(graph, start_node, end_node_list):
    """
    Returns a list of all nodes that are on the shortest paths between a start node and a list of end nodes
    @param graph: graph to compute the shortest paths on
    @param start_node: index of the start node of the shortest paths
    @param end_node_list: list indices where the shortest path should end
    @return: a list of all graph nodes without duplicates
    """
    nodes = []
    for end_node in end_node_list:  # iterate over all end nodes
        n = np.array(shortest_path(graph, start_node, end_node))  # compute list of node ids for shortest path between
        # start node and the current end node
        nodes = np.concatenate((nodes, n), axis=0)  # combine np arrays
    uniques = np.unique(nodes)  # remove duplicates
    return uniques.astype(int)  # return node ids as int array


class Neuron:
    def __init__(self, id, skeleton=None, mesh=None, synapses=None, skeleton_labels=None):
        """
        @param id: body id of the neuron. Acts as a unique identifier
        @param skeleton: stick figure skeleton of the neuron
        @param mesh: surface mesh of a neuron
        @param synapses: selected set synapse that connect to other neurons
        @param skeleton_labels: labels of skeleton nodes that specify the distance of the node to a motif path
        """
        self.id = id
        self.skeleton = skeleton
        self.mesh = mesh
        self.synapses = synapses
        self.skeleton_labels = skeleton_labels

    def as_json(self):
        """
        Converts Neuron object into a json object
        @return: json object
        """
        swc_object = conversion.neuron_to_swc_string(self.skeleton)
        syn_export = conversion.synapse_array_to_object(self.synapses)

        neuron = {
            'id': self.id,
            'mesh': 'TODO',
            'synapses': syn_export,
            'skeleton_swc': swc_object['swc'],
            'node_map': swc_object['map'],
            'skeleton_labels': self.skeleton_labels
        }

        return neuron

    def set_mesh(self, mesh):
        """
        @param mesh: sets mesh data to neuron object
        """
        self.mesh = mesh

    def set_skeleton(self, skeleton):
        """
        @param skeleton: sets skeleton data to neuron object
        """
        self.skeleton = skeleton

    def set_synapses(self, synapses):
        """
        @param synapses: set synapse data to neuron object
        """
        self.synapses = synapses

    def compute_skeleton_labels(self, motif_synapse_nodes):
        """
        Computes a label for each node in the neurons skeleton.
        Label 0: node is on the motif path
        Label > 0: distance of the node to the motif path
        Stores the labels in self.skeleton_label np array
        @param motif_synapse_nodes: skeleton node ids that matching the synapses forming a motif
        """

        # TODO DEBUG Jakob remove later
        neuron_id = -1
        if self.id == 5813091420:
            neuron_id = -2
        elif self.id == 1001453586:
            neuron_id = - 3

        self.skeleton = navis.heal_skeleton(self.skeleton)  # heal to skeleton such that all components are connected
        number_skeleton_nodes = self.skeleton.nodes['node_id'].max()  # get the number of nodes of the neuron skeleton
        motif_synapse_nodes = np.asarray(motif_synapse_nodes)

        nodes = range(1, number_skeleton_nodes + 1, 1)  # list of node ids
        start_labels = [neuron_id] * number_skeleton_nodes  # labels indicating that node has node been labeled yet (
        # neuron_id)
        labels = dict(zip(nodes, start_labels))
        skeleton_graph = skeleton_2_nx_graph(self.skeleton, undirected=True)  # convert skeleton to an
        # undirected networkx graph
        motif_nodes = multiple_shortest_paths(skeleton_graph, motif_synapse_nodes[0], motif_synapse_nodes[1:])
        # compute the shortest path between all synapse nodes which is equivalent to the motif path

        for node_id in motif_nodes:  # TODO optimize
            labels[node_id] = 0  # label all motif nodes in the skeleton with 0
        for node_id in motif_synapse_nodes:
            labels[node_id] = 1  # nodes corresponding to synapses are now labeled with 1

        num_unlabeled_nodes = len([labels for l in labels.values() if l < 0])
        label = 2  # specifies node labels, start with distance to motif path is 1
        while num_unlabeled_nodes > 0:  # repeat until all nodes are labeled
            for edge in self.skeleton.edges:  # look at all edges of the neuron skeleton
                x = edge[0]  # first node index of an edge
                y = edge[1]  # second node index of an edge
                if labels[x] >= 0 and labels[y] < 0:  # if x is labeled yet and x isn't, then add current
                    # label to node
                    labels[y] = label
                elif labels[y] >= 0 and labels[x] < 0:  # if y is labeled yet and x isn't, then add current
                    # label to node
                    labels[x] = label
            num_unlabeled_nodes = len([labels for l in labels.values() if l < 0])
            label += 1  # increase node label by one
        self.skeleton_labels = labels  # add labeled nodes to the neuron object

        # DEBUG simon
        # Add Categories
        # self.skeleton.nodes['type'] = self.skeleton.nodes['type'].cat.add_categories(['in_path', 'not_in_path'])
        # self.skeleton.prune_by_strahler(to_prune=-1, inplace=True)
        # path_labels = np.argwhere(node_labels == 0).flatten()
        # x = navis.cut_skeleton(self.skeleton, path_labels, ret='proximal')[0]
        # label_categories = ['in_path' if label == 0 else 'not_in_path' for label in self.skeleton_label]

    def get_closest_connector(self, x, y, z):
        """
        Gets the skeleton node id of the closest connector (synapse) to a given position
        @param x: x coordinate of position
        @param y: y coordinate of position
        @param z: z coordinate of position
        @return: skeleton node ID closest to position
        """
        [connector_id, distance] = self.skeleton.snap([x, y, z], to='connectors')  # snap the current
        # synapse location to the closest connector
        connectors = self.skeleton.connectors  # get all connectors of the skeleton
        conn = connectors.iloc[connector_id]
        return conn['node_id']  # get skeleton node id from connector id

    def get_nodes_of_motif_synapses(self):
        """
        computes the nodes of the skeleton that are closest to the synapses that participate in a motif
        @return: list of node indices
        """
        # JAKOB Debug visualization
        # x = self.synapses['x_pre'].to_numpy()
        # y = self.synapses['y_pre'].to_numpy()
        # z = self.synapses['z_pre'].to_numpy()
        #
        # d = {'x': x, 'y': y, 'z': z}
        # df = pd.DataFrame(data=d)
        #
        # fig = self.skeleton.plot3d(backend='plotly', connectors=True)
        # fig.add_trace(px.scatter_3d(df, x='x', y='y', z='z').data[0])
        # # fig.add_trace(px.scatter_3d(shortest_path, x='x', y='y', z='z').data[0])
        # fig.show()

        nodes = []  # node ids close to synapses
        for id, synapse in self.synapses.iterrows():  # iterate over all synapses that this neuron has with neurons
            if self.id == synapse.loc['bodyId_pre']:
                x_pre = synapse['x_pre']  # x location pre synapse
                y_pre = synapse['y_pre']  # y location pre synapse
                z_pre = synapse['z_pre']  # z location pre synapse

                node_id = self.get_closest_connector(x_pre, y_pre, z_pre)
                nodes.append(node_id)

            elif self.id == synapse.loc['bodyId_post']:
                x_post = synapse['x_post']
                y_post = synapse['y_post']
                z_post = synapse['z_post']

                node_id = self.get_closest_connector(x_post, y_post, z_post)
                nodes.append(node_id)

        return nodes

    def prune_to_motif_path(self, factor):
        """
        Prunes the given skeleton to the motif path
        @param factor: float [0, 1]. 0 -> full skeleton is returned. 1 -> only motif path is returned
        @return: pruned skeleton
        """
        skel = self.skeleton
        labels = self.skeleton_labels
        max_label = float(max(list(labels.values())))
        threshold = int(max_label * (1.0 - factor))  # convert scale factor to pruning threshold

        nodes_to_remove = []
        for index, row in skel.nodes.iterrows():
            node_id = row['node_id']
            if labels[row['node_id']] > threshold:
                nodes_to_remove.append(node_id)
        return navis.remove_nodes(skel, nodes_to_remove)
