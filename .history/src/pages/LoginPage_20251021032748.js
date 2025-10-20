import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // This CSS file will be completely replaced
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import TourkitaLogo from '../assets/';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const allowedAdminDomain = '@tourkita.com';
const allowedAdminEmails = ['admin@tourkita.com'];

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim();

        if (!trimmedEmail.endsWith(allowedAdminDomain) && !allowedAdminEmails.includes(trimmedEmail)) {
            setError('Access denied. This portal is for administrators only.');
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            navigate('/dashboard');
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please check your credentials.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card">
                {/* Left Side: Thematic Image Panel */}
                <div className="card-image-panel">
                    <div className="image-overlay">
                        <img src={TourkitaLogo} alt="TourKita Logo" className="logo" />
                        <h2>TourKita</h2>
                        <p>Intramuros AR Management</p>
                    </div>
                </div>

                {/* Right Side: Form Panel */}
                <div className="card-form-panel">
                    <h3>Administrator Sign In</h3>
                    <p className="form-subtitle">Welcome back. Please enter your credentials.</p>

                    <form onSubmit={handleLogin} className="login-form">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    id="password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                >
                                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;