from pyvis.network import Network
import pandas as pd

net = Network(height="750px", width="100%", bgcolor="#222222", font_color="white")

# set the physics layout of the network
net.barnes_hut()
got_data = pd.read_csv("/Users/jakobtroidl/Desktop/neuronal-motifs/data/fly-hemibrain/traced-total-connections.csv")

sources = got_data['bodyId_pre'].values.tolist()
targets = got_data['bodyId_post'].values.tolist()
weights = got_data['weight'].values.tolist()

edge_data = zip(sources, targets, weights)

out = "digraph G {"
counter = 0
for e in edge_data:
    src = e[0]
    dst = e[1]
    w = e[2]

    # concat src and dst to string
    out += str(src) + " -> " + str(dst) + "; "

    counter += 1

out += "}"

# dump src to file
with open("/Users/jakobtroidl/Desktop/neuronal-motifs/data/fly-hemibrain/graph-full.dot", "w") as f:
    f.write(out)
