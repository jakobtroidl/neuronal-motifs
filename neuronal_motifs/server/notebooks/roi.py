# Import neuprint wrapper by navis
import navis.interfaces.neuprint as neu

MY_NEUPRINT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp0cm9pZGxAZy5oYXJ2YXJkLmVkdSIsImxldmVsIjoibm9hdXRoIiwiaW1hZ2UtdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FGZFp1Y3JlbXRDTV9SbU9ISThRSUtMZnBEclZCMTdVVGs0SlprWURLTzhCPXM5Ni1jP3N6PTUwP3N6PTUwIiwiZXhwIjoxODM5NjM4NjA4fQ.j8c_cx0L--QHb1Fg1UAZKddK5sT8l89RVrKHpgIqfZM"


client = neu.Client('https://neuprint.janelia.org/', dataset='hemibrain:v1.1', token=MY_NEUPRINT_TOKEN)

mb = neu.fetch_roi('PB')


print(neu.fetch_all_rois())

print(mb)
