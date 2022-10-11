# Neuronal Motifs

A interactive tool for querying and visual analysis of network motifs in large connectomics data.

## Demo 
A demo is available under [my-motifs.me](my-motifs.me). Before you get started, please add your personal neuprint authentication token under `Settings > Auth Token`. You can find your authentikation token [here](https://neuprint.janelia.org/account). 


## Installation

Requirements: 
* [`Node.js`](https://nodejs.org/en/)
* [`conda`](https://conda.io/projects/conda/en/latest/user-guide/install/index.html)

Clone the repository:
```bash
git clone https://github.com/jakobtroidl/neuronal-motifs.git && cd neuronal-motifs
```

Install/activate the conda environmeny and start the backend:
```bash
cd neuronal_motifs/server/
conda env create -f environment.yml && conda activate neuronal-motifs
python main.py
```

From the root directory of the repository, install frontend dependencies and start frontend:
```bash
cd neuronal_motifs/client/
npm install
npm run start
```

The application is accessible under http://localhost:3000/

## Development
- In PyCharm make sure the client and source directory are set as the source root (right click directory > mark directory as > source root)
