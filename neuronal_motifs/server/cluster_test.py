from scipy.cluster.hierarchy import linkage
import numpy as np

a = np.random.multivariate_normal([10, 0], [[3, 1], [1, 4]], size=[100, ])
b = np.random.multivariate_normal([0, 20], [[3, 1], [1, 4]], size=[50, ])
centers = np.concatenate((a, b), )


def create_tree(centers):
    clusters = {}
    to_merge = linkage(centers, method='single')
    for i, merge in enumerate(to_merge):
        if merge[0] <= len(to_merge):
            # if it is an original point read it from the centers array
            a = centers[int(merge[0]) - 1]
        else:
            # otherwise read the cluster that has been created
            a = clusters[int(merge[0])]

        if merge[1] <= len(to_merge):
            b = centers[int(merge[1]) - 1]
        else:
            b = clusters[int(merge[1])]
        # the clusters are 1-indexed by scipy
        clusters[1 + i + len(to_merge)] = {
            'children': [a, b]
        }
        # ^ you could optionally store other info here (e.g distances)
    return clusters


print(create_tree(centers))
