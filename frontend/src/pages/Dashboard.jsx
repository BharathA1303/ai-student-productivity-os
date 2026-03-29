import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/user/me');
        setUser(response.data);
        setError('');
      } catch (requestError) {
        const statusCode = requestError.response?.status;
        const message = requestError.response?.data?.message || 'Unable to load user details';

        if (statusCode === 401 || statusCode === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      {loading && <p>Loading user data...</p>}
      {error && <p className="error-text">{error}</p>}
      {user && !loading && !error && (
        <>
          <p>
            Welcome, <strong>{user.name}</strong>!
          </p>
          <p>
            Signed in as: <strong>{user.email}</strong>
          </p>
        </>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
