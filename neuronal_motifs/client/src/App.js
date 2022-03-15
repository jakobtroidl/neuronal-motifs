import logo from './logo.svg';
import Viewer from './components/Viewer'
import MotifPanel from './components/MotifPanel'
import DraggableView from "./views/DraggableView";
import {ContextWrapper} from "./contexts/AbstractionLevelContext";
import './App.css';


function App() {
    // Wrap things in context that can use global context
    return (
        <ContextWrapper>
            <div>
                <Viewer/>
                <DraggableView/>
                <MotifPanel/>
            </div>
        </ContextWrapper>
    );
}

export default App;
