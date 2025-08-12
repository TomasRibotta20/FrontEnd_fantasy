import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/navbar/navbar';
import LandingPage from './components/pages/landingpage';
import Club from './components/pages/clubCRUD/ClubName';
import ClubReadUpdateDelete from './components/pages/clubCRUD/ClubReadUpdateDelete';
import CreateUser from './components/pages/register/CreateUser';
import Login from './components/pages/auth/Login';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<LandingPage />}></Route>
          <Route path="/CreateUser" element={<CreateUser />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/club"
            element={
              <ProtectedRoute>
                <Club />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/ClubName"
            element={
              <ProtectedRoute>
                <Club />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/ClubReadUpdateDelete"
            element={
              <ProtectedRoute>
                <ClubReadUpdateDelete />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
