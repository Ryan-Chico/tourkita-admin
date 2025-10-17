import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import Carousel from '../components/Carousel';

const HomePage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for the hamburger menu

    // More performant way to handle scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.15 // Triggers when 15% of the element is visible
        });

        const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right, .fade-in-zoom');
        fadeElements.forEach(el => observer.observe(el));

        // Cleanup observer on component unmount
        return () => observer.disconnect();
    }, []);

    const handleNavigate = (path) => {
        navigate(path);
        setIsMenuOpen(false); // Close menu on navigation
    };

    return (
        <div className="home-wrapper">
            <header className="home-header">
                <div className="header-left">
                    <img src={logo} alt="TourKita" className="header-logo" />
                    <span className="header-title">TourKita</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="header-right">
                    <button onClick={() => handleNavigate("/faqs")} className="header-link">FAQ</button>
                    <button onClick={() => handleNavigate("/privacy")} className="header-link">Privacy Policy</button>
                    <button className="header-button" onClick={() => handleNavigate('/login')}>Admin Login</button>
                </nav>

                {/* Hamburger Menu Button */}
                <button className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </button>
            </header>

            {/* Mobile Navigation Menu */}
            <div className={`mobile-nav ${isMenuOpen ? 'active' : ''}`}>
                <button onClick={() => handleNavigate("/faqs")} className="mobile-nav-link">FAQ</button>
                <button onClick={() => handleNavigate("/privacy")} className="mobile-nav-link">Privacy Policy</button>
                <button onClick={() => handleNavigate('/login')} className="mobile-nav-link">Admin Login</button>
            </div>

            <div className="carousel-wrapper">
                <Carousel />
                <div className="hero-overlay">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>With AR, navigation, and historical guides at your fingertips</p>
                </div>
                <div className="download-banner">
                    <h2>Ready to Explore?</h2>
                    <p>Download the TourKita app now!</p>
                    <div className="download-buttons">
                        <button className="download-btn android">Download for Android</button>
                    </div>
                </div>
            </div>

            <section className="info-slides-section fade-in-up">
                <h2>Why Choose TourKita?</h2>
                <div className="info-slides">
                    <div className="info-card ar fade-in-left" style={{ animationDelay: '0.2s' }}>
                        <div className="info-icon">🕶️</div>
                        <h4>Augmented Reality</h4>
                        <p>See the past come alive with AR visuals of historical sites and people.</p>
                    </div>
                    <div className="info-card nav fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="info-icon">🗺️</div>
                        <h4>Live Navigation</h4>
                        <p>Get directions to landmarks and explore hidden gems around Intramuros.</p>
                    </div>
                    <div className="info-card guide fade-in-right" style={{ animationDelay: '0.6s' }}>
                        <div className="info-icon">👤</div>
                        <h4>Interactive Guides</h4>
                        <p>Tap on pins to learn about places, restaurants, events, and more.</p>
                    </div>
                </div>
            </section>

            <section className="how-tourkita-works fade-in-zoom">
                <h2 className="tourkita-steps-title">How TourKita Works</h2>
                <div className="tourkita-steps-container">
                    <div className="tourkita-step-card" style={{ animationDelay: '0.2s' }}>
                        <div className="step-icon-circle">📲</div>
                        <h3>Step 1</h3>
                        <h4>Download the App</h4>
                        <p>Get TourKita on your mobile and start your adventure.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.4s' }}>
                        <div className="step-icon-circle">👤</div>
                        <h3>Step 2</h3>
                        <h4>Sign Up or Guest</h4>
                        <p>Log in for full features or explore immediately as a guest.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.6s' }}>
                        <div className="step-icon-circle">🗺️</div>
                        <h3>Step 3</h3>
                        <h4>Explore Landmarks</h4>
                        <p>Browse historical spots or go to AR-supported locations.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.8s' }}>
                        <div className="step-icon-circle">🔍</div>
                        <h3>Step 4</h3>
                        <h4>Activate AR</h4>
                        <p>Use your phone's AR view to see the past come alive.</p>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <img src={logo} alt="TourKita" className="footer-logo" />
                        <p>&copy; {new Date().getFullYear()} TourKita. All rights reserved.</p>
                    </div>
                    <div className="footer-right">
                        <a href="/faqs" className="footer-link">FAQ</a>
                        <a href="https://intramuros.gov.ph" target="_blank" rel="noreferrer" className="footer-link">Intramuros Admin</a>
                        <a href="/privacy" className="footer-link">Privacy Policy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;