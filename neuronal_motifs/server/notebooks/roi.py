# Import neuprint wrapper by navis
import navis.interfaces.neuprint as neu

MY_NEUPRINT_TOKEN = ""


client = neu.Client('https://neuprint.janelia.org/', dataset='hemibrain:v1.1', token=MY_NEUPRINT_TOKEN)

mb = neu.fetch_roi('PB')


print(neu.fetch_all_rois())

print(mb)
