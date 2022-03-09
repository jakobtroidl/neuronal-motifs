from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from utils.authentication import get_access_token
import pandas as pd

from services.motifabstraction import *

from services.data_access import *


# def example_hemibrain_motif_search():
#     motif = Motif("""
#     A -> B
#     B -> C
#     C -> A
#     """)
#
#     instances = search_hemibrain_motif(motif)
#     for index, row in instances.iterrows():
#         print(row['A'])
#         print(row['B'])
#         print(row['C'])
#
#
# TODO: replace hardcoded token and read from text file
def search_hemibrain_motif(motif):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))
    return E.find(motif, limit=2) # returns list of ids, specify # motifs to have to print
#
# def main():
#     motif_abstraction = MotifAbstraction()
#     example_motif = motif_abstraction.example_motif_data()
#     motif_abstraction.prepare_motif_abstraction(example_motif)
#
#
#
# if __name__ == "__main__":
#     main()
