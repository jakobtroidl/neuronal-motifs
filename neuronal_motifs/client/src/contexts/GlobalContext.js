import React, { useState } from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {
  const [globalMotifIndex, setGlobalMotifIndex] = useState(0);
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [focusedMotif, setFocusedMotif] = useState(null);
  const [motifQuery, setMotifQuery] = useState();
  const [abstractionLevel, setAbstractionLevel] = useState();
  const [neuronColors, setNeuronColors] = useState([
    // "#7e2fd0",
    // "#81D02F",
    // "#34AFCB",
    // "#B3A94C",
    // "#4C56B3",
    // "#D9C226",
    // "#263DD9",
    // "#CB5034",
    "#9400D3",
    "#DAA520",
    "#97d0b5",
    "#76acf3",
    "#FF6347",
    "#4C56B3",
    "#D9C226",
    "#263DD9",
  ]);
  const [synapseColors, setSynapseColors] = useState([
    "#FF6347",
    "#DAA520",
    "#97d0b5",
    "#76acf3",
    "#9400D3",
    "#4C56B3",
    "#D9C226",
    "#263DD9",
  ]);

  const [highlightColor, setHighlightColor] = useState("#0000ff");

  const [loadingMessage, setLoadingMessage] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [selectedSketchElement, setSelectedSketchElement] = useState(null);
  const [resetUICounter, setResetUICounter] = useState(0);

  // motif occurences stats
  const [absMotifCount, setAbsMotifCount] = useState(null); // count of a motif in the dataset, e.g motif1 occurs 100 times in the dataset
  const [relativeMotifCount, setRelativeMotifCount] = useState(null); // count of all motifs in the dataset. e.g, motif1 is Highly represented in the dataset
  const [showWarning, setShowWarning] = useState(false);

  // neighborhood query results
  const [neighborhoodQuery, setNeighborhoodQuery] = useState(null);
  const [motifToAdd, setMotifToAdd] = useState(null);
  const [motifToDelete, setMotifToDelete] = useState(null);
  const [currentNeuronLabels, setCurrentNeuronLabels] = useState({});
  const [motifPathPosition, setMotifPathPosition] = useState(0.5);

  const [explosionRange, setExplosionRange] = useState(0.08);

  // highlight synapses
  const [selectedCytoscapeEdge, setSelectedCytoscapeEdge] = useState(null);
  const [greyOutNonMotifBranches, setGreyOutNonMotifBranches] = useState(false);
  const [drawArrowsOnLines, setDrawArrowsOnLines] = useState(false);

  // search constraints
  const [constraintsToAddToSketch, setConstraintsToAddToSketch] = useState();

  const [displayedROIs, setDisplayedROIs] = useState([]);

  // DOF rendering parameters
  const [dofEnabled, setDofEnabled] = useState(false);
  const [dofFocus, setDofFocus] = useState(null);
  const [dofBlur, setDofBlur] = useState(null);

  return (
    <AppContext.Provider
      value={{
        globalMotifIndex,
        setGlobalMotifIndex,
        selectedMotifs,
        setSelectedMotifs,
        selectedSketchElement,
        setSelectedSketchElement,
        motifQuery,
        setMotifQuery,
        abstractionLevel,
        setAbstractionLevel,
        loadingMessage,
        setLoadingMessage,
        neuronColors,
        setNeuronColors,
        synapseColors,
        setSynapseColors,
        resetUICounter,
        setResetUICounter,
        absMotifCount,
        setAbsMotifCount,
        relativeMotifCount,
        setRelativeMotifCount,
        showWarning,
        setShowWarning,
        neighborhoodQuery,
        setNeighborhoodQuery,
        highlightColor,
        setHighlightColor,
        motifToAdd,
        setMotifToAdd,
        motifToDelete,
        setMotifToDelete,
        focusedMotif,
        setFocusedMotif,
        currentNeuronLabels,
        setCurrentNeuronLabels,
        motifPathPosition,
        setMotifPathPosition,
        errorMessage,
        setErrorMessage,
        selectedCytoscapeEdge,
        setSelectedCytoscapeEdge,
        explosionRange,
        setExplosionRange,
        greyOutNonMotifBranches,
        setGreyOutNonMotifBranches,
        drawArrowsOnLines,
        setDrawArrowsOnLines,
        constraintsToAddToSketch,
        setConstraintsToAddToSketch,
        displayedROIs,
        setDisplayedROIs,
        dofEnabled,
        setDofEnabled,
        dofFocus,
        setDofFocus,
        dofBlur,
        setDofBlur,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};
