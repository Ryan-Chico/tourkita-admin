import React, { useEffect, useState } from 'react';
import './Carousel.css';
import img1 from '../assets/carousel1.jpg';
import img2 from '../assets/carousel2.jpg';
import img3 from '../assets/carousel3.jpg';

const images = [img1, img2, img3];

const Carousel = () => {
    const [index, setIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    // This effect handles the automatic sliding
    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 4000); // The carousel will still auto-play every 4 seconds
        return () => clearInterval(timer);
    }, []);

    // Handles the start of a touch/swipe
    const handleTouchStart = (e) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    // Handles the end of a touch/swipe
    const handleTouchEnd = () => {
        // Check if the swipe was significant enough
        if (touchStartX - touchEndX > 75) {
            // Swiped left
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        } else if (touchStartX - touchEndX < -75) {
            // Swiped right
            setIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        }
    };

    return (
        <div
            className="carousel"
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="carousel-inner"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {images.map((imgSrc, i) => (
                    <img key={i} src={imgSrc} alt={`Slide ${i}`} className="carousel-image" />
                ))}
            </div>

            {/* Navigation Dots */}
            <div className="carousel-dots">
                {images.map((_, dotIndex) => (
                    <button
                        key={dotIndex}
                        className={`dot ${index === dotIndex ? 'active' : ''}`}
                        onClick={() => setIndex(dotIndex)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Carousel;