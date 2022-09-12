#!/bin/bash --login
# The --login ensures the bash configuration is loaded,
conda init bash
set +euo pipefail
conda activate neuronal-motifs
# enable strict mode:
set -euo pipefail
python main.py