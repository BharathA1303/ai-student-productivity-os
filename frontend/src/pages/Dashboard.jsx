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
  const [aiSubjects, setAiSubjects] = useState([{ subject: '', priority: '3', examDate: '' }]);
  const [aiTotalHours, setAiTotalHours] = useState('');
  const [aiPlan, setAiPlan] = useState([]);
  const [aiTopSubjects, setAiTopSubjects] = useState([]);
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

  const handleAiSubjectChange = (index, field, value) => {
    setAiSubjects((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddAiSubject = () => {
    setAiSubjects((prev) => [...prev, { subject: '', priority: '3', examDate: '' }]);
  };

  const handleRemoveAiSubject = (index) => {
    setAiSubjects((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAiPlanSubmit = async (event) => {
    event.preventDefault();
    setAiError('');

    if (aiSubjects.length === 0) {
      setAiError('Please add at least one subject');
      return;
    }

    const normalizedSubjects = [];

    for (let index = 0; index < aiSubjects.length; index += 1) {
      const item = aiSubjects[index];
      const subject = item.subject.trim();
      const priority = Number(item.priority);
      const examDateTimestamp = Date.parse(item.examDate);

      if (!subject) {
        setAiError(`Subject ${index + 1} name is required`);
        return;
      }

      if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
        setAiError(`Priority for ${subject} must be between 1 and 5`);
        return;
      }

      if (Number.isNaN(examDateTimestamp)) {
        setAiError(`Exam date for ${subject} is invalid`);
        return;
      }

      normalizedSubjects.push({
        subject,
        priority,
        examDate: new Date(examDateTimestamp).toISOString(),
      });
    }

    const parsedTotalHours = Number(aiTotalHours);
    if (!Number.isFinite(parsedTotalHours) || parsedTotalHours <= 0) {
      setAiError('Please enter total hours greater than 0');
      return;
    }

    setAiLoading(true);

    try {
      const response = await api.post('/ai-plan', {
        subjects: normalizedSubjects,
        totalHours: parsedTotalHours,
      });

      setAiPlan(response.data);
      const maxPriority = normalizedSubjects.reduce(
        (maxValue, item) => (item.priority > maxValue ? item.priority : maxValue),
        1
      );
      setAiTopSubjects(
        normalizedSubjects
          .filter((item) => item.priority === maxPriority)
          .map((item) => item.subject.toLowerCase())
      );
      setAiSubjects([{ subject: '', priority: '3', examDate: '' }]);
      setAiTotalHours('');
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

  const totalPlannedHours = plans.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const totalAiHours = aiPlan.reduce((sum, item) => sum + Number(item.hours || 0), 0);

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <p className="brand-tag">AI Student Productivity OS</p>
        <h2>Planner Workspace</h2>
        {user && (
          <div className="profile-card">
            <p className="profile-name">{user.name}</p>
            <p className="profile-email">{user.email}</p>
          </div>
        )}

        <div className="sidebar-stats">
          <article>
            <p>Saved Plans</p>
            <strong>{plans.length}</strong>
          </article>
          <article>
            <p>Planned Hours</p>
            <strong>{totalPlannedHours}</strong>
          </article>
          <article>
            <p>AI Suggested Hours</p>
            <strong>{totalAiHours}</strong>
          </article>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <h1>Dashboard</h1>
          <p>Manage daily plans and generate smart allocations from subject priorities.</p>
        </header>

        {loading && <p>Loading user data...</p>}
        {error && <p className="error-text">{error}</p>}

        {user && !loading && !error && (
          <div className="workspace-grid">
            <section className="workspace-card">
              <div className="card-heading">
                <h3>Study Planner</h3>
                <p>Add manual tasks for your schedule.</p>
              </div>

              <form onSubmit={handlePlanSubmit} className="auth-form planner-form">
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={planForm.subject}
                  onChange={handlePlanChange}
                  required
                />
                <div className="inline-fields">
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
                </div>
                {planError && <p className="error-text">{planError}</p>}
                <button type="submit" disabled={planLoading}>
                  {planLoading ? 'Saving...' : 'Add Plan'}
                </button>
              </form>

              <div className="plan-history">
                <h4>Your Plans</h4>
                {plans.length === 0 ? (
                  <p className="empty-state">No study plans added yet.</p>
                ) : (
                  <ul className="plan-list">
                    {plans.map((plan) => (
                      <li key={plan.id}>
                        <strong>{plan.subject}</strong>
                        <span>{plan.hours} hour(s)</span>
                        <small>{new Date(plan.date).toLocaleDateString()}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="workspace-card">
              <div className="card-heading">
                <h3>AI Smart Planner</h3>
                <p>Generate weighted hours using priority and exam date.</p>
              </div>

              <form onSubmit={handleAiPlanSubmit} className="auth-form ai-form">
                {aiSubjects.map((item, index) => (
                  <div className="ai-subject-row" key={`ai-subject-${index + 1}`}>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={item.subject}
                      onChange={(event) =>
                        handleAiSubjectChange(index, 'subject', event.target.value)
                      }
                      required
                    />
                    <select
                      value={item.priority}
                      onChange={(event) =>
                        handleAiSubjectChange(index, 'priority', event.target.value)
                      }
                    >
                      <option value="1">Priority 1</option>
                      <option value="2">Priority 2</option>
                      <option value="3">Priority 3</option>
                      <option value="4">Priority 4</option>
                      <option value="5">Priority 5</option>
                    </select>
                    <input
                      type="date"
                      value={item.examDate}
                      onChange={(event) =>
                        handleAiSubjectChange(index, 'examDate', event.target.value)
                      }
                      required
                    />
                    <button
                      type="button"
                      className="secondary-btn compact-btn"
                      onClick={() => handleRemoveAiSubject(index)}
                      disabled={aiSubjects.length === 1 || aiLoading}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button type="button" className="secondary-btn" onClick={handleAddAiSubject}>
                  + Add Subject
                </button>

                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Total hours"
                  value={aiTotalHours}
                  onChange={(event) => setAiTotalHours(event.target.value)}
                  required
                />
                {aiError && <p className="error-text">{aiError}</p>}
                <button type="submit" disabled={aiLoading}>
                  {aiLoading ? (
                    <span className="button-loading">
                      <span className="spinner" aria-hidden="true" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Smart Plan'
                  )}
                </button>
              </form>

              {aiPlan.length > 0 && (
                <div className="result-list">
                  {aiPlan.map((item) => {
                    const isTopSubject = aiTopSubjects.includes(item.subject.toLowerCase());

                    return (
                      <article
                        key={item.subject}
                        className={`result-card ${isTopSubject ? 'result-card-highlight' : ''}`}
                      >
                        {isTopSubject && <span className="result-pill">Top Priority</span>}
                        <h4>{item.subject}</h4>
                        <p>{item.hours} hour(s)</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
