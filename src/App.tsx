import { BrowserRouter, Routes, Route } from 'react-router-dom';
//import { CustoFormHookForm } from './components/forms/CustoFormHookForm';
import NavBar from './components/navbar/navbar';
import LandingPage from './pages/landingpage';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
