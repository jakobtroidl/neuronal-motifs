# from neuprint import Client
#
# c = Client('neuprint.janelia.org', dataset='hemibrain:v1.2.1', token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp0cm9pZGxAZy5oYXJ2YXJkLmVkdSIsImxldmVsIjoibm9hdXRoIiwiaW1hZ2UtdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKekJRd3dsa0I3aGYxQS1MVmV0SWJNc28teFNuSDNrV1RFZWRzTi09czk2LWM_c3o9NTA_c3o9NTAiLCJleHAiOjE4MjI4NzkwMjV9.YUixoaXEYSK32VataS9ETubbQPAsFJZo88puV9Fa2fc')
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