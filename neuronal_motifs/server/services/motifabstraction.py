import navis
import networkx as nx

from neuronal_motifs.server.models.motif import Motif
from neuronal_motifs.server.services.data_access import *


class MotifAbstraction:
    def __init__(self):
        print("Start motif Abstraction")

    def example_motif_data(self):
        """
        Returns neuron body IDs of an example motif.
        Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
        @return: Motif object
        """
        body_ids = [1003474104, 5813091420, 1001453586]
        motif_graph = nx.DiGraph([(1003474104, 5813091420), (5813091420, 1001453586), (1001453586, 1003474104)])
        return Motif(body_ids, motif_graph)

    def prepare_motif_abstraction(self, motif):
        # compute motif path
        self.compute_motif_path(motif)

        # label skeletons based on strahler distance to motif path

        return 0

    def compute_motif_path(self, motif):
        """
        Determines the nodes/edges for each neuron that define the motif path
        """
        motif.compute_motif_paths()




        print("Debug")

        return 0


# lets test our abstraction on a simple motif
# A -> B -> C -> A
# Body IDs:
# A: 1003474104
# B: 5813091420
# C: 1001453586


# skeleton = skeletons[0]
# connectors = skeleton.connectors
# node_id = connectors.loc[connectors.index[0], 'node_id']
#
# synapses = neu.fetch_synapse_connections([1001453586], [1003474104])
#
# x = synapses.loc[synapses.index[0], 'x_post']
# y = synapses.loc[synapses.index[0], 'y_post']
# z = synapses.loc[synapses.index[0], 'z_post']
#
# for index, row in connectors.iterrows():
#     conn_x = row['x']
#     conn_y = row['y']
#     conn_z = row['z']
#
#     if conn_x == x and conn_y == y and conn_z == z:
#         node_id = row['node_id']
#         print('Success')
#
# neuron_graph = navis.neuron2nx(skeletons[0])
# neuron_graph = neuron_graph.to_undirected()
# path = nx.shortest_path(neuron_graph, source=1072, target=697)
#
# nodes = skeleton.nodes
# print(nodes)
#
# shortest_path = nodes[nodes['node_id'].isin(path)]
#
# # 697: 21482.00000, 28204.00000, 16440.00000
# # 1072: 15914.00000, 31676.00000, 12424.00000
#
#
# d = {'x': [21482, 15914], 'y': [28204, 31676], 'z': [16440, 12424]}
# df = pd.DataFrame(data=d)
#
# # df = px.data.iris()
#
# print(df)
# fig = skeleton.plot3d(backend='plotly', connectors=False)
# fig.add_trace(px.scatter_3d(df, x='x', y='y', z='z').data[0])
# fig.add_trace(px.scatter_3d(shortest_path, x='x', y='y', z='z').data[0])
# fig.show()
#
# print('Fetched neuron')
