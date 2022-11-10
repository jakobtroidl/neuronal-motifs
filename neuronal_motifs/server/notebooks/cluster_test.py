from scipy.cluster.hierarchy import linkage
import numpy as np
from sklearn.cluster import AgglomerativeClustering
import matplotlib.pyplot as plt

# generate random np array of 1000 rows and 3 columns
X = np.random.rand(10000, 2)


for n_clusters in range(2, 10):
    clustering = AgglomerativeClustering(n_clusters=n_clusters)

    # Visualizing the clustering
    fig = plt.figure(figsize=(6, 6))

    plt.scatter(X[:, 0], X[:, 1], c=clustering.fit_predict(X), cmap='rainbow')

    plt.show()
