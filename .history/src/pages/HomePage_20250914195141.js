import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import logo from "../assets/TourKitaCropped.jpg";
import Carousel from "../components/Carousel";

// Hook for fade-in on scroll
const useFadeInOnScroll = (ref, threshold = 0.2) => {
    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    ref.current.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            },
            { threshold }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref, threshold]);
};

const HomePage = () => {
    const navigate = useNavigate();
    const infoRef = useRef(null);
    const stepsRef = useRef(null);
    const aboutRef = useRef(null);
    const partnershipRef = useRef(null);

    useFadeInOnScroll(infoRef);
    useFadeInOnScroll(stepsRef);
    useFadeInOnScroll(aboutRef);
    useFadeInOnScroll(partnershipRef);

    // Floating circles animation
    useEffect(() => {
        const circles = document.querySelectorAll(".floating-circle");
        circles.forEach((circle) => {
            let direction = 1;
            let pos = 0;
            const speed = 0.15 + Math.random() * 0.15;
            const amplitude = 10 + Math.random() * 10;

            const animate = () => {
                pos += speed * direction;
                if (pos > amplitude || pos < -amplitude) direction *= -1;
                circle.style.transform = `translateY(${pos}px)`;
                requestAnimationFrame(animate);
            };
            animate();
        });
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
                    <button onClick={() => navigate("/faqs")} className="header-link">
                        FAQ
                    </button>
                    <button
                        onClick={() => navigate("/privacy")}
                        className="header-link"
                    >
                        Privacy Policy
                    </button>
                    <button
                        className="header-button"
                        onClick={() => navigate("/login")}
                    >
                        Admin Login
                    </button>
                </div>
            </header>

            {/* Hero Carousel */}
            <div className="carousel-wrapper">
                <Carousel />
                <div className="hero-overlay">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>With AR, navigation, and historical guides at your fingertips</p>
                </div>
                <div className="download-banner">
                    <h2>Ready to Explore?</h2>
                    <p>
                        Experience the history of Intramuros like never before with
                        TourKita
                    </p>
                    <div className="download-buttons">
                        <button className="download-btn android">
                            Download for Android
                        </button>
                    </div>
                </div>

                {/* Floating shapes */}
                <div
                    className="floating-circle"
                    style={{ width: 60, height: 60, top: 100, left: 50 }}
                />
                <div
                    className="floating-circle"
                    style={{ width: 40, height: 40, top: 250, left: 200 }}
                />
                <div
                    className="floating-circle"
                    style={{ width: 50, height: 50, top: 150, right: 100 }}
                />
            </div>

            {/* Info Slides */}
            <section ref={infoRef} className="info-slides-section fade-in-section">
                <h2>Why Choose TourKita?</h2>
                <div className="info-slides">
                    <div className="info-card ar">
                        <h4>Augmented Reality</h4>
                        <p>See the past come alive with AR visuals of historical sites and people.</p>
                    </div>
                    <div className="info-card nav">
                        <h4>Live Navigation</h4>
                        <p>Get directions to landmarks and explore hidden gems around Intramuros.</p>
                    </div>
                    <div className="info-card guide">
                        <h4>Interactive Guides</h4>
                        <p>Tap on pins to learn about places, restaurants, events, and more.</p>
                    </div>
                </div>
            </section>

            {/* How TourKita Works */}
            <section ref={stepsRef} className="how-tourkita-works fade-in-section">
                <h2 className="tourkita-steps-title">How TourKita Works</h2>
                <div className="tourkita-steps-container">
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">📲</div>
                        <h3>Step 1</h3>
                        <h4>Download the App</h4>
                        <p>Get TourKita on your mobile and start your adventure in Intramuros.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">👤</div>
                        <h3>Step 2</h3>
                        <h4>Sign Up or Guest Access</h4>
                        <p>Log in for full features or explore immediately as a guest.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">🗺️</div>
                        <h3>Step 3</h3>
                        <h4>Explore Landmarks</h4>
                        <p>Browse historical spots or go straight to AR-supported locations.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">🔍</div>
                        <h3>Step 4</h3>
                        <h4>Activate AR Camera</h4>
                        <p>Use your phone's AR view to see the past come alive in real time.</p>
                    </div>
                </div>
            </section>

            {/* About Us */}
            <section ref={aboutRef} className="about-us-section fade-in-section">
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

            {/* Partnerships */}
            <section ref={partnershipRef} className="partnership-section fade-in-section">
                <h3>In Partnership With</h3>
                <img
                    src="https://intramuros.gov.ph/wp-content/uploads/2016/11/Logo100x100-1.png"
                    alt="Intramuros Administration Logo"
                    className="intramuros-logo"
                />
                <p className="partner-name">Intramuros Administration</p>
                <p>
                    TourKita works closely with the Intramuros Administration to bring you verified, culturally rich content and real-time historical experiences.
                </p>
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
