from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor

MY_NEUPRINT_TOKEN = ""

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
