import json
import os


def get_access_token(name):
    """
        Returns an access token for a given database
        name: name of the database
    """
    path = os.path.join(os.path.dirname(__file__), 'access_token.json')
    file = open(path)
    tokens = json.load(file)
    return tokens[name]


def get_data_server():
    """
        Returns the URL of the server where data is downloaded from. Reads information from config.json file.
    """

    path_parent = os.path.dirname(os.getcwd())
    path = os.path.join(os.getcwd(), 'config.json')
    file = open(path)
    config = json.load(file)
    return config["data_server"]


def get_data_version():
    """
            Returns the version of the dataset
    """
    path_parent = os.path.dirname(os.getcwd())
    path = os.path.join(os.getcwd(), 'config.json')
    file = open(path)
    config = json.load(file)
    return config["data_version"]