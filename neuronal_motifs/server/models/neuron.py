import time
from collections import OrderedDict

import navis
import networkx as nx
import numpy as np
import networkit as nk

from numba import jit

from line_profiler_pycharm import profile

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
        dijks = nk.distance.Dijkstra(graph, start_node, end_node)
        dijks.run()
        n = np.asarray(dijks.getPath(end_node))  # compute list of node ids for shortest path between
        # start node and the current end node
        nodes = np.concatenate((nodes, n), axis=0)  # combine np arrays
    uniques = np.unique(nodes)  # remove duplicates
    return uniques.astype(int)  # return node ids as int array


# @jit(nopython=True, parallel=True)
# def compute_distance_to_motif_path(labels, edges, motif_nodes, unlabeled_node_id):
#     """
#     TODO
#     @param labels:
#     @param edges:
#     @param motif_nodes:
#     @param unlabeled_node_id:
#     @param positive_labels:
#     @return:
#     """
#
#     labels[motif_nodes - 1] = 0  # label all motif nodes in the skeleton with 0
#     num_unlabeled_nodes = np.count_nonzero(labels == unlabeled_node_id)
#     label = 1  # specifies node labels, start with distance to motif path is 1
#     while num_unlabeled_nodes > 0:  # repeat until all nodes are labeled
#         labels_copy = np.copy(labels)
#         for edge in edges:  # look at all edges of the neuron skeleton
#             x = edge[0] - 1  # first node index of an edge
#             y = edge[1] - 1  # second node index of an edge
#             if labels[x] >= 0 and labels[y] < 0:  # if x is labeled yet and y isn't, then add current
#                 # label to node
#                 labels_copy[y] = label
#             elif labels[y] >= 0 and labels[x] < 0:  # if y is labeled yet and x isn't, then add current
#                 # label to node
#                 labels_copy[x] = label
#         labels = labels_copy
#         num_unlabeled_nodes = np.count_nonzero(labels == unlabeled_node_id)
#         label = label + 1  # increase node label by one
#     return labels


# #@jit(nopython=True, parallel=True)
# def compute_labels_to_abstraction_center(labels, edges, center_id, unlabeled_node_id):
#     """
#     TODO
#     @param labels:
#     @param edges:
#     @param center_id:
#     @param unlabeled_node_id:
#     @return:
#     """
#     labels = np.asarray(labels)
#     labels[center_id - 1] = -1  # label all motif nodes in the skeleton with 0
#     num_unlabeled_nodes = np.count_nonzero(labels == unlabeled_node_id)
#     label = -2  # specifies node labels, start with distance to motif path is 1
#     while num_unlabeled_nodes > 0:  # repeat until all nodes are labeled
#         labels_copy = np.copy(labels)
#         for edge in edges:  # look at all edges of the neuron skeleton
#             x = edge[0] - 1  # first node index of an edge
#             y = edge[1] - 1  # second node index of an edge
#             if labels[x] < 0 and labels[y] == 0:  # if x is labeled yet and y isn't, then add current
#                 # label to node
#                 labels_copy[y] = label
#             elif labels[y] < 0 and labels[x] == 0:  # if y is labeled yet and x isn't, then add current
#                 # label to node
#                 labels_copy[x] = label
#         labels = labels_copy
#         num_unlabeled_nodes = np.count_nonzero(labels == unlabeled_node_id)
#         label = label - 1  # increase node label by one
#
#     min_value = np.amin(labels)
#     delta = np.absolute(min_value) + np.absolute(-1)
#     idx = np.where(labels < 0)
#     labels[idx] = labels[idx] + delta
#     labels[idx] = labels[idx] * -1
#
#     return labels


