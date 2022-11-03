import pickle
from glob import glob
from utils.authentication import get_gcloud_storage_bucket
from params import Params
from tqdm import tqdm


# source from:https://stackoverflow.com/questions/2121874/python-pickling-after-changing-a-modules-directory
class RenameUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        renamed_module = module
        if module == "neuronal_motifs.server.models.neuron":
            renamed_module = "models.neuron"

        return super(RenameUnpickler, self).find_class(renamed_module, name)

def renamed_load(file_obj):
    return RenameUnpickler(file_obj).load()

if __name__ == '__main__':
    bucket = get_gcloud_storage_bucket()
    if bucket:
        base_path = "/Users/jinhan/Downloads/cache/cache/data/neurons/"
        for local_path in tqdm(glob(base_path + "*.pkl"), desc="Upload cache to GCloud"):
            fname = str(local_path).split('/')[-1]

            # storage_path = Params.storage_root / "server" / "cache" / "data" / "neurons" / fname

            # blob = bucket.blob(str(storage_path))
            # if not blob.exists():
            with open(local_path, 'rb') as f:
                try:
                    data = renamed_load(f)
                except EOFError:
                    print(local_path)
                    pass
                f.close()

            with open(local_path,'wb') as f:
                pickle.dump(data, f)
                # blob.upload_from_filename(local_path)
                f.close()



