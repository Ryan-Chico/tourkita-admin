import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import Carousel from '../components/Carousel';

const HomePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right, .fade-in-zoom');
        const handleScroll = () => {
            fadeElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top <= window.innerHeight * 0.85) {
                    el.classList.add('visible');
                }
            });
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="home-wrapper">
            {/* Header */}
            <header className="home-header">
                <div className="header-left">
                    <img src={logo} alt="TourKita" className="header-logo" />
                    <span className="header-title">TourKita</span>
                </div>
                <div className="header-right">
                    <button onClick={() => navigate("/faqs")} className="header-link">FAQ</button>
                    <button onClick={() => navigate("/privacy")} className="header-link">Privacy Policy</button>
                    <button className="header-button" onClick={() => navigate('/login')}>Admin Login</button>
                </div>
            </header>

            <div className="carousel-wrapper">
                <Carousel />
                <div className="hero-overlay">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>With AR, navigation, and historical guides at your fingertips</p>
                </div>

                <div className="download-banner">
                    <h2>Ready to Explore?</h2>
                    <p>Experience the history of Intramuros like never before with TourKita</p>
                    <div className="download-buttons">
                        <button className="download-btn android">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="btn-icon">
                                <path d="M21.5,12a9.5,9.5,0,0,0-9.5-9.5A9.5,9.5,0,0,0,2.5,12a9.5,9.5,0,0,0,9.5,9.5A9.5,9.5,0,0,0,21.5,12Zm-17,0A7.5,7.5,0,0,1,12,4.5,7.5,7.5,0,0,1,19.5,12,7.5,7.5,0,0,1,12,19.5,7.5,7.5,0,0,1,4.5,12Zm5.53,3.67,4.88-2.58a.5.5,0,0,0,0-.9L10,9.55a.5.5,0,0,0-.74.45v5.22a.5.5,0,0,0,.77.45Z" />
                            </svg>
                            <div className="btn-text">
                                <span className="btn-sub-text">Download Now</span>
                                <span className="btn-main-text">Android</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
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

            {/* How it Works */}
            <section className="how-tourkita-works fade-in-zoom">
                <h2 className="tourkita-steps-title">How TourKita Works</h2>
                <div className="tourkita-steps-container">
                    <div className="tourkita-step-line"></div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.2s' }}>
                        <div className="step-icon-circle" style={{ background: '#1c3d5a' }}>📲</div>
                        <h3>Step 1</h3>
                        <h4>Download the App</h4>
                        <p>Get TourKita on your mobile and start your adventure in Intramuros.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.4s' }}>
                        <div className="step-icon-circle" style={{ background: '#704527' }}>👤</div>
                        <h3>Step 2</h3>
                        <h4>Sign Up or Guest Access</h4>
                        <p>Log in for full features or explore immediately as a guest.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.6s' }}>
                        <div className="step-icon-circle" style={{ background: '#1c7c9c' }}>🗺️</div>
                        <h3>Step 3</h3>
                        <h4>Explore Landmarks</h4>
                        <p>Browse historical spots or go straight to AR-supported locations.</p>
                    </div>
                    <div className="tourkita-step-card" style={{ animationDelay: '0.8s' }}>
                        <div className="step-icon-circle" style={{ background: '#d38612' }}>🔍</div>
                        <h3>Step 4</h3>
                        <h4>Activate AR Camera</h4>
                        <p>Use your phone's AR view to see the past come alive in real time.</p>
                    </div>
                </div>
            </section>

            {/* About Us */}
            <section className="about-us-section fade-in-left">
                <h2 className="about-us-title">About Us</h2>
                <div className="about-us-container">
                    <img
                        src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80"
                        alt="TourKita Team or Experience"
                        className="about-us-image"
                    />
                    <div className="about-us-text">
                        <h4>Our Mission</h4>
                        <p>
                            TourKita is dedicated to bringing history to life through augmented reality and interactive navigation.
                            Our goal is to make exploring Intramuros an immersive, educational, and memorable experience for everyone.
                        </p>
                        <h4>Our Vision</h4>
                        <p>
                            We envision a world where technology and culture intersect, allowing tourists and locals alike to engage
                            deeply with the rich history of Intramuros while preserving its heritage for generations to come.
                        </p>
                    </div>
                </div>
            </section>

            {/* Partnership */}
            <section className="partnership-section fade-in-right">
                <h3>In Partnership With</h3>
                <img
                    src="https://intramuros.gov.ph/wp-content/uploads/2016/11/Logo100x100-1.png"
                    alt="Intramuros Administration Logo"
                    className="intramuros-logo"
                />
                <p className="partner-name">Intramuros Administration</p>
                <p>TourKita works closely with the Intramuros Administration to bring you verified, culturally rich content and real-time historical experiences.</p>
            </section>

            {/* Footer */}
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
                        <a href="/terms" className="footer-link">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
