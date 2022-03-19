from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd
import json

from services.motifabstraction import *

from services.data_access import *

def search_hemibrain_motif(motif_specs, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

    # motif = Motif("""
    # A -> B
    # B -> C
    # C -> A
    # """)
    motif_specs = motif_specs.replace(" ", "\n")
    motif = Motif(motif_specs)
    results = E.find(motif, limit=lim)

    body_ids = [results["A"][0]["bodyId"], results["B"][0]["bodyId"], results["C"][0]["bodyId"]]
    

    return body_ids
