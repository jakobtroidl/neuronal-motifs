from dotmotif import Motif
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor
import pandas as pd
import json


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
    E = NeuPrintExecutor(host='https://neuprint.janelia.org/', dataset='hemibrain:v1.2.1', token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp0cm9pZGxAZy5oYXJ2YXJkLmVkdSIsImxldmVsIjoibm9hdXRoIiwiaW1hZ2UtdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKekJRd3dsa0I3aGYxQS1MVmV0SWJNc28teFNuSDNrV1RFZWRzTi09czk2LWM_c3o9NTA_c3o9NTAiLCJleHAiOjE4MjUzMDAyODF9.FgKH0OlNlA8TrhYY4KG_PpC8tGeu3IldYEvqsmLperE')
    return E.find(motif, limit=2)

def main():
    example_hemibrain_motif_search()


if __name__ == "__main__":
    main()
