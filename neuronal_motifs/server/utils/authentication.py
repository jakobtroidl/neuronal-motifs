from params import Params


def get_data_server():
    """
        Returns the URL of the server where data is downloaded from.
    """
    return Params.data_server


def get_data_version():
    """
        Returns the version of the dataset
    """
    return Params.data_version
