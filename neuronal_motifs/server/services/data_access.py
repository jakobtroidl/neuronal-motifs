import pandas as pd
import networkx as nx
from neuronal_motifs.server.utils.authentication import *
import navis.interfaces.neuprint as neu
import navis
import io
import tempfile
import shutil
from pathlib import Path



import plotly.express as px

client = neu.Client(get_data_server(), dataset=get_data_version(), token=get_access_token('neuprint'))

# lets test our abstraction on a simple motif
# A -> B -> C -> A
# Body IDs:
# A: 1003474104
# B: 5813091420
# C: 1001453586
body_ids = [1003474104, 5813091420, 1001453586]

skeletons = neu.fetch_skeletons(x=body_ids, with_synapses=True, parallel=True)
skeleton = skeletons[0]
connectors = skeleton.connectors
node_id = connectors.loc[connectors.index[0], 'node_id']

synapses = neu.fetch_synapse_connections([1001453586], [1003474104])

x = synapses.loc[synapses.index[0], 'x_post']
y = synapses.loc[synapses.index[0], 'y_post']
z = synapses.loc[synapses.index[0], 'z_post']

for index, row in connectors.iterrows():
    conn_x = row['x']
    conn_y = row['y']
    conn_z = row['z']

    if conn_x == x and conn_y == y and conn_z == z:
        node_id = row['node_id']
        print('Success')

neuron_graph = navis.neuron2nx(skeletons[0])
neuron_graph = neuron_graph.to_undirected()
path = nx.shortest_path(neuron_graph, source=1072, target=697)

nodes = skeleton.nodes
print(nodes)

shortest_path = nodes[nodes['node_id'].isin(path)]

# 697: 21482.00000, 28204.00000, 16440.00000
# 1072: 15914.00000, 31676.00000, 12424.00000


d = {'x': [21482, 15914], 'y': [28204, 31676], 'z': [16440, 12424]}
df = pd.DataFrame(data=d)

# df = px.data.iris()
fp = tempfile.NamedTemporaryFile(suffix='.swc')
skeleton.to_swc(Path(fp.name))
fp.seek(0)
swc_string = fp.read()
fp.close()
#
# print(df)
# fig = skeleton.plot3d(backend='plotly', connectors=False)
# fig.add_trace(px.scatter_3d(df, x='x', y='y', z='z').data[0])
# #fig.add_trace(px.scatter_3d(shortest_path, x='x', y='y', z='z').data[0])
# fig.show()


print('Fetched neuron')
