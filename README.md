# Neuronal Motifs

An interactive tool for querying and visual analysis of network motifs in large connectomics data.

## Demo 
A demo is available under [my-motifs.me](http://my-motifs.me/). Before you get started, please add your personal neuprint authentication token under `Settings > Auth Token`. You can find your token [here](https://neuprint.janelia.org/account). 


## Installation

Requirements
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

From the root directory of the repository, install frontend dependencies and start the frontend:
```bash
cd neuronal_motifs/client/
npm install
npm run start
```

The application is accessible under http://localhost:3000/

## Development
- In PyCharm make sure the client and source directory are set as the source root (right click directory > mark directory as > source root)

## Download Cache

To render 3D neurons, downloading the neuron data from the data server (https://neuprint.janelia.org/) and computation are required each time. If you want to reduce these loading times, please download the neuron dataset and save it to your local folder.
- [Click here](https://drive.google.com/file/d/1iv1AGUKxi55HWS2n8Yv_NY778I6OawG5/view?usp=share_link) to download the cache 
- Unzip to `neunonal_motifs/server/cache/data/neurons/`
