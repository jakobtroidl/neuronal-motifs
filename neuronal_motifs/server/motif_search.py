from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.data_conversion import adjacency_list_to_motif_string
import pandas as pd
import json

from services.motifabstraction import *

from services.data_access import *


def search_hemibrain_motif(motif_specs, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1',
                         token=get_access_token('neuprint'))

    motif_source = adjacency_list_to_motif_string(json.loads(motif_specs))
    motif = Motif(motif_source)
    results = E.find(motif, limit=lim)
    return results.to_dict('records')
