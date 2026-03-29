import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState({ subject: '', hours: '', date: '' });
  const [planError, setPlanError] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [aiForm, setAiForm] = useState({ subjects: '', totalHours: '' });
  const [aiPlan, setAiPlan] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleAuthFailure = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/study-plan');
      setPlans(response.data);
    } catch (requestError) {
      const statusCode = requestError.response?.status;
      const message = requestError.response?.data?.message || 'Unable to load study plans';

      if (statusCode === 401 || statusCode === 403) {
        handleAuthFailure();
        return;
      }

      setPlanError(message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [userResponse, plansResponse] = await Promise.all([
          api.get('/user/me'),
          api.get('/study-plan'),
        ]);

        setUser(userResponse.data);
        setPlans(plansResponse.data);
        setError('');
        setPlanError('');
      } catch (requestError) {
        const statusCode = requestError.response?.status;
        const message = requestError.response?.data?.message || 'Unable to load user details';

        if (statusCode === 401 || statusCode === 403) {
          handleAuthFailure();
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePlanChange = (event) => {
    const { name, value } = event.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanSubmit = async (event) => {
    event.preventDefault();
    setPlanError('');
    setPlanLoading(true);

    try {
      await api.post('/study-plan', {
        subject: planForm.subject,
        hours: Number(planForm.hours),
        date: planForm.date,
      });

      setPlanForm({ subject: '', hours: '', date: '' });
      await fetchPlans();
    } catch (requestError) {
      const statusCode = requestError.response?.status;
      const message = requestError.response?.data?.message || 'Unable to create study plan';

      if (statusCode === 401 || statusCode === 403) {
        handleAuthFailure();
        return;
      }

      setPlanError(message);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAiFormChange = (event) => {
    const { name, value } = event.target;
    setAiForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiPlanSubmit = async (event) => {
    event.preventDefault();
    setAiError('');

    const parsedSubjects = aiForm.subjects
      .split(',')
      .map((subject) => subject.trim())
      .filter(Boolean);

    if (parsedSubjects.length === 0) {
      setAiError('Please enter at least one subject');
      return;
    }

    const parsedTotalHours = Number(aiForm.totalHours);
    if (!Number.isFinite(parsedTotalHours) || parsedTotalHours <= 0) {
      setAiError('Please enter total hours greater than 0');
      return;
    }

    setAiLoading(true);

    try {
      const response = await api.post('/ai-plan', {
        subjects: parsedSubjects,
        totalHours: parsedTotalHours,
      });

      setAiPlan(response.data);
    } catch (requestError) {
      const statusCode = requestError.response?.status;
      const message = requestError.response?.data?.message || 'Unable to generate AI study plan';

      if (statusCode === 401 || statusCode === 403) {
        handleAuthFailure();
        return;
      }

      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

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

          <h2>Study Planner</h2>
          <form onSubmit={handlePlanSubmit} className="auth-form">
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={planForm.subject}
              onChange={handlePlanChange}
              required
            />
            <input
              type="number"
              name="hours"
              min="1"
              placeholder="Hours"
              value={planForm.hours}
              onChange={handlePlanChange}
              required
            />
            <input
              type="date"
              name="date"
              value={planForm.date}
              onChange={handlePlanChange}
              required
            />
            {planError && <p className="error-text">{planError}</p>}
            <button type="submit" disabled={planLoading}>
              {planLoading ? 'Saving...' : 'Add Plan'}
            </button>
          </form>

          <h3>Your Plans</h3>
          {plans.length === 0 ? (
            <p>No study plans added yet.</p>
          ) : (
            <ul>
              {plans.map((plan) => (
                <li key={plan.id}>
                  <strong>{plan.subject}</strong> - {plan.hours} hour(s) on{' '}
                  {new Date(plan.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}

          <h2>AI Study Planner</h2>
          <form onSubmit={handleAiPlanSubmit} className="auth-form">
            <input
              type="text"
              name="subjects"
              placeholder="Subjects (comma separated)"
              value={aiForm.subjects}
              onChange={handleAiFormChange}
              required
            />
            <input
              type="number"
              name="totalHours"
              min="0.1"
              step="0.1"
              placeholder="Total hours"
              value={aiForm.totalHours}
              onChange={handleAiFormChange}
              required
            />
            {aiError && <p className="error-text">{aiError}</p>}
            <button type="submit" disabled={aiLoading}>
              {aiLoading ? 'Generating...' : 'Generate Plan'}
            </button>
          </form>

          {aiPlan.length > 0 && (
            <>
              <h3>Generated Plan</h3>
              <ul>
                {aiPlan.map((item) => (
                  <li key={item.subject}>
                    <strong>{item.subject}</strong> - {item.hours} hour(s)
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
