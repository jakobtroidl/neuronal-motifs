from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor

MY_NEUPRINT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp0cm9pZGxAZy5oYXJ2YXJkLmVkdSIsImxldmVsIjoibm9hdXRoIiwiaW1hZ2UtdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FGZFp1Y3JlbXRDTV9SbU9ISThRSUtMZnBEclZCMTdVVGs0SlprWURLTzhCPXM5Ni1jP3N6PTUwP3N6PTUwIiwiZXhwIjoxODM5NjM4NjA4fQ.j8c_cx0L--QHb1Fg1UAZKddK5sT8l89RVrKHpgIqfZM"

E = NeuPrintExecutor(host="neuprint.janelia.org", token=MY_NEUPRINT_TOKEN, dataset="hemibrain:v1.2.1")

# Build your own motif here!

query = """
    A -> C ["EB.pre" > 1, "LX(R).pre" > 1] 
    B -> A ["EB.pre" > 1] 
    C -> B ["EB.pre" > 1] 
    A -> B ["LX(R).pre" > 1] 
    A.status = "Traced" 
    A['type'] = "ExR1"
    B['type'] != "ExR1"
    B['type'] != "ExR2"
    C['type'] != "ExR1"
    C['type'] != "ExR2"
    B.status = "Traced" 
    C.status = "Traced" 
"""

motif = Motif(query)

results = E.find(motif, limit=5)
print(f"{len(results)} results.")
