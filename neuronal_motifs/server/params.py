from pathlib import Path

class Params:
    data_server = 'https://neuprint.janelia.org/'
    data_version = 'hemibrain:v1.2.1'
    root = Path(__file__).parent.parent
    """
    Jinhan
    change local path to cloud bucket path
    Read: public
    Write: project members
    """
    storage_server = 'https://storage.googleapis.com/'
    bucket_name = 'motifs-cache'

    storage_root = Path('')

    # root = Path(bucket_name)