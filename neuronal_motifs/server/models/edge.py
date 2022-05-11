import pandas as pd


class Edge:
    def __init__(self, start_skeleton, default_start_position, end_skeleton, default_end_position):
        self.start_neuron_id = start_skeleton.id
        self.end_neuron_id = end_skeleton.id
        self.start_skeleton = start_skeleton
        self.end_skeleton = end_skeleton
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


    def compute_line_abstractions(self, line_start_node_id, line_end_node_id):
        start_graph = self.start_skeleton.get_graph_nx()
        start_nodes = self.start_skeleton.nodes
        start_positions = self.add_position(line_start_node_id, start_graph, start_nodes, 1, self.abstraction['start'])
        self.abstraction['start'] = start_positions

        end_graph = self.end_skeleton.get_graph_nx()
        end_nodes = self.end_skeleton.nodes
        end_positions = self.add_position(line_end_node_id, end_graph, end_nodes, 1, self.abstraction['end'])
        self.abstraction['end'] = end_positions

    def add_position(self, node_id, graph, nodes, prev_label, positions):
        # add this node to the list
        node = nodes[nodes['node_id'] == node_id]
        label = int(node['abstraction_label'])
        if label < prev_label:
            x = int(node['x'])
            y = int(node['y'])
            z = int(node['z'])
            positions[label] = [x, y, z]

            # trigger new recursion
            neighbors = graph.neighbors(node_id)

            for neighbor in neighbors:
                positions = self.add_position(neighbor, graph, nodes, label, positions)

        return positions
