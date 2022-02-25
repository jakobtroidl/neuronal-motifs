from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
from utils.authentication import get_access_token

import pandas as pd



def example_hemibrain_motif_search():
    motif = Motif("""
    A -> B
    B -> C
    C -> A
    """)

    instances = search_hemibrain_motif(motif)
    for index, row in instances.iterrows():
        print(row['A'])
        print(row['B'])
        print(row['C'])


# TODO: replace hardcoded token and read from text file
def search_hemibrain_motif(motif):
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token=get_access_token('neuprint'))
    return E.find(motif, limit=2)

def main():
    example_hemibrain_motif_search()


if __name__ == "__main__":
    main()
