from lib2to3.pgen2 import token
from utils.authentication import get_access_token
import navis.interfaces.neuprint as neu

client = neu.Client('https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

neuron = neu.fetch_mesh_neuron(x=200326126, lod=3)

print('Fetched neuron')