import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import GioiThieu from './pages/GioiThieu';
import TrackOrder from './pages/TrackOrder';
import Cooking from './pages/Cooking';
import AdminLogin from './pages/AdminLogin';
import AdminForgot from './pages/AdminForgot';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gioi-thieu" element={<GioiThieu />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/cooking" element={<Cooking />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-forgot" element={<AdminForgot />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
