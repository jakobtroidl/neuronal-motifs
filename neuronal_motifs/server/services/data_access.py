import pickle as pkl
from pathlib import Path

import navis
import navis.interfaces.neuprint as neu
import networkit as nk
import numpy as np
from models.neuron import Neuron
from params import Params
from utils.authentication import get_data_server, get_data_version, get_gcloud_storage_bucket

import time
def file_exists(file_path):
    """
    @param file_path: path to file
    @return: boolean
    """
    return Path(file_path).is_file()


# def load_neuron_from_cache(neuron_id):
#     """
#     Loads neuron from cache, if exists. Returns None otherwise
#     @param neuron_id: int
#     @return: Neuron skeleton (pd.DataFrame)
#     """
#     print(f"Root: {Params.root}")
#     # path = Params.root / "server" / "cache" / "data" / "neurons" / (str(neuron_id) + ".pkl")
#     neuron = None
#
#     bucket = get_gcloud_storage_bucket_anonymously()
#     storage_path = Params.storage_root / "server" / "cache" / "data" / "neurons" / (str(neuron_id) + ".pkl")
#     blob = bucket.blob(str(storage_path))
#     if blob.exists():
#         pkl_in = blob.download_as_string()
#         # try:
#         print(neuron_id)
#         neuron = pkl.loads(pkl_in)
#
#         # except EOFError:
#         #     print(neuron_id)
#             # print(pkl_in)
#
#         # print(type(neuron))
#         # print(neuron.is_neuron())
#
#     # if file_exists(path):
#     #     # load neuron from filepath
#     #     with open(path, 'rb') as f:
#     #         neuron = pkl.load(f)
#     #         f.close()
#     return neuron


class DataAccess:
    def __init__(self, token):
        neu.Client(get_data_server(), dataset=get_data_version(), token=token)
        self.bucket = get_gcloud_storage_bucket()

    def load_neuron_from_cache(self, neuron_id):
        """
        Loads neuron from cache, if exists. Returns None otherwise
        @param neuron_id: int
        @return: Neuron skeleton (pd.DataFrame)
        """
        neuron = None
        storage_path = Params.storage_root / "server" / "cache" / "data" / "neurons" / (str(neuron_id) + ".pkl")
        blob = self.bucket.blob(str(storage_path))
        if blob.exists():
            pkl_in = blob.download_as_bytes()
            try:
                neuron = pkl.loads(pkl_in)
            except EOFError:
                neuron = None
        return neuron

    def dump_neurons_to_cache(self, neurons):
        """
        Dumps a list of neurons to cache
        @param neurons: [int] list of neuron ids
        """
        path = Params.root / "server" / "cache" / "data" / "neurons"
        path.mkdir(parents=True, exist_ok=True)  # create directory if it doesn't exist

        for neuron in neurons:
            local_path = path / (str(neuron.id) + '.pkl')
            with open(local_path, 'wb') as f:
                pkl.dump(neuron, f)
                try:
                    storage_path = Params.storage_root / "server" / "cache" / "data" / "neurons" / (str(neuron.id) + '.pkl')
                    blob = self.bucket.blob(str(storage_path))
                    blob.upload_from_filename(local_path)
                except ValueError:
                    print("Anonymous credentials cannot be refreshed.")
                    pass
                f.close()

    def filter_synapses_by_group(self, neuron_id, inputs, outputs):
        """
        Filters a neurons synapses by input groups and output groups
        @param neuron_id: int body id of neuron
        @param inputs: {'A': [ids], 'B': [ids], ...} groups of input ids
        @param outputs: {'A': [ids], 'B': [ids], ...} groups of output ids
        @return: [input_synapses, output_synapses] list of grouped synapses
        """
        neuron = self.get_neurons([neuron_id])[0]
        input_results = {}
        for [label, input_ids] in inputs.items():
            input_results[label] = neuron.filter_synapses(input_ids, type='in')
        output_results = {}
        for [label, output_ids] in outputs.items():
            output_results[label] = neuron.filter_synapses(output_ids, type='out')
        return {'input': input_results, 'output': output_results}

    def ingest_neurons(self, neurons, batch_size=1000):
        """
        Ingests a list of neurons into the database
        @param batch_size: divide neurons into batches of this size
        @param neurons: list of Neuron objects
        """
        batches = np.array_split(neurons, batch_size)
        counter = 0
        for batch in batches:
            print("Starting batch {}".format(counter))
            if len(batch) > 0:
                downloaded_neurons = self.precompute_neurons(batch)
                self.dump_neurons_to_cache(downloaded_neurons)
            counter += 1

    def precompute_neurons(self, batch, overwrite=False):
        batch_to_download = []
        if overwrite:
            batch_to_download = batch
        else:
            for id in batch:
                # path = Params.root / "server" / "cache" / "data" / "neurons" / (str(id) + ".pkl")
                storage_path = Params.storage_root / "server" / "cache" / "data" / "neurons" / (str(id) + ".pkl")
                blob = self.bucket.blob(str(storage_path))
                if blob.exists():
                # if file_exists(path):
                    print("Skipping neuron {}. Already in cache.".format(id))
                else:
                    batch_to_download.append(id)

        downloaded_neurons = []
        if len(batch_to_download) > 0:
            skeletons = neu.fetch_skeletons(x=batch_to_download, with_synapses=True, parallel=True)
            for skel in skeletons:
                healed_skel = navis.heal_skeleton(skel)

                # extract method
                nk_graph = nk.nxadapter.nx2nk(navis.neuron2nx(healed_skel))
                nk_graph = nk.graphtools.toUndirected(nk_graph)
                nk_graph.indexEdges()

                # fetch all synapses from server
                outgoing = neu.fetch_synapse_connections(source_criteria=skel.id, batch_size=50)
                incoming = neu.fetch_synapse_connections(target_criteria=skel.id, batch_size=50)

                neuron = Neuron(id=skel.id, skeleton=healed_skel, skel_graph=nk_graph, outgoing_synapses=outgoing,
                                incoming_synapses=incoming)
                downloaded_neurons.append(neuron)
        return downloaded_neurons
    # make public bucket only read / auth for writing - serviceAccount
    # load from the bucket ,
    # if not, download from the public database and upload to the bucket
    #
    def get_neurons(self, body_ids):
        """
        @param body_ids: array of neuron body ids
        @return: dict of Neuron objects
        """
        cached_neurons = []  # list of neuron objects already in cache
        neurons_to_download = []  # list of neuron ids that have yet to be downloaded
        for id in body_ids:
            neuron = self.load_neuron_from_cache(id)
            if neuron is None:
                neurons_to_download.append(id)
            else:
                try:
                    if neuron.is_neuron():
                        cached_neurons.append(neuron)
                except:
                    neurons_to_download.append(id)

        print("{} neurons loaded from cache".format(len(cached_neurons)))
        print("{} neuron(s) to download".format(len(neurons_to_download)))

        downloaded_neurons = []
        if len(neurons_to_download) > 0:
            downloaded_neurons = self.precompute_neurons(neurons_to_download, overwrite=True)
            self.dump_neurons_to_cache(downloaded_neurons)
        print("Download. Done.")

        output = downloaded_neurons + cached_neurons

        assert len(output) == len(body_ids)

        return output

    @staticmethod
    def get_synapses(from_neurons, to_neighbors):
        """
        Returns synapses of all the neighbors of a given neuron
        @param from_neurons: neuron ids of which the neighbours are looked at
        @param to_neighbors: list of neighbor ids for which the synapses should be downloaded
        @return: list of synapses
        """

        return neu.fetch_synapse_connections(from_neurons, to_neighbors)
