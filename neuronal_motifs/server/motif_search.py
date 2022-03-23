from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from dotmotif import Motif
from utils.authentication import get_access_token
import pandas as pd
import json

from services.motifabstraction import *

from services.data_access import *


def search_hemibrain_motif(motif_specs, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1',
                         token=get_access_token('neuprint'))
    motif = Motif(motif_specs)
    results = E.find(motif, limit=lim)
    return results.to_dict('records')
