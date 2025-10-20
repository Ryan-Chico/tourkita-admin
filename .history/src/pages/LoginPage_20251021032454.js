import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // This CSS file will be completely replaced
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import TourkitaLogo from '../assets/TourkitaLogo.jpg';
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
            // Modern Firebase often uses 'auth/invalid-credential' for both wrong email/password
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
                <div className="card-header">
                    <img src={TourkitaLogo} alt="TourKita Logo" className="logo" />
                    <h1>TourKita Admin</h1>
                    <p>Heritage Site Management Console</p>
                </div>

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
                                placeholder="e.g., admin@tourkita.com"
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
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                aria-label="Toggle password visibility"
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;