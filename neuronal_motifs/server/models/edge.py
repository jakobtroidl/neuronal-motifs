import pandas as pd
from line_profiler_pycharm import profile
import networkit as nk


class Edge:
    def __init__(self, start_id, start_graph, default_start_position, end_id, end_graph, default_end_position):
        self.start_neuron_id = start_id
        self.end_neuron_id = end_id
        self.start_skel_graph = start_graph
        self.end_skel_graph = end_graph
        self.default_start_position = default_start_position
        self.default_end_position = default_end_position
        self.abstraction = {'start': {}, 'end': {}}

    def as_json(self):
        edge = {
            'start_neuron_id': self.start_neuron_id,
            'end_neuron_id': self.end_neuron_id,
            'default_start_position': self.default_start_position,
            'default_end_position': self.default_end_position,
            'abstraction': self.abstraction
        }
        return edge

    def set_start_abstraction(self, abstraction):
        self.abstraction['start'] = abstraction

    def set_end_abstraction(self, abstraction):
        self.abstraction['end'] = abstraction

    @profile
    def compute_line_abstractions(self, graph, nodes, start_node_id, conv_node_id):
        djk = nk.distance.Dijkstra(graph, start_node_id, True, True, conv_node_id)
        djk.run()
        path = djk.getPath(conv_node_id)  # djk.getNodesSortedByDistance()  #

        path = map(lambda x: x + 1, path)


        trajectory = nodes[nodes['node_id'].isin(path)]
        x = trajectory['x'].tolist()
        y = trajectory['y'].tolist()
        z = trajectory['z'].tolist()
        pos = list(zip(x, y, z))
        pos = list(map(list, pos))
        labels = trajectory['abstraction_label'].tolist()
        labels = list(map(int, labels))
        return dict(zip(labels, pos))

        # self.start_skel_graph.
        # start_positions = self.add_position(start_node_id, start_graph, start_nodes, 1, self.abstraction['start'])
        # self.abstraction['start'] = start_positions

        # end_graph = self.end_skel_graph.get_graph_nx()
        # end_graph = end_graph.to_undirected()
        # end_nodes = self.end_skel_graph.nodes
        # end_positions = self.add_position(end_node_id, end_graph, end_nodes, 1, self.abstraction['end'])
        # self.abstraction['end'] = end_positions

    # @profile
    # def add_position(self, node_id, graph, nodes, prev_label, positions):
    #     # add this node to the list
    #     node = nodes[nodes['node_id'] == node_id]
    #     label = int(node['abstraction_label'])
    #     if label < prev_label:
    #         x = int(node['x'])
    #         y = int(node['y'])
    #         z = int(node['z'])
    #         positions[label] = [x, y, z]
    #
    #         # trigger new recursion
    #         neighbors = graph.neighbors(node_id)
    #
    #         for neighbor in neighbors:
    #             positions = self.add_position(neighbor, graph, nodes, label, positions)
    #
    #     return positions
