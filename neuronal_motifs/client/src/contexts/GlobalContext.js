import React, {useEffect, useState} from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {

    const [selectedMotif, setSelectedMotif] = useState();
    const [motifQuery, setMotifQuery] = useState();
    const [abstractionLevel, setAbstractionLevel] = useState();
    const [colors, setColors] = useState(['#7e2fd0', '#81D02F', '#34AFCB', '#CB5034', '#B3A94C', '#4C56B3', '#D9C226', '#263DD9']);
    //const [clearViewer, setClearViewer] = useState(0);

    // const [actions, setActions] = useState({
    //     changeAbstractionLevel: level => setAbstractionLevel(level),
    //     changeMotifQuery: query => setMotifQuery(query),
    //     changeSelectedMotif: motif => setSelectedMotif(motif),
    //     clearView: clear => setClearViewer(clearViewer + clear)
    // });

    return (
        <AppContext.Provider value={
            {selectedMotif, setSelectedMotif,
            motifQuery, setMotifQuery,
            abstractionLevel, setAbstractionLevel,
            colors, setColors }}>
            {props.children}
        </AppContext.Provider>
    );
}