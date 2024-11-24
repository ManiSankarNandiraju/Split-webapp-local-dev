// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage'; // Import the new GroupPage component
import SettleUpForm from './pages/SettleUpForm';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} /> {/* New GroupPage route */}
        <Route path="/settle-up" element={<SettleUpForm />} />
      </Routes>
    </Router>
  );
}

export default App;
