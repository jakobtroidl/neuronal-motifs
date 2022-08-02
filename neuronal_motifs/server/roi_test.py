# Import neuprint wrapper by navis
import navis.interfaces.neuprint as neu
import navis

from neuronal_motifs.server.utils.authentication import get_access_token

client = neu.Client('https://neuprint.janelia.org/', dataset='hemibrain:v1.1', token=get_access_token('neuprint'))

roi = 'MB(R)'


mesh = client.fetch_roi_mesh(roi)
mb = neu.fetch_roi('MB(R)')

# Make a 3D plot
fig = navis.plot3d(mb)
fig.show()