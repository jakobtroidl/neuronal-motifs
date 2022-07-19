from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from services.data_access import *
from services.motifabstraction import *
from utils.data_conversion import nodes_and_edges_to_motif_string


def search_hemibrain_motif(motif_specs, lim):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1',
                         token=get_access_token('neuprint'))

    motif_source = nodes_and_edges_to_motif_string(motif_specs)

    motif = Motif(motif_source)
    results = E.find(motif, limit=lim)
    return results.to_dict('records')


def get_sample_node():
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1',
                         token=get_access_token('neuprint'))
    motif_source = nodes_and_edges_to_motif_string([[], [0]])
    motif = Motif(motif_source)
    results = E.find(motif, limit=1)
    return results.to_dict('records')
