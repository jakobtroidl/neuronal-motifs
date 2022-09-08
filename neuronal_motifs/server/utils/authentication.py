import json
# from neuronal_motifs.server.params import Params
from pathlib import Path

from params import Params


def get_data_server():
    """
        Returns the URL of the server where data is downloaded from. Reads information from config.json file.
    """

    path = Path(Params.root + "server/secrets/config.json")
    file = open(path)
    config = json.load(file)
    return config["data_server"]


def get_data_version():
    """
            Returns the version of the dataset
    """
    path = Path(Params.root + "server/secrets/config.json")
    file = open(path)
    config = json.load(file)
    return config["data_version"]
