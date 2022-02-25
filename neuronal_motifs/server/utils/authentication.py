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
    print(json)
    return tokens[name]
