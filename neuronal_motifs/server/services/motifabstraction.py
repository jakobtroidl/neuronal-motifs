import navis
import networkx as nx

from neuronal_motifs.server.models.motif import Motif
from neuronal_motifs.server.services.data_access import *


class MotifAbstraction:
    def __init__(self):
        print("Start motif Abstraction")

    def example_motif_data(self):
        """
        Returns neuron body IDs of an example motif.
        Example motif: A -> B -> C -> A, Example neurons: [1003474104, 5813091420, 1001453586]
        @return: Motif object
        """
        body_ids = [1003474104, 5813091420, 1001453586]
        motif_graph = nx.DiGraph([(1003474104, 5813091420), (5813091420, 1001453586), (1001453586, 1003474104)])
        return Motif(body_ids, motif_graph)

    def prepare_motif_abstraction(self, motif):
        # compute motif path
        self.compute_motif_path(motif)

        # label skeletons based on strahler distance to motif path

        return 0

    def compute_motif_path(self, motif):
        """
        Determines the nodes/edges for each neuron that define the motif path
        """
        motif.compute_motif_paths()




        print("Debug")

        return 0

