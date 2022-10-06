from params import Params
from google.cloud import storage


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

def get_gcloud_storage_bucket():
    """
    @return: Google Cloud Storage Bucket
    """
    storage_client = storage.Client.create_anonymous_client()
    bucket = storage_client.bucket(Params.bucket_name)
    return bucket