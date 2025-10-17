import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FaUsers, FaMapMarkerAlt, FaStar, FaFilePdf } from 'react-icons/fa';
import moment from 'moment';
import { db } from '../firebase';
import { generateUserAnalyticsPDF } from "../components/UserAnalyticsPDF";
import { collection, getDocs } from 'firebase/firestore';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

// --- Skeleton Components ---

const SkeletonCard = () => (
    <div className="card skeleton">
        <div className="skeleton skeleton-icon"></div>
        <div className="skeleton skeleton-title-sm"></div>
        <div className="skeleton skeleton-text-lg"></div>
    </div>
);

const SkeletonFeedbackList = () => (
    <div className="skeleton-feedback-list">
        <div className="skeleton" style={{ height: 45, marginBottom: 20, width: '100%' }}></div>
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-feedback-item"></div>
        ))}
    </div>
);

const SkeletonChart = () => (
    <div className="skeleton" style={{ height: 300, borderRadius: 10, width: '100%' }}></div>
);


const AnalysisReport = () => {
    const currentYear = new Date().getFullYear();
    const [users, setUsers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [topRatedLocation, setTopRatedLocation] = useState(null);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [filter, setFilter] = useState('Monthly');
    const [userType, setUserType] = useState('All');
    const [activeFeedbackTab, setActiveFeedbackTab] = useState('location');
    const [loading, setLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState('top');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userSnapshot = await getDocs(collection(db, 'users'));
                const userList = userSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.uid,
                        name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                        age: data.age || 0,
                        gender: data.gender || '',
                        userType: (data.userType || '').toLowerCase(),
                        registeredDate: data.createdAt?.toDate() || null, // Ensure it's a date object
                    };
                });
                setUsers(userList);

                const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
                const feedbackList = feedbackSnapshot.docs.map(doc => doc.data());
                setFeedbacks(feedbackList);

                const ratings = feedbackList.map(f => f.rating).filter(r => typeof r === 'number');
                const avg = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
                setAverageRating(parseFloat(avg.toFixed(1)));

                const locationRatings = {};
                feedbackList.forEach(fb => {
                    if (fb.location && typeof fb.rating === 'number') {
                        if (!locationRatings[fb.location]) locationRatings[fb.location] = { total: 0, count: 0 };
                        locationRatings[fb.location].total += fb.rating;
                        locationRatings[fb.location].count += 1;
                    }
                });

                let topLocation = null;
                let maxAvg = 0;
                for (const [loc, { total, count }] of Object.entries(locationRatings)) {
                    const avgRating = total / count;
                    if (avgRating > maxAvg) {
                        maxAvg = avgRating;
                        topLocation = { name: loc, rating: avgRating };
                    }
                }
                setTopRatedLocation(topLocation);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (userType.toLowerCase() !== 'all' && user.userType.toLowerCase() !== userType.toLowerCase()) {
                return false;
            }
            const date = moment(user.registeredDate);
            if (!date.isValid()) return false;
            
            // For Monthly and Quarterly, filter by selectedYear
            if