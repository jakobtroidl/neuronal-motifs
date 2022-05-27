import React, {useEffect, useState} from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {

    const [selectedMotif, setSelectedMotif] = useState();
    const [motifQuery, setMotifQuery] = useState();
    const [abstractionLevel, setAbstractionLevel] = useState();
    const [neuronColors, setNeuronColors] = useState(['#7e2fd0', '#81D02F', '#34AFCB', '#CB5034', '#B3A94C', '#4C56B3', '#D9C226', '#263DD9']);
    const [synapseColors, setSynapseColors] = useState(['#FF6347', '#DAA520', '#97d0b5', '#76acf3', '#9400D3', '#4C56B3', '#D9C226', '#263DD9']);
    const [loadingMessage, setLoadingMessage] = useState();
    const [selectedSketchElement, setSelectedSketchElement] = useState(null);
    const [resetUICounter, setResetUICounter] = useState(0);

    return (
        <AppContext.Provider value={
            {
                selectedMotif, setSelectedMotif,
                selectedSketchElement, setSelectedSketchElement,
                motifQuery, setMotifQuery,
                abstractionLevel, setAbstractionLevel,
                loadingMessage, setLoadingMessage,
                neuronColors, setNeuronColors,
                synapseColors, setSynapseColors,
                resetUICounter, setResetUICounter
            }}>
            {props.children}
        </AppContext.Provider>
    );
}