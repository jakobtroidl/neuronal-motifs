
# Neuronal Motifs
[![Demo](https://img.shields.io/badge/demo-running-blue.svg?colorB=4AC8F4)](https://vimo-client-3jagpvnfya-uc.a.run.app/)
[![Video](https://img.shields.io/badge/video-online-red.svg?colorB=f25100)](https://www.youtube.com/watch?v=lWc__xAo73o)
[![doi](https://img.shields.io/badge/doi-10.1109%2FTVCG.2017.2745978-purple.svg?colorB=C46CFD)](https://doi.org/10.1101/2022.12.09.519772)

An interactive tool for querying and visual analysis of network motifs in large connectomics data.

## Live Demo 
A demo is available [here](https://vimo-client-3jagpvnfya-uc.a.run.app/). Before you get started, please add your personal neuprint authentication token under `Settings > Auth Token`. You can find your token [here](https://neuprint.janelia.org/account). 


## Installation for Local Development

Requirements
* [`Node.js`](https://nodejs.org/en/)
* [`virtualenv`](https://virtualenv.pypa.io/en/latest/installation.html)

Clone the repository:
```bash
git clone https://github.com/jakobtroidl/neuronal-motifs.git && cd neuronal-motifs
```

Install/activate virtualenv and start the backend:
```bash
cd neuronal_motifs/server/
virtualenv -p python3.9 vimo
source vimo/bin/activate
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
- Unzip to `neuronal_motifs/server/cache/data/neurons/`

## Citing
If you find our work helpful, please consider citing it.
```bibtex
@article {troidl2022vimo,
    title={Vimo: Visual Analysis of Neuronal Connectivity Motifs},
    author={Troidl, Jakob and Warchol, Simon and Choi, Jinhan and Matelsky, Jordan 
    and Dhanysai, Nagaraju and Wang, Xueying and Wester, Brock and Wei, Donglai 
    and Lichtman, Jeff W and Pfister, Hanspeter and Beyer, Johanna},
    year={2022},
    doi={10.1101/2022.12.09.519772},
    publisher={Cold Spring Harbor Laboratory},
    url={https://www.biorxiv.org/content/early/2022/12/11/2022.12.09.519772},
    journal={bioRxiv}
}
```
We gratefully acknowledge the support from NSF award number IIS-2124179.


