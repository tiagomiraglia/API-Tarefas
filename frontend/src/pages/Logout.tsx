import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('nivel');
    localStorage.removeItem('empresa_id');
    setTimeout(() => {
      navigate('/');
    }, 200);
  }, [navigate]);
  return null;
}
