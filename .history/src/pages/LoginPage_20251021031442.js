import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
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
        <div className="login-page">
            {/* Left side: Illustration and Branding */}
            <div className="login-illustration">
                <div className="illustration-content">
                    <h1>TourKita</h1>
                    <p>Your Gateway to Managing Intramuros.</p>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="login-form-area">
                <div className="form-container">
                    <img src={TourkitaLogo} alt="TourKita Logo" className="form-logo" />
                    <h2>Admin Sign In</h2>
                    <p className="form-subtitle">Welcome back, please enter your details.</p>

                    <form onSubmit={handleLogin}>
                        {error && <div className="error-message">{error}</div>}

                        {/* Email Input with Floating Label */}
                        <div className="input-group">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder=" " /* Placeholder is needed for the CSS effect */
                            />
                            <label htmlFor="email">Email Address</label>
                            <FaEnvelope className="input-icon" />
                        </div>

                        {/* Password Input with Floating Label */}
                        <div className="input-group">
                            <input
                                id="password"
                                type={passwordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder=" " /* Placeholder is needed for the CSS effect */
                            />
                            <label htmlFor="password">Password</label>
                            <FaLock className="input-icon" />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                aria-label="Toggle password visibility"
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;