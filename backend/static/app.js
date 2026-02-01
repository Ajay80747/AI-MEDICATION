const { useState, useEffect } = React;
const API_URL = "/api";

// --- AUTH COMPONENT ---
const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                const user = await res.json();
                onLogin(user);
            } else {
                setError("Invalid Credentials");
            }
        } catch (e) {
            setError("Server Error");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2><i className="fas fa-hospital-user"></i> Hospital Portal</h2>
                {error && <p className="error">{error}</p>}
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button className="primary-btn full-width" onClick={handleLogin}>Login</button>
                <p className="hint">
                    <small>Default Logins:<br/>Admin: admin/admin123<br/>Doctor: doctor/doc123<br/>Patient: patient/pat123</small>
                </p>
            </div>
        </div>
    );
};

// --- COMPONENTS ---

const StatCard = ({ icon, label, value, subtext }) => (
    <div className="stat-card">
        <i className={`fas ${icon}`}></i>
        <div className="stat-info">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
            {subtext && <small style={{display:'block', color: '#666', marginTop: 5}}>{subtext}</small>}
        </div>
    </div>
);

// --- DASHBOARDS ---

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [view, setView] = useState('stats');
    
    // Patient Form State
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [pForm, setPForm] = useState({ name: "", age: "", gender: "Male", contact: "", weight: "", allergies: "", severity: "Normal" });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        fetch(`${API_URL}/dashboard/stats`)
            .then(res => res.json())
            .then(setStats);
    };

    const handleAddPatient = async () => {
        await fetch(`${API_URL}/patients`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pForm, age: parseInt(pForm.age), weight: parseFloat(pForm.weight) })
        });
        setShowPatientModal(false);
        setPForm({ name: "", age: "", gender: "Male", contact: "", weight: "", allergies: "", severity: "Normal" });
        loadStats(); // Refresh stats (bed count might change)
        alert("Patient Added Successfully");
    };

    if (!stats) return <div style={{padding: '2rem'}}>Loading Dashboard...</div>;

    return (
        <div className="dashboard-layout">
            <header className="dash-header">
                <h3>Admin Console</h3>
                <p>Hospital Overview & Management</p>
            </header>
            
            <div className="stats-grid">
                <StatCard icon="fa-procedures" label="Bed Availability" value={stats.beds.free} subtext={`Total: ${stats.beds.total} | Occupied: ${stats.beds.occupied}`} />
                <StatCard icon="fa-users" label="Total Patients" value={stats.patients} />
                <StatCard icon="fa-user-md" label="Active Doctors" value={stats.doctors} />
                <StatCard icon="fa-exclamation-triangle" label="Critical Cases" value={stats.patient_status.critical} subtext={`Serious: ${stats.patient_status.serious}`} />
            </div>

            <div className="card">
                <h4>Quick Actions</h4>
                <div style={{display: 'flex', gap: '1rem'}}>
                    <button className="primary-btn" onClick={() => setShowPatientModal(true)}>
                        <i className="fas fa-user-plus"></i> Register New Patient
                    </button>
                    <button className="primary-btn" style={{background: 'var(--secondary)'}}>
                        <i className="fas fa-user-md"></i> Manage Doctors
                    </button>
                </div>
            </div>

            {/* Add Patient Modal */}
            {showPatientModal && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
                    <div className="card" style={{width: 400, marginBottom: 0}}>
                        <h3 style={{marginTop:0}}>Register Patient</h3>
                        <input placeholder="Name" value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} />
                        <div style={{display:'flex', gap:10}}>
                            <input placeholder="Age" type="number" value={pForm.age} onChange={e => setPForm({...pForm, age: e.target.value})} />
                            <select value={pForm.gender} onChange={e => setPForm({...pForm, gender: e.target.value})}>
                                <option>Male</option><option>Female</option>
                            </select>
                        </div>
                        <input placeholder="Contact" value={pForm.contact} onChange={e => setPForm({...pForm, contact: e.target.value})} />
                        <input placeholder="Weight (kg)" type="number" value={pForm.weight} onChange={e => setPForm({...pForm, weight: e.target.value})} />
                        <input placeholder="Allergies" value={pForm.allergies} onChange={e => setPForm({...pForm, allergies: e.target.value})} />
                        
                        <label style={{display:'block', marginBottom:5, fontWeight:500}}>Condition Severity</label>
                        <select value={pForm.severity} onChange={e => setPForm({...pForm, severity: e.target.value})}>
                            <option value="Normal">Normal (No Bed)</option>
                            <option value="Serious">Serious (General Ward)</option>
                            <option value="Critical">Critical (ICU)</option>
                        </select>

                        <div style={{marginTop: 20, display:'flex', justifyContent:'flex-end', gap:10}}>
                            <button className="primary-btn" onClick={handleAddPatient}>Register</button>
                            <button className="primary-btn" style={{background:'#ccc'}} onClick={() => setShowPatientModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DoctorDashboard = ({ user }) => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/appointments?role=doctor&linked_id=${user.linked_id}`)
            .then(res => res.json())
            .then(setAppointments);
    }, []);

    return (
        <div className="dashboard-layout">
            <header className="dash-header">
                <h3>Doctor's Workspace</h3>
                <p>Welcome, Dr. {user.username}</p>
            </header>
            
            <div className="doctor-workspace">
                <div className="appointments-list card">
                    <h4><i className="fas fa-calendar-day"></i> Upcoming Appointments</h4>
                    {appointments.length === 0 ? <p style={{color: '#888'}}>No appointments scheduled.</p> : (
                        <table style={{width: '100%'}}>
                            <thead><tr><th>Date</th><th>Patient ID</th><th>Status</th></tr></thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.date}</td>
                                        <td>{a.patient_id}</td>
                                        <td><span className="badge-confidence">{a.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="ai-tool-wrapper">
                    <div className="card">
                        <h4><i className="fas fa-microscope"></i> AI Diagnostic Lab</h4>
                        <p style={{marginBottom: '1rem', color: '#666'}}>
                            Upload patient X-Rays or MRIs for Deep Learning analysis.
                        </p>
                        <AIConsultation doctorId={user.linked_id} /> 
                    </div>
                </div>
            </div>
        </div>
    );
};

const AIConsultation = ({ doctorId }) => {
    const [file, setFile] = useState(null);
    const [pId, setPId] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if(!pId || !file) return alert("Please select a patient ID and upload an image.");
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('patient_id', pId);
        fd.append('doctor_id', doctorId || "unknown");
        
        try {
            const res = await fetch(`${API_URL}/consultation/ai-assist`, { method: 'POST', body: fd });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            alert("Analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-widget">
            <div className="ai-input-group">
                <div style={{flex: 1}}>
                    <label style={{fontWeight: 500, display: 'block', marginBottom: 5}}>Patient ID</label>
                    <input 
                        placeholder="e.g. pat_1" 
                        value={pId} 
                        onChange={e => setPId(e.target.value)} 
                        style={{marginBottom: 0}}
                    />
                </div>
            </div>
            
            <div className="file-drop-area" onClick={() => document.getElementById('fileInput').click()}>
                <input 
                    id="fileInput" 
                    type="file" 
                    hidden 
                    onChange={e => setFile(e.target.files[0])} 
                    accept="image/*"
                />
                <i className="fas fa-cloud-upload-alt" style={{fontSize: '2rem', color: '#cbd5e1', marginBottom: 10}}></i>
                <p style={{margin: 0, color: '#64748b'}}>
                    {file ? file.name : "Click to Upload X-Ray/MRI"}
                </p>
            </div>

            <button className="primary-btn full-width" onClick={handleAnalyze} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-bolt"></i> Run Deep Learning Analysis</>}
            </button>
            
            {result && (
                <div className="medical-report">
                    <div className="report-header">
                        <h3><i className="fas fa-file-medical-alt"></i> Diagnostic Report</h3>
                        <span className="badge-confidence">Confidence: {result.confidence}</span>
                    </div>
                    <div className="report-body">
                        <div className="diagnosis-highlight">
                            <small>DETECTED CONDITION</small>
                            <h2>{result.condition_detected}</h2>
                        </div>
                        
                        <div className="prescription-section">
                            <h4 style={{color: 'var(--dark)', borderBottom: 'none'}}>
                                <i className="fas fa-pills" style={{color: 'var(--primary)'}}></i> 
                                Recommended Treatment Plan
                            </h4>
                            <div className="prescription-card">
                                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(result.ai_treatment_plan) }}></div>
                            </div>
                        </div>
                        
                        <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button className="primary-btn" style={{background: 'var(--success)'}}>
                                <i className="fas fa-check"></i> Approve & Prescribe
                            </button>
                            <button className="primary-btn" style={{background: '#ef4444'}}>
                                <i className="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PatientDashboard = ({ user }) => {
    const [symptoms, setSymptoms] = useState("");
    const [aiAdvice, setAiAdvice] = useState(null);

    const checkSymptoms = async () => {
        const res = await fetch(`${API_URL}/patient/symptom-check`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ symptoms })
        });
        const data = await res.json();
        setAiAdvice(data.advice);
    };

    return (
        <div className="dashboard-layout">
            <header className="dash-header">
                <h3>My Health Portal</h3>
                <p>Hello, {user.username}</p>
            </header>
            <div className="patient-tools">
                <div className="card">
                    <h4><i className="fas fa-comment-medical"></i> AI Symptom Checker</h4>
                    <textarea 
                        placeholder="Describe what you are feeling..." 
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                    ></textarea>
                    <button className="primary-btn" onClick={checkSymptoms}>Check Symptoms</button>
                    {aiAdvice && (
                        <div style={{marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--success)'}}>
                            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(aiAdvice) }}></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP SHELL ---
const App = () => {
    const [user, setUser] = useState(null);
    const logout = () => setUser(null);

    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="app-container">
            <nav className="sidebar">
                <div className="brand"><i className="fas fa-heartbeat"></i> AI Hospital</div>
                <div className="user-profile">
                    <div className="avatar">{user.username[0].toUpperCase()}</div>
                    <div>
                        <p style={{margin:0, fontWeight:600}}>{user.username}</p>
                        <small style={{color:'#666'}}>{user.role.toUpperCase()}</small>
                    </div>
                </div>
                <ul className="nav-links">
                    <li className="active"><i className="fas fa-columns"></i> Dashboard</li>
                    <li onClick={logout}><i className="fas fa-sign-out-alt"></i> Logout</li>
                </ul>
            </nav>
            <main className="content">
                {user.role === 'admin' && <AdminDashboard />}
                {user.role === 'doctor' && <DoctorDashboard user={user} />}
                {user.role === 'patient' && <PatientDashboard user={user} />}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
