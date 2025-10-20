import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Added eye icons
import TourkitaLogo from '../assets/TourkitaLogo.jpg';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const allowedAdminDomain = '@tourkita.com';
const allowedAdminEmails = ['admin@tourkita.com'];

const LoginPage = () => {
    // 1. Renamed 'username' to 'email' for clarity & added new states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // For login feedback
    const [passwordVisible, setPasswordVisible] = useState(false); // For password toggle
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true); // 2. Set loading to true on submission

        const trimmedEmail = email.trim();

        if (!trimmedEmail.endsWith(allowedAdminDomain) && !allowedAdminEmails.includes(trimmedEmail)) {
            setError('Access denied. Admins only.');
            setLoading(false); // Stop loading on validation fail
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format.');
            } else {
                setError('Authentication failed. Please try again later.');
            }
        } finally {
            setLoading(false); // 3. Set loading to false after completion
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={TourkitaLogo} alt="TourKita Logo" className="logo" />

                {/* 4. Error message with improved class for animation */}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email-input" className="sr-only">Email</label>
                        <FaUser className="input-icon" />
                        <input
                            id="email-input"
                            type="email"
                            placeholder="EMAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password-input" className="sr-only">Password</label>
                        <FaLock className="input-icon" />
                        <input
                            id="password-input"
                            type={passwordVisible ? 'text' : 'password'} // 5. Dynamic input type
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {/* 6. Password visibility toggle icon */}
                        <div className="password-toggle-icon" onClick={() => setPasswordVisible(!passwordVisible)}>
                            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                        </div>
                    </div>

                    {/* 7. Button disabled based on loading state */}
                    <button type="submit" disabled={loading}>
                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;