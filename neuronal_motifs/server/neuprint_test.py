# from utils.authentication import get_access_token
# from neuprint import Client
#
# c = Client('neuprint.janelia.org', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))
# c.fetch_version()
#
# ## This query will return all neurons in the ROI ‘AB’
# ## that have greater than 10 pre-synaptic sites.
# ## Results are ordered by total synaptic sites (pre+post).
# q = """\
#     MATCH (n :Neuron {`AB(R)`: true})
#     WHERE n.pre > 10
#     RETURN n.bodyId AS bodyId, n.type as type, n.instance AS instance, n.pre AS numpre, n.post AS numpost
#     ORDER BY n.pre + n.post DESC
# """
#
# results = c.fetch_custom(q)
#
# print(f"Found {len(results)} results")
#
# results.head()
#
# print('done')

import pickle as pkl

import plotly.graph_objects as go

import numpy as np

# relative path to motif-size-003.pickle
path3 = "cache/motifcounts/withoutedgecolor/motif-size-00{}.pickle".format(3)
# load motif counts from pickle
with open(path3, 'rb') as f:
    motif_counts_3 = pkl.load(f)

# relative path to motif-size-003.pickle
path4 = "cache/motifcounts/withoutedgecolor/motif-size-00{}.pickle".format(4)
# load motif counts from pickle
with open(path4, 'rb') as f:
    motif_counts_4 = pkl.load(f)

# counts_3_list = motif_counts_3.values()
# counts_4_list = motif_counts_4.values()

# get values from dict motif_counts_3
counts_3_list = [motif_counts_3[key] for key in motif_counts_3]
# get values from dict motif_counts_4
counts_4_list = [motif_counts_4[key] for key in motif_counts_4]

# normalize elements in counts_3_list
counts_3_list = [x / sum(counts_3_list) for x in counts_3_list]
# normalize elements in counts_4_list
counts_4_list = [x / sum(counts_4_list) for x in counts_4_list]


fig = go.Figure(data=[go.Histogram(x=counts_3_list, name='3-node motifs', nbinsx=1000)])
fig.update_xaxes(type="log")
fig.show()


fig = go.Figure(data=[go.Histogram(x=counts_4_list, name='4-node motifs', nbinsx=1000)])
fig.update_xaxes(type="log")
fig.show()
