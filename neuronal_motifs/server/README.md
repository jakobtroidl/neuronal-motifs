
### Prerequisites

* [conda](https://docs.conda.io/en/latest/) installed

### Installation

**ARM Mac only**: install native pyqt5 (may need to uninstall existing versions first)
```
arch -arm64 brew install pyqt@5         
```

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

Find your personal access token [here](https://neuprint.janelia.org/account). Add yor token to the access_token.json.
