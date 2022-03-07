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