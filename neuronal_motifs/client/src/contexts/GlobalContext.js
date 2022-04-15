import React, {useEffect, useState} from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {

    const [selectedMotif, setSelectedMotif] = useState();
    const [motifQuery, setMotifQuery] = useState();
    const [abstractionLevel, setAbstractionLevel] = useState();
    const [colors, setColors] = useState(['#7e2fd0', '#81D02F', '#34AFCB', '#CB5034', '#B3A94C', '#4C56B3', '#D9C226', '#263DD9']);
    const [loadingMessage, setLoadingMessage] = useState();
    const [selectedSketchElement, setSelectedSketchElement] = useState(null);

    return (
        <AppContext.Provider value={
            {
                selectedMotif, setSelectedMotif,
                selectedSketchElement, setSelectedSketchElement,
                motifQuery, setMotifQuery,
                abstractionLevel, setAbstractionLevel,
                loadingMessage, setLoadingMessage,
                colors, setColors,
            }}>
            {props.children}
        </AppContext.Provider>
    );
}