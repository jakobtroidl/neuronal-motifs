import React, {useEffect, useState} from "react";

export const AppContext = React.createContext(null);

// Step 2: Create a ContextWrapper component that has to be the parent of every consumer.

export const ContextWrapper = (props) => {
    const [store, setStore] = useState({
        abstractionLevel: 0
    });
    const [actions, setActions] = useState({
        changeAbstractionLevel: level => setStore({...store, abstractionLevel: level})
    });

    return (
        <AppContext.Provider value={{store, actions}}>
            {props.children}
        </AppContext.Provider>
    );
}