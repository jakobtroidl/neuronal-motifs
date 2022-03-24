import React, {useEffect, useState} from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {

    const [selectedMotif, setSelectedMotif] = useState();
    const [motifQuery, setMotifQuery] = useState();
    const [abstractionLevel, setAbstractionLevel] = useState();

    const [actions, setActions] = useState({
        changeAbstractionLevel: level => setAbstractionLevel(level),
        changeMotifQuery: query => setMotifQuery(query),
        changeSelectedMotif: motif => setSelectedMotif(motif)
    });

    return (
        <AppContext.Provider value={{selectedMotif, motifQuery, abstractionLevel, actions}}>
            {props.children}
        </AppContext.Provider>
    );
}