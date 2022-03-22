from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd
import json

from services.motifabstraction import *

from services.data_access import *

def search_hemibrain_motif(motif_specs, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

    motif_specs = motif_specs.replace(" ", "\n")
    motif = Motif(motif_specs)
    results = E.find(motif, limit=lim)
    df = pd.DataFrame(results)
    motif_tuples = list(df.itertuples(index=False))

    body_ids = []
    for i in range(len(motif_tuples)):
        ids = []
        for j in range(len(motif_tuples[i])):
            ids.append(motif_tuples[i][j]["bodyId"])
        body_ids.append(ids)
    

    return body_ids
