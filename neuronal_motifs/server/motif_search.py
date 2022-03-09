from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd

from services.motifabstraction import *

from services.data_access import *

E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

motif = Motif("""
A -> B
B -> C
C -> A
""")


results = E.find(motif, limit=2)

print(results)
