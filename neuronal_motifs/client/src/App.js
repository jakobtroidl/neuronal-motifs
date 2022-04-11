import logo from './logo.svg';
import Viewer from './components/Viewer'
import Loading from './components/Loading'
import MotifPanel from './components/MotifPanel'
import DraggableView from "./views/DraggableView";
import {ContextWrapper} from "./contexts/GlobalContext";
import './App.css';


function App() {
    // Wrap things in context that can use global context
    return (
        <ContextWrapper>
            <div>
                <Loading></Loading>
                <Viewer/>
                <DraggableView/>
            </div>
        </ContextWrapper>
    );
}

export default App;
