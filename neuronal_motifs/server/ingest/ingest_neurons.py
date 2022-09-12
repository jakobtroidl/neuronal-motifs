import numpy as np
import neuronal_motifs.server.services.data_access as data_access
from pathlib import Path
def ingest_hemibrain(neurons, id_position, token):
    """
    Ingests neurons from a file
    """
    print("Ingested neurons ...")
    # open file from neurons argument
    ids = get_neuron_ids(neurons, id_position)

    if len(ids) > 0:
        access = data_access.DataAccess(token)
        access.ingest_neurons(ids)


def get_neuron_ids(neurons, id_position):
    neuron_ids = []
    with open(neurons, 'r') as f:
        # read file
        lines = f.readlines()
        # close file
        f.close()
        # iterate over lines
        for line in lines:
            # split line
            line = line.split(',')
            # get neuron id
            if line[0].isnumeric():
                neuron_id = int(line[id_position])
                neuron_ids.append(neuron_id)
    return np.asarray(neuron_ids)


if __name__ == '__main__':

    path = Path(__file__).parent / "cache" / "data" / "meta"
    path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist
    filepath = path / "traced-neurons.csv"
    token = "<YOUR NEUPRINT TOKEN>"
    index = 0
    ingest_hemibrain(filepath, index, token)
