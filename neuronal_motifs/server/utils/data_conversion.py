import tempfile
from pathlib import Path
import os


def neuron_to_swc_string(neuron_skeleton):
    """
    Takes a TreeNeuron skeleton and returns its swc formatted data string
    @param neuron_skeleton: TreeNeuron object
    @return: swc string
    """
    fp = tempfile.NamedTemporaryFile(suffix='.swc', delete=False)
    neuron_skeleton.to_swc(Path(fp.name))
    fp.seek(0)
    swc_string = fp.read()
    fp.close()
    os.unlink(fp.name)
    return swc_string.decode("utf-8")
