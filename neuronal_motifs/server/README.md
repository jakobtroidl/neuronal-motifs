
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
If env already exists, instead update it
```python
conda env update --file environment.yml --prune
```
From this folder, start the server with

```python
python main.py
```

### Neuprint Auth Token

Find your personal authentication token [here](https://neuprint.janelia.org/account). Add yor token to the access_token.json.
