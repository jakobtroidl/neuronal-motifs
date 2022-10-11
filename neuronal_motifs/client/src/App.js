import Viewer from "./components/Viewer";
import Banner from "./components/Banner";
import DraggableView from "./views/DraggableView";
import { ContextWrapper } from "./contexts/GlobalContext";
import "./App.css";

function App() {
  // Wrap things in context that can use global context
  return (
    <ContextWrapper>
      <div>
        <Banner></Banner>
        <Viewer />
        <DraggableView />
      </div>
    </ContextWrapper>
  );
}

export default App;