class Neuron:
    def __init__(self, id, skeleton=None, mesh=None, synapses=None, skeleton_labels=None, distances=None):
        """
        @param id: body id of the neuron. Acts as a unique identifier
        @param skeleton: stick figure skeleton of the neuron
        @param mesh: surface mesh of a neuron
        @param distances: geodesic distance matrix of nodes coming out of neuron
        """
        self.id = id
        self.skeleton = skeleton
        self.mesh = mesh
        self.distances = None
        self.abstraction_center = None

    def as_json(self):
        """
        Converts Neuron object into a json object
        @return: json object
        """
        swc_object = conversion.treeneuron_to_swc_string(self.skeleton)
        neuron = {
            'id': self.id,
            'mesh': 'TODO',
            'skeleton_swc': swc_object['swc'],
            'abstraction_center': self.compute_abstraction_root(),
            'min_skel_label': self.get_min_skeleton_label(),
            'max_skel_label': self.get_max_skeleton_label()
        }

        return neuron

    def get_max_skeleton_label(self):
        return int(self.skeleton.nodes['abstraction_label'].max())

    def get_min_skeleton_label(self):
        return int(self.skeleton.nodes['abstraction_label'].min())

    def compute_abstraction_root(self, to="position"):
        """
        Computes the abstraction center by averaging over motif synapse locations and snapping it to the neuron skeleton
        @param nodes: pd dataframe of nodes to be considered for root computation
        @param to: if equals "position" returns the position of the abstraction center, if equals "node" returns the pd node series.
        @return: node id of the abstraction center
        """
        nodes = self.skeleton.nodes
        motif_nodes = nodes[nodes['abstraction_label'] <= 0]

        x = int(motif_nodes['x'].mean())
        y = int(motif_nodes['y'].mean())
        z = int(motif_nodes['z'].mean())

        center_id = conversion.get_closest_point(motif_nodes, np.array((x, y, z)))

        center_node = nodes[nodes['node_id'] == center_id]

        if to == "position":
            center_x = int(center_node['x'])
            center_y = int(center_node['y'])
            center_z = int(center_node['z'])
            return [center_x, center_y, center_z]
        elif to == "node":
            return center_node
        else:
            return None

    def get_center(self):
        x = int(self.skeleton.nodes['x'].mean())
        y = int(self.skeleton.nodes['y'].mean())
        z = int(self.skeleton.nodes['z'].mean())
        return [x, y, z]

    def get_soma(self):
        return self.skeleton.soma

    def get_synapses(self):
        return self.synapses

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

    # def set_skeleton_abstractions(self, num_of_levels):
    #     self.skeleton_abstractions = self.compute_abstraction_levels(num_of_levels)

    @profile
    def compute_distance_to_motif_path_optimized(self, graph, motif_synapse_nodes, motif_nodes):
        motif_synapse_node_list = motif_synapse_nodes.tolist()
        distances = np.zeros([graph.numberOfNodes(), len(motif_synapse_node_list)])
        for i in range(0, len(motif_synapse_node_list)):
            dijks = nk.distance.Dijkstra(graph, motif_synapse_node_list[i])
            dijks.run()
            distances[:, i] = np.asarray(dijks.getDistances())
        distances = np.amin(distances, axis=1)
        distances = distances - np.amin(distances)
        distances[motif_nodes] = 0
        return distances.tolist()

    @profile
    def compute_skeleton_labels(self, motif_synapse_nodes):
        """
        Computes a label for each node in the neurons skeleton.
        Label 0: node is on the motif path
        Label > 0: distance of the node to the motif path
        Stores the labels in self.skeleton_label np array
        @param motif_synapse_nodes: skeleton node ids that matching relevant synapses
        """
        motif_synapse_nodes = np.asarray(motif_synapse_nodes)
        graph = nk.nxadapter.nx2nk(navis.neuron2nx(self.skeleton))
        graph = nk.graphtools.toUndirected(graph)
        graph.indexEdges()

        motif_nodes = multiple_shortest_paths(graph, motif_synapse_nodes[0], motif_synapse_nodes[1:])
        # compute the shortest path between all synapse nodes which is equivalent to the motif path
        labels = self.compute_distance_to_motif_path_optimized(graph, motif_synapse_nodes, motif_nodes)
        self.skeleton.nodes['abstraction_label'] = labels
        labels = self.compute_labels_to_abstraction_center_optimized(graph, labels, motif_nodes)

        # labels = compute_labels_to_abstraction_center(labels, self.skeleton.edges, root_id, unlabeled_node_id=0)
        self.skeleton.nodes['abstraction_label'] = labels

    def compute_labels_to_abstraction_center_optimized(self, graph, labels, motif_nodes):
        abstraction_root = self.compute_abstraction_root(to="node")
        root_id = int(abstraction_root['node_id'].item())
        labels = np.asarray(labels)
        for node in motif_nodes:
            mtd = nk.distance.Dijkstra(graph, root_id, False, False, node)
            mtd.run()
            labels[node] = -1 * (mtd.distance(node) + 1)
        min_value = np.amin(labels)
        delta = np.absolute(min_value) + np.absolute(-1)
        idx = np.where(labels < 0)
        labels[idx] = labels[idx] + delta
        labels[idx] = labels[idx] * -1
        return labels

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
        # x = self.synapses['x_post'].to_numpy()
        # y = self.synapses['y_post'].to_numpy()
        # z = self.synapses['z_post'].to_numpy()
        #
        # print(x, ", ", y, ", ", z, "\n")
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

        return list(OrderedDict.fromkeys(nodes))  # remove duplicates

    # def compute_abstraction_levels(self, num_of_levels):
    #     """
    #     Generates [num_of_levels] abstractions of this neuron, by pruning branches of a certain distance to the motif path
    #     @param num_of_levels: number of abstraction levels
    #     @return: list of abstracted TreeNeurons
    #     """
    #     levels = np.linspace(0, 1, num_of_levels, endpoint=True)
    #     results = Parallel(n_jobs=8)(delayed(self.prune_to_motif_path)(levels[i]) for i in range(levels.size))
    #     results = sorted(results, key=lambda x: x[0])  # sort based on abstraction level
    #     return list(map(itemgetter(1), results))  # only return TreeNeuron
    #
    # def prune_to_motif_path(self, factor):
    #     """
    #     Prunes the given skeleton to the motif path
    #     @param factor: float [0, 1]. 0 -> full skeleton is returned. 1 -> only motif path is returned
    #     @return: pruned skeleton
    #     """
    #     node_ids = np.arange(1, self.skeleton_labels.shape[0] + 1)
    #     labels = self.skeleton_labels
    #
    #     max_label = np.max(labels)
    #     threshold = int(max_label * (1.0 - factor))  # convert scale factor to pruning threshold
    #     mask = labels > threshold
    #
    #     return [factor, navis.remove_nodes(self.skeleton, node_ids[mask])]
