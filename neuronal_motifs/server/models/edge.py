import networkit as nk


def compute_line_abstractions(graph, nodes, start_node_id, conv_node_id):
    djk = nk.distance.Dijkstra(graph, start_node_id, True, True, conv_node_id)
    djk.run()
    path = djk.getPath(conv_node_id)

    path = map(lambda x: x + 1, path)

    trajectory = nodes[nodes['node_id'].isin(path)]
    x = trajectory['x'].tolist()
    y = trajectory['y'].tolist()
    z = trajectory['z'].tolist()
    pos = list(zip(x, y, z))
    pos = list(map(list, pos))
    labels = trajectory['abstraction_label'].tolist()
    labels = list(map(int, labels))  # convert labels to int
    return dict(zip(labels, pos))


class NodeLink3DEdge:
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
