import zarr
import pickle
import numpy as np
from pathlib import Path
import time
from line_profiler_pycharm import profile


def get_nblast_scores(neuron_id, top_n=None):
    cache_path = Path("cache")
    nblast_matrix = zarr.load(str(cache_path / 'nblast' / 'scores.zarr'))
    # Maps neuron ids to indices in the matrix
    nblast_to_id = pickle.load(open(str(cache_path / 'nblast' / 'nblast_dict.pkl'), "rb"))
    # maps indices back to neuron ids
    id_to_nblast = {v: k for k, v in nblast_to_id.items()}
    row_id = nblast_to_id[neuron_id]
    score_col = nblast_matrix[:, row_id]
    # Sorts in descending order
    sorted_indices = score_col.argsort()[::-1]
    if top_n:
        sorted_indices = sorted_indices[:top_n]
    value_list = [{'score': float(score_col[i]), 'neuron_id': id_to_nblast[i]} for i in sorted_indices.tolist()]
    return value_list
