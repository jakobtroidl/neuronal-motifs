
### Prerequisites

* [conda](https://docs.conda.io/en/latest/) installed

### Installation

Create a conda environment.

```python
conda env create -f environment.yml
```

Activate the conda environment

```python
conda activate neuronal-motifs
```

From this folder, start the server with

```python
uvicorn main:app --reload
```

### Neuprint Access Token
