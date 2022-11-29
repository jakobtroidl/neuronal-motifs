from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor

from utils.authentication import get_data_server, get_data_version
from utils.data_conversion import nodes_and_edges_to_motif_string


def search_hemibrain_motif(motif_specs, lim, token):
    E = NeuPrintExecutor(host=get_data_server(), dataset=get_data_version(),
                         token=token)

    motif_source = nodes_and_edges_to_motif_string(motif_specs)
    motif = Motif(enforce_inequality=True).from_motif(motif_source)
    results = E.find(motif=motif, limit=lim)
    return results.to_dict('records')
