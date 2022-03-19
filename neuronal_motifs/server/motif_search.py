from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd
import json

from services.motifabstraction import *

from services.data_access import *

def search_hemibrain_motif(body_id, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))

    motif = Motif("""
    A -> B
    B -> C
    C -> A
    """)

    results = E.find(motif, limit=lim)

    df = pd.DataFrame(results)

    results_list = df.values.tolist()
    ret_val = 0

    body_ids = [results["A"][0]["bodyId"], results["B"][0]["bodyId"], results["C"][0]["bodyId"]]
    for i in range(len(body_ids)):
        if body_id == body_ids[i]:
            ret_val += 1
    
    #instances = [results["A"][0]["instance"], results["B"][0]["instance"], results["C"][0]["instance"]]

    return "found " + str(ret_val) + " instances of the neuron with body id " + str(body_id)
