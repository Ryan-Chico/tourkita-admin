import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import Carousel from '../components/Carousel';

const HomePage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const cards = document.querySelectorAll('.info-card');

        const handleMouseMove = (e) => {
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const rotateY = (x / rect.width) * 20; // Max rotation 10deg
                const rotateX = (y / rect.height) * -20; // Max rotation -10deg

                card.style.setProperty('--rotateY', `${rotateY}deg`);
                card.style.setProperty('--rotateX', `${rotateX}deg`);
            });
        };

        const handleMouseLeave = () => {
            cards.forEach(card => {
                card.style.setProperty('--rotateY', '0deg');
                card.style.setProperty('--rotateX', '0deg');
            });
        }

        const container = document.querySelector('.info-slides');
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []);
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

            <section className="info-slides-section fade-in-up">
                <h2>Why Choose TourKita?</h2>
                \
                <div className="info-slides">
                    <div className="info-card ar fade-in-left" style={{ animationDelay: '0.2s' }}>
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9.75 6l-3-2.25 3-2.25m-3 4.5h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H3.375M17.25 9.75l-3 2.25 3 2.25m3-4.5h-3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125H20.25" />
                            </svg>
                        </div>
                        <h4>Augmented Reality</h4>
                        <p>See the past come alive with AR visuals of historical sites and people.</p>
                    </div>
                    <div className="info-card nav fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h.008v.008H15.5V4.5m-3.75 0h.008v.008H11.75V4.5m-3.75 0h.008v.008H8V4.5m0 3.75h.008v.008H8v-.008zm0 3.75h.008v.008H8v-.008zm0 3.75h.008v.008H8v-.008zm3.75-11.25h.008v.008H11.75V4.5zm3.75 0h.008v.008H15.5V4.5zM8 12.75h7.5" />
                            </svg>
                        </div>
                        <h4>Live Navigation</h4>
                        <p>Get directions to landmarks and explore hidden gems around Intramuros.</p>
                    </div>

                    <div className="info-card guide fade-in-right" style={{ animationDelay: '0.6s' }}>
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h4>Interactive Guides</h4>
                        <p>Tap on pins to learn about places, restaurants, events, and more.</p>
                    </div>
                </div>
            </section>

            <section className="how-tourkita-works fade-in-zoom">
                <h2 className="tourkita-steps-title">How TourKita Works</h2>

                {/* === START: REPLACE THE .tourkita-steps-container DIV WITH THIS === */}
                <div className="tourkita-steps-container">
                    {/* Step 1 */}
                    <div className="tourkita-step-card" style={{ animationDelay: '0.2s' }}>
                        <div className="step-number">01</div>
                        <div className="step-icon-circle" style={{ background: 'linear-gradient(145deg, #1c3d5a, #3b7ca9)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                        </div>
                        <h4>Download the App</h4>
                        <p>Get TourKita on your mobile to start your adventure.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="tourkita-step-card" style={{ animationDelay: '0.4s' }}>
                        <div className="step-number">02</div>
                        <div className="step-icon-circle" style={{ background: 'linear-gradient(145deg, #704527, #a5704b)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <h4>Create an Account</h4>
                        <p>Sign up for full features or explore immediately as a guest.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="tourkita-step-card" style={{ animationDelay: '0.6s' }}>
                        <div className="step-number">03</div>
                        <div className="step-icon-circle" style={{ background: 'linear-gradient(145deg, #1c7c9c, #3aabb1)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h.008v.008H15.5V4.5m-3.75 0h.008v.008H11.75V4.5m-3.75 0h.008v.008H8V4.5m0 3.75h.008v.008H8v-.008zm0 3.75h.008v.008H8v-.008zm0 3.75h.008v.008H8v-.008z" />
                            </svg>
                        </div>
                        <h4>Explore Landmarks</h4>
                        <p>Browse historical spots or find AR-supported locations.</p>
                    </div>

                    {/* Step 4 */}
                    <div className="tourkita-step-card" style={{ animationDelay: '0.8s' }}>
                        <div className="step-number">04</div>
                        <div className="step-icon-circle" style={{ background: 'linear-gradient(145deg, #d38612, #e8a845)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                        </div>
                        <h4>Activate AR Camera</h4>
                        <p>Use your phone's camera to see the past come alive.</p>
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
