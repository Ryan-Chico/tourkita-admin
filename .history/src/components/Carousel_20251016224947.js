import React, { useEffect, useState } from 'react';
import './Carousel.css';
import img1 from '../assets/carousel1.jpg';
import img2 from '../assets/carousel2.jpg';
import img3 from '../assets/carousel3.jpg';

const images = [img1, img2, img3];

const Carousel = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="carousel">
            <img src={images[index]} alt={`Slide ${index}`} className="carousel-image" />
        </div>
    );
};

export default Carousel;
