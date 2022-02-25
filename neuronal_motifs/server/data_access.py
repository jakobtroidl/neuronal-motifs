import navis.interfaces.neuprint as neu

client = neu.Client('https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1')

neuron = neu.fetch_mesh_neuron(x=200326126, lod=3)

print('Fetched neuron')