import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

edges = pd.read_csv('/Users/jakobtroidl/Desktop/neuronal-motifs/data/fly-hemibrain/traced-total-connections.csv')

counts = edges['bodyId_pre'].value_counts()

# compute the mean of the counts
mean = counts.values.mean()

print(counts)