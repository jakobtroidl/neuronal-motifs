import navis
import multiprocessing
import navis.interfaces.neuprint as neu
from neuronal_motifs.server.utils import authentication as auth
import pandas as pd
import pickle
import numpy as np
if __name__ == '__main__':
    multiprocessing.freeze_support()
    # Load example neurons
    client = neu.Client('https://neuprint.janelia.org', dataset='hemibrain:v1.2.1',
                        token=auth.get_access_token('neuprint'))

    traced_neurons = pd.read_csv('/Users/swarchol/Research/exported-traced-adjacencies-v1.2 2/traced-neurons.csv')

    traced_neuron_ids = traced_neurons[['bodyId']].to_numpy().flatten().tolist()

    # neuron_df, _ = neu.fetch_neurons(traced_neuron_ids)
    nl = neu.fetch_skeletons(traced_neuron_ids, parallel=True)
    pickle.dump(nl, open('./traced.pkl', "wb"))
    # nl = pickle.load(open('./traced.pkl', "rb"))
    # print('Units', np.unique(np.array(nl.units)))
    nl_um = nl * (8 / 1000)
    dps = navis.make_dotprops(nl_um)
    pickle.dump(dps, open('./dps.pkl', "wb"))

    # dps = pickle.load(open('./dps.pkl', "rb"))
    scores = navis.nblast_smart(dps, dps)
    pickle.dump(scores, open('./scores.pkl', "wb"))
    # test = ''


