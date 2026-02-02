import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id.replace('-input', '')]: e.target.value });
    };

    const validateForm = () => {
        if (isRegister) {
            if (formData.name.trim().length < 2) {
                return "Name must be at least 2 characters long.";
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                return "Please enter a valid email address.";
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                return "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.";
            }
        } else {
            if (!formData.email || !formData.password) {
                return "Please fill in all fields.";
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const { email, password, name } = formData;
            if (isRegister) {
                await authService.register({ email, password, name });
                setIsRegister(false);
                setError('Registration successful! Please login.');
            } else {
                const response = await authService.login({ email, password });
                const { accessToken, user } = response.data;
                const userData = user || { name: email.split('@')[0], email, role: email.includes('admin') ? 'admin' : 'user' };
                login(userData, accessToken);
                navigate(userData.role === 'admin' ? '/admin' : '/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                    {isRegister ? 'Create Account' : 'Authentication'}
                </h2>

                {!isRegister && <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.1rem' }}>Login</h3>}
                {isRegister && <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.1rem' }}>Register</h3>}

                {error && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        borderRadius: '0.5rem',
                        background: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: error.includes('successful') ? 'var(--success)' : 'var(--error)',
                        border: `1px solid ${error.includes('successful') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                id="name-input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            id="email-input"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            id="password-input"
                            placeholder="******"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {isRegister ? 'Back to Login' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
