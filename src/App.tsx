import { BrowserRouter, Routes, Route } from 'react-router-dom';
//import { CustoFormHookForm } from './components/forms/CustoFormHookForm';
import NavBar from './components/navbar/navbar';
import LandingPage from './components/pages/landingpage';
import Club from './components/pages/clubCRUD/ClubName';
import ClubReadUpdateDelete from './components/pages/clubCRUD/ClubReadUpdateDelete';
import CardDefault from './components/CardDefault';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/club" element={<Club />}></Route>
        <Route
          path="/ClubReadUpdateDelete"
          element={<ClubReadUpdateDelete />}
        />
        <Route
          path="/CardDefault"
          element={
            // Replace the following club object with a real club or mock as needed
            <CardDefault club={{ id: 1, name: 'Sample Club' }} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
