"""
CLI for ingesting neurons'
"""

import click
import numpy as np

from flask.cli import AppGroup
import neuronal_motifs.server.services.data_access as data_access
ingest_cli = AppGroup("ingest")


@ingest_cli.command("ingest_neurons")
@click.argument("--neurons", type=click.Path(exists=True))
@click.argument("--id_position", type=int, default=0)
def ingest_hemibrain(neurons, id_position):
    """
    Ingests neurons from a file
    """
    print("Ingested neurons ...")
    # open file from neurons argument
    ids = get_neuron_ids(neurons, id_position)

    if len(ids) > 0:
        access = data_access.DataAccess()
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
