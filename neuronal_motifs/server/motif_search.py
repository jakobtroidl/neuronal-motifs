from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd

from services.motifabstraction import *

from services.data_access import *

def search_hemibrain_motif(body_id, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

    motif = Motif("""
    A -> B
    B -> C
    C -> A
    """)

    results = E.find(body_id, limit=lim)

    return results
