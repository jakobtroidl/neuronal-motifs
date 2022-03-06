import React, { useState, useEffect } from 'react';
/* fetches a list of motifs from backend/janelia and displays them here */
/* motif sketching panel sends a list of text to the backend, backend returns list of ids */

/* logic: 
    1. search bar takes in the motif 
    2. when submitted, the motif gets sent to the backend
    3.
*/

/* think about using d3 with react for the grab components */
/* or, for draggable components, https://github.com/react-grid-layout/react-draggable */

const TodosContext = React.createContext({
    todos: [], fetchTodos: () => {}
  })

function MotifPanel() {
    const [motif, setMotif] = useState('');
    const [searchedMotifs, setSearchedMotifs] = useState([]);
    const [todos, setTodos] = useState([])

    const fetchTodos = async () => {
        const response = await fetch("http://localhost:5050/todo")
        const todos = await response.json()
        setTodos(todos.data)
    }

    console.log(todos)

    useEffect(() => {
        fetchTodos()
    }, [])

    // console.log(motif)
    // console.log("text")

    // useEffect(() => {
    //         fetchMotifs()
    //     }, [])

    // const handleSubmit = () => {
    //     fetch("http://localhost:5050/search", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(motif)
    //     }).then(fetchMotifs)
    // }

    // const fetchMotifs = async () => {
    //     const response = await fetch("http://localhost:5050/search")
    //     const motifs = await response.json()
    //     setSearchedMotifs(motifs.data)
    //   }

    return (
        <div>
            {/* <form onSubmit={handleSubmit()}>
                <label>
                Motif:  
                <input type="text" value={motif} onChange={motif => setMotif(motif)} />
                </label>
                <input type="submit" value="Submit" />
            </form> */}
            <div>
                {todos.map((todo) => (
                <b>{todo.item}</b>
                ))}
            </div>
        </div>
    )
}

export default MotifPanel;