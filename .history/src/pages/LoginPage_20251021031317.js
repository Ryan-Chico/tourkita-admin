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
        if (loading) return; // Prevent multiple submissions
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
            console.error(err.code, err.message);
            // Firebase now often returns 'auth/invalid-credential' for both wrong email and password
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please check your credentials.');
            } else if (err.code === 'auth/invalid-email') {
                setError('The email format is invalid.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Toggle function for password visibility
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div className="login-page-wrapper">
            <div className="background-shapes"></div>
            <div className="login-container">
                <div className="login-header">
                    <img src={TourkitaLogo} alt="TourKita Logo" className="logo" />
                    <h2>Admin Portal</h2>
                    <p>Welcome back! Please enter your details.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email-input" className="sr-only">Email</label>
                        <FaEnvelope className="input-icon" />
                        <input
                            id="email-input"
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password-input" className="sr-only">Password</label>
                        <FaLock className="input-icon" />
                        <input
                            id="password-input"
                            type={passwordVisible ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility} aria-label="Toggle password visibility">
                            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                        </button>
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