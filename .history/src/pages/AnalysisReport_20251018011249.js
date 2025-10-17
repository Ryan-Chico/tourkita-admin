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
            if (filter === 'Monthly' || filter === 'Quarterly') {
                return date.year() === selectedYear;
            }
            // For Yearly, the data itself is grouped by year, so we don't pre-filter by a single year
            return true;
        });
    }, [selectedYear, userType, filter, users]);

    const getGroupedFeedback = (typeKey, labelKey) => {
        const relevant = feedbacks.filter(f => f.feedbackType === typeKey && typeof f.rating === 'number');
        const grouped = {};
        relevant.forEach(fb => {
            const key = fb[labelKey] || 'N/A';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(fb.rating);
        });
        let result = Object.entries(grouped).map(([key, ratings]) => {
            const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            return { name: key, average: parseFloat(avg.toFixed(1)), count: ratings.length };
        });
        result.sort((a, b) => ratingFilter === 'top' ? b.average - a.average : a.average - b.average);
        return showAll ? result : result.slice(0, 5);
    };

    const locationFeedbacks = useMemo(() => getGroupedFeedback('Location Feedback', 'location'), [feedbacks, ratingFilter, showAll]);
    const appFeedbacks = useMemo(() => getGroupedFeedback('App Feedback', 'feature'), [feedbacks, ratingFilter, showAll]);

    const locationCount = useMemo(() => feedbacks.filter(f => f.feedbackType === 'Location Feedback').length, [feedbacks]);
    const appCount = useMemo(() => feedbacks.filter(f => f.feedbackType === 'App Feedback').length, [feedbacks]);

    const getUserActivityData = useMemo(() => {
        const activity = {};
        let periodKeys;

        if (filter === 'Monthly') {
            periodKeys = moment.monthsShort();
        } else if (filter === 'Quarterly') {
            periodKeys = ['Q1', 'Q2', 'Q3', 'Q4'];
        } else { // Yearly
            const years = [...new Set(users.map(u => moment(u.registeredDate).year()))].filter(Boolean);
            periodKeys = years.sort().map(String);
        }

        periodKeys.forEach(pk => { activity[pk] = { users: 0 } });

        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            if (!date.isValid()) return;

            let key;
            if (filter === 'Monthly') {
                key = date.format('MMM');
            } else if (filter === 'Quarterly') {
                const monthIndex = date.month();
                key = monthIndex <= 2 ? 'Q1' : monthIndex <= 5 ? 'Q2' : monthIndex <= 8 ? 'Q3' : 'Q4';
            } else { // Yearly
                key = date.year().toString();
            }
            if (activity[key]) {
                activity[key].users += 1;
            }
        });

        return periodKeys.map(pk => ({ name: pk, users: activity[pk].users }));
    }, [filteredUsers, filter, users]);

    // Other charts (gender, userType, ageGroup) are omitted for brevity but would follow a similar memoization pattern

    const showYearSelection = filter !== 'Yearly';

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="report-header"><h2>Analysis & Reports</h2></div>

                {/* Cards */}
                <div className="cards-container">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <div className="card brown">
                                <FaStar size={22} color="#F39C12" />
                                <h2>Average Rating</h2>
                                <p className="big-number">{averageRating.toFixed(1)}</p>
                            </div>
                            <div className="card brown">
                                <FaUsers size={22} color="#3498DB" />
                                <h2>Registered Users</h2>
                                <p className="big-number">{filteredUsers.length.toLocaleString()}</p>
                            </div>
                            <div className="card brown">
                                <FaMapMarkerAlt size={22} color="#9B59B6" />
                                <h2>Top Destination</h2>
                                <p className="big-number">
                                    {topRatedLocation
                                        ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})`
                                        : 'N/A'}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Feedback Overview */}
                <div className="chart-container">
                    <h3>Feedback Overview</h3>
                    {loading ? <SkeletonFeedbackList /> : (
                        <>
                            <div className="tab-bars markers-tabs">
                                <div className="tabs-left">
                                    <button className={`mtab ${activeFeedbackTab === 'location' ? 'active' : ''}`} onClick={() => setActiveFeedbackTab('location')}>Location Feedback</button>
                                    <button className={`mtab ${activeFeedbackTab === 'app' ? 'active' : ''}`} onClick={() => setActiveFeedbackTab('app')}>App Feedback</button>
                                </div>
                                <div className="tabs-right top5-tabs">
                                    <button className={`top5-brown-tab ${ratingFilter === 'top' ? 'active' : ''}`} onClick={() => setRatingFilter('top')}>Top Highest</button>
                                    <button className={`top5-brown-tab ${ratingFilter === 'lowest' ? 'active' : ''}`} onClick={() => setRatingFilter('lowest')}>Top Lowest</button>
                                    <button className={`top5-brown-tab ${showAll ? 'active' : ''}`} onClick={() => setShowAll(!showAll)}>{showAll ? 'Show Top 5' : 'Show All'}</button>
                                </div>
                            </div>

                            {activeFeedbackTab === 'location' && (
                                <>
                                    <h4>Location Feedbacks ({locationCount})</h4>
                                    {locationFeedbacks.length > 0 ? locationFeedbacks.map((loc, idx) => (
                                        <div key={idx} className="feedback-card">
                                            <strong>{loc.name}</strong> — Rating: {loc.average}⭐ ({loc.count})
                                        </div>
                                    )) : <p className="no-data-message">No location feedback available.</p>}
                                </>
                            )}

                            {activeFeedbackTab === 'app' && (
                                <>
                                    <h4>App Feedbacks ({appCount})</h4>
                                    {appFeedbacks.length > 0 ? appFeedbacks.map((f, idx) => (
                                        <div key={idx} className="feedback-card">
                                            <strong>{f.name}</strong> — Rating: {f.average}⭐ ({f.count})
                                        </div>
                                    )) : <p className="no-data-message">No app feedback available.</p>}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Filters and Charts */}
                <div className="filter-container mt-8">
                    <div className="chart-filters row-flex">
                        <div className="filter-group">
                            <label>Filter By:</label>
                            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        {showYearSelection && (
                            <div className="filter-group">
                                <label>Year:</label>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                    {[...new Set(users.map(u => moment(u.registeredDate).year()).filter(Boolean))]
                                        .sort((a, b) => b - a)
                                        .map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                </select>
                            </div>
                        )}
                        <div className="filter-group">
                            <label>User Type:</label>
                            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                                <option value="All">All</option>
                                <option value="student">Students</option>
                                <option value="tourist">Tourists</option>
                            </select>
                        </div>
                        <button
                            className="pdf-btn"
                            onClick={() => generateUserAnalyticsPDF({ users: filteredUsers, feedbacks, filter, selectedYear, userType, averageRating, topRatedLocation })}
                        >
                            <FaFilePdf /> Download Analysis PDF
                        </button>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Registration Trends</h3>
                    {loading ? <SkeletonChart /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getUserActivityData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="users" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* Additional charts would follow the same loading pattern */}
            </main>
        </div>
    );
};

export default AnalysisReport;