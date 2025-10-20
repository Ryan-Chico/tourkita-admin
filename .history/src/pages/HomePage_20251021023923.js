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

                <div className="info-slides">
                    <div className="info-card ar fade-in-left" style={{ animationDelay: '0.2s' }}>
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15h15V4.5h-15zm9 3.75h.008v.008H12.75v-.008zm0 3h.008v.008H12.75v-.008zm0 3h.008v.008H12.75v-.008zm-3-6h.008v.008H9.75v-.008zm0 3h.008v.008H9.75v-.008zm0 3h.008v.008H9.75v-.008zm-3-6h.008v.008H6.75v-.008zm0 3h.008v.008H6.75v-.008zm0 3h.008v.008H6.75v-.008z" />
                            </svg>
                        </div>
                        <h4>Augmented Reality</h4>
                        <p>See the past come alive with AR visuals of historical sites and people.</p>
                    </div>
                    <div className="info-card nav fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="info-icon">
                            <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
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
            <section className="about-us-section fade-in">
                <div className="about-us-container">
                    <div className="about-us-image-wrapper fade-in-left" style={{ animationDelay: '0.2s' }}>
                        <img
                            src="https://admin-login-244c5.web.app/static/media/TourKitaCropped.da93bb302223e3efab3a.jpg"
                            alt="Intramuros Historical Site"
                            className="about-us-image"
                        />
                    </div>
                    <div className="about-us-text fade-in-right" style={{ animationDelay: '0.4s' }}>
                        <h2 className="about-us-title">Our Story</h2>
                        <h4>Who We Are</h4>
                        <p>
                            TourKita was born from a passion for history and technology. We are a team of developers and history enthusiasts dedicated to creating a new way to experience the rich heritage of Intramuros.
                        </p>
                        <h4>Our Mission</h4>
                        <p>
                            Our goal is to make exploring Intramuros an immersive, educational, and memorable adventure for everyone by bringing history to life through augmented reality and interactive navigation.
                        </p>
                        <h4>Our Vision</h4>
                        <p>
                            We envision a world where technology and culture intersect, allowing tourists and locals alike to engage deeply with the rich history of Intramuros while preserving its legacy for generations to come.
                        </p>
                    </div>
                </div>
            </section>

            {/* Partnership */}
            <section className="partnership-section fade-in">
                <div className="partnership-container">
                    <div className="partnership-logo-wrapper fade-in-left" style={{ animationDelay: '0.2s' }}>
                        <img
                            src="https://intramuros.gov.ph/wp-content/uploads/2016/11/Logo100x100-1.png"
                            alt="Intramuros Administration Logo"
                            className="intramuros-logo"
                        />
                    </div>
                    <div className="partnership-text fade-in-right" style={{ animationDelay: '0.4s' }}>
                        <h2>In Official Partnership With</h2>
                        <p className="partner-name">Intramuros Administration</p>
                        <p>
                            TourKita works closely with the Intramuros Administration to bring you verified,
                            culturally rich content and real-time historical experiences, ensuring an authentic
                            and educational adventure.
                        </p>
                        <button
                            className="partnership-cta-btn"
                            onClick={() => window.open('https://intramuros.gov.ph', '_blank', 'noreferrer')}
                        >
                            Visit Their Website
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-main">
                    <div className="footer-column footer-about">
                        <div className="footer-logo-container">
                            <img src={logo} alt="TourKita" className="footer-logo" />
                            <span className="footer-title">TourKita</span>
                        </div>
                        <p>Bringing history to life through augmented reality. Explore the rich heritage of Intramuros with an immersive and educational adventure.</p>
                    </div>

                    <div className="footer-column footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="/faqs">FAQ</a></li>
                            <li><a href="/privacy">Privacy Policy</a></li>
                            <li><a href="/terms">Terms of Service</a></li>
                            <li><a href="https://intramuros.gov.ph" target="_blank" rel="noreferrer">Intramuros Admin</a></li>
                        </ul>
                    </div>


                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} TourKita. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
