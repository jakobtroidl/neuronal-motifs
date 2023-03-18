import graphistry
import pandas as pd

print(graphistry.__version__)

username = "jakobtroidl"
key_id = "ADD KEY ID HERE"
key = "ADD KEY HERE"
path = "/Users/jakobtroidl/Desktop/neuronal-motifs/data/fly-hemibrain/traced-total-connections.csv"
df = pd.read_csv(path)


# generate pd.Series the length of the number of edges
df['color'] = pd.Series([0x0000000] * len(df.index))

graphistry.register(api=3,
                    protocol="https",
                    server="hub.graphistry.com",
                    personal_key_id=key_id,
                    personal_key_secret=key)

g = graphistry.edges(df, "bodyId_pre", "bodyId_post", "color")

g.bind(edge_color="default").plot()




