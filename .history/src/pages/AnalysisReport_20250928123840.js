
    import React, { useState, useEffect, useMemo } from 'react';
    import Sidebar from '../components/Sidebar';
    import './AnalysisReport.css';
    import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
    import { FaUsers, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
    import moment from 'moment';
    import { db } from '../firebase';
    import { collection, getDocs } from 'firebase/firestore';
    import { FaFilePdf } from "react-icons/fa";
    import { generateUserAnalyticsPDF } from "../components/UserAnalyticsPDF";



    const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

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
        const [groupAge, setGroupAge] = useState(false);

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
                            registeredDate: data.createdAt || '',
                        };
                    });
                    setUsers(userList);

                    const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
                    const feedbackList = feedbackSnapshot.docs.map(doc => doc.data());
                    setFeedbacks(feedbackList);

                    const ratings = feedbackList.map(f => f.rating).filter(r => typeof r === 'number');
                    const avg = ratings.length ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) : 0;
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
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, []);

        const guestUsers = users.filter(user => user.userType === 'guest');

        const filteredUsers = useMemo(() => {
            return users.filter(user => {
                if (userType.toLowerCase() !== 'all' && user.userType.toLowerCase() !== userType.toLowerCase()) {
                    return false;
                }

                const date = moment(user.registeredDate);
                if (!date.isValid()) return false;

                if (filter === 'Yearly') {
                    return date.year() === selectedYear;
                }

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

        const locationFeedbacks = getGroupedFeedback('Location Feedback', 'location');
        const appFeedbacks = getGroupedFeedback('App Feedback', 'feature');

        const locationCount = feedbacks.filter(f => f.feedbackType === 'Location Feedback').length;
        const appCount = feedbacks.filter(f => f.feedbackType === 'App Feedback').length;
        const quarterMonths = {
            Q1: ['Jan', 'Feb', 'Mar'],
            Q2: ['Apr', 'May', 'Jun'],
            Q3: ['Jul', 'Aug', 'Sep'],
            Q4: ['Oct', 'Nov', 'Dec']
        };

        const getUserActivityData = useMemo(() => {
            const activity = {};
            const periodKeys = filter === 'Monthly' ? moment.monthsShort()
                : filter === 'Quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4']
                    : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort().map(String);

            periodKeys.forEach(pk => {
                activity[pk] = { users: 0, months: {} };
                if (filter === 'Quarterly') {
                    quarterMonths[pk].forEach(m => activity[pk].months[m] = 0);
                } else if (filter === 'Yearly') {
                    moment.monthsShort().forEach(m => activity[pk].months[m] = 0);
                }
            });

            filteredUsers.forEach(user => {
                const date = moment(user.registeredDate);
                if (!date.isValid()) return;

                if (filter === 'Monthly') {
                    const key = date.format('MMM');
                    activity[key].users += 1;
                } else if (filter === 'Quarterly') {
                    const monthIndex = date.month(); // 0-11
                    const quarter = monthIndex <= 2 ? 'Q1' : monthIndex <= 5 ? 'Q2' : monthIndex <= 8 ? 'Q3' : 'Q4';
                    const monthName = date.format('MMM');
                    activity[quarter].users += 1;
                    activity[quarter].months[monthName] += 1;
                } else {
                    const year = date.year().toString();
                    const monthName = date.format('MMM');
                    activity[year].users += 1;
                    activity[year].months[monthName] += 1;
                }
            });

            return periodKeys.map(pk => ({
                name: pk,
                users: activity[pk].users,
                months: activity[pk].months
            }));
        }, [filteredUsers, filter]);



        const generateChartData = (keyFn, valueFn) => {
            const periodKeys = filter === 'Monthly' ? moment.monthsShort()
                : filter === 'Quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4']
                    : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort().map(String);

            const allKeys = [...new Set(filteredUsers.map(valueFn))];
            const group = {};

            periodKeys.forEach(p => {
                group[p] = {};
                allKeys.forEach(k => { group[p][k] = 0; });
            });

            filteredUsers.forEach(u => {
                const period = keyFn(u);
                const val = valueFn(u);
                if (!group[period]) group[period] = {};
                group[period][val] = (group[period][val] || 0) + 1;
            });

            return periodKeys.map(period => ({ period, ...group[period] }));
        };

        const CustomAgeTooltip = ({ active, payload, label, filter }) => {
            if (!active || !payload || payload.length === 0) return null;

            const data = payload[0].payload;
            let breakdown = [];

            if (filter === 'Monthly' && data.weeks) {
                breakdown = data.weeks.map(w => `${w.week}: ${w.count}`);
            } else if ((filter === 'Quarterly' || filter === 'Yearly') && data.months) {
                breakdown = Object.entries(data.months).map(([m, count]) => `${m}: ${count}`);
            }

            return (
                <div style={{ background: '#fff', border: '1px solid #ccc', padding: 10, borderRadius: 5 }}>
                    <p><strong>{label}</strong></p>
                    {breakdown.map((b, i) => <p key={i}>{b}</p>)}
                    <hr />
                    <p><strong>Total Users: {data.total || 0}</strong></p>
                </div>
            );
        };





        const genderChartData = useMemo(() => generateChartData(
            u => filter === 'Monthly' ? moment(u.registeredDate).format('MMM') : filter === 'Quarterly' ? `Q${Math.ceil((moment(u.registeredDate).month() + 1) / 3)}` : moment(u.registeredDate).year().toString(),
            u => u.gender || 'Prefer Not to Say'
        ), [filteredUsers, filter]);

        const userTypeChartData = useMemo(() => generateChartData(
            u => filter === 'Monthly' ? moment(u.registeredDate).format('MMM') : filter === 'Quarterly' ? `Q${Math.ceil((moment(u.registeredDate).month() + 1) / 3)}` : moment(u.registeredDate).year().toString(),
            u => u.userType || 'Other'
        ), [filteredUsers, filter]);

        const ageChartData = useMemo(() => generateChartData(
            u => filter === 'Monthly' ? moment(u.registeredDate).format('MMM') : filter === 'Quarterly' ? `Q${Math.ceil((moment(u.registeredDate).month() + 1) / 3)}` : moment(u.registeredDate).year().toString(),
            u => `${Math.floor(u.age / 10) * 10}-${Math.floor(u.age / 10) * 10 + 9}`
        ), [filteredUsers, filter]);

        const ageGroupChartData = useMemo(() => {
            const periodKeys = filter === 'Monthly'
                ? moment.monthsShort()
                : filter === 'Quarterly'
                    ? ['Q1', 'Q2', 'Q3', 'Q4']
                    : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort().map(String);

            const ageGroups = [...new Set(filteredUsers.map(u => {
                if (u.age != null) {
                    const rangeStart = Math.floor(u.age / 10) * 10;
                    return u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
                }
                return null;
            }).filter(Boolean))];

            const data = periodKeys.map(pk => {
                const entry = { period: pk, total: 0 };
                ageGroups.forEach(ag => entry[ag] = 0);

                if (filter === 'Monthly') {
                    entry.weeks = Array.from({ length: 5 }, (_, i) => ({ week: `Week ${i + 1}`, count: 0 }));
                } else {
                    entry.months = {};
                    const months = filter === 'Quarterly' ? quarterMonths[pk] : moment.monthsShort();
                    months.forEach(m => entry.months[m] = 0);
                }

                filteredUsers.forEach(u => {
                    const date = moment(u.registeredDate);
                    if (!date.isValid()) return;

                    const period = filter === 'Monthly'
                        ? date.format('MMM')
                        : filter === 'Quarterly'
                            ? `Q${Math.ceil((date.month() + 1) / 3)}`
                            : date.year().toString();

                    if (period !== pk) return;

                    const rangeStart = Math.floor(u.age / 10) * 10;
                    const ageGroup = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
                    entry[ageGroup] += 1;
                    entry.total += 1;

                    if (filter === 'Monthly') {
                        const weekIndex = Math.min(4, Math.floor((date.date() - 1) / 7));
                        entry.weeks[weekIndex].count += 1;
                    } else {
                        const monthName = date.format('MMM');
                        if (entry.months[monthName] != null) entry.months[monthName] += 1;
                    }
                });

                return entry;
            });

            return { data, ageGroups };
        }, [filteredUsers, filter]);





        const showYearSelection = filter !== 'Yearly';

        return (
            <div className="dashboard-wrapper">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="report-header"><h2>Analysis & Reports</h2></div>

                    {/* Cards */}
                    <div className="cards-container">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="card brown">
                                    <div className="skeleton skeleton-icon"></div>
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-line short"></div>
                                </div>
                            ))
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
                                    <FaUsers size={22} color="#E74C3C" />
                                    <h2>Guest Users</h2>
                                    <p className="big-number">{guestUsers.length.toLocaleString()}</p>
                                </div>
                                <div className="card brown">
                                    <FaMapMarkerAlt size={22} color="#9B59B6" />
                                    <h2>Top Destination</h2>
                                    <p className="big-number">{topRatedLocation ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})` : 'N/A'}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Feedback Overview */}
                    <div className="chart-container">
                        <h3>Feedback Overview</h3>
                        {loading ? (
                            <div className="skeleton-faq">
                                <div className="skeleton skeleton-faq-title"></div>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="skeleton-faq-item">
                                        <div className="skeleton skeleton-faq-q"></div>
                                        <div className="skeleton skeleton-faq-a"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="tab-bars markers-tabs">
                                    <div className="tabs-left">
                                        <button className={`mtab ${activeFeedbackTab === 'location' ? 'active' : ''}`} onClick={() => setActiveFeedbackTab('location')}>Location Feedback</button>
                                        <button className={`mtab ${activeFeedbackTab === 'app' ? 'active' : ''}`} onClick={() => setActiveFeedbackTab('app')}>App Feedback</button>
                                    </div>
                                    <div className="tabs-right top5-tabs">
                                        <button className={`top5-brown-tab ${ratingFilter === 'top' ? 'active' : ''}`} onClick={() => setRatingFilter('top')}>Top 5 Highest</button>
                                        <button className={`top5-brown-tab ${ratingFilter === 'lowest' ? 'active' : ''}`} onClick={() => setRatingFilter('lowest')}>Top 5 Lowest</button>
                                        <button className={`top5-brown-tab ${showAll ? 'active' : ''}`} onClick={() => setShowAll(!showAll)}>{showAll ? 'Show Top 5' : 'Show All'}</button>
                                    </div>
                                </div>

                                {activeFeedbackTab === 'location' && (
                                    <>
                                        <h4>Location Feedbacks ({locationCount})</h4>
                                        {locationFeedbacks.length === 0 ? (
                                            <div className="skeleton-faq">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <div key={i} className="skeleton skeleton-faq-item">
                                                        <div className="skeleton skeleton-faq-q"></div>
                                                        <div className="skeleton skeleton-faq-a"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : locationFeedbacks.map((loc, idx) => (
                                            <div key={idx} className="feedback-card">
                                                <strong>{loc.name}</strong> — Rating: {loc.average}⭐ ({loc.count})
                                            </div>
                                        ))}
                                    </>
                                )}

                                {activeFeedbackTab === 'app' && (
                                    <>
                                        <h4>App Feedbacks ({appCount})</h4>
                                        {appFeedbacks.length === 0 ? (
                                            <div className="skeleton-faq">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <div key={i} className="skeleton skeleton-faq-item">
                                                        <div className="skeleton skeleton-faq-q"></div>
                                                        <div className="skeleton skeleton-faq-a"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : appFeedbacks.map((f, idx) => (
                                            <div key={idx} className="feedback-card">
                                                <strong>{f.name}</strong> — Rating: {f.average}⭐ ({f.count})
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
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
                                        {[...new Set(users.map(u => moment(u.registeredDate).year()))]
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
                                    <option value="local">Locals</option>
                                    <option value="foreign national">Foreign Nationals</option>
                                    <option value="researcher">Researchers</option>
                                </select>
                            </div>

                            <button
                                className="pdf-btn"
                                onClick={() => generateUserAnalyticsPDF({
                                    users: filteredUsers,
                                    feedbacks,
                                    filter,
                                    selectedYear,
                                    userType,
                                    averageRating,
                                    topRatedLocation
                                })}
                            >
                                <FaFilePdf /> Download Analysis PDF
                            </button>
                        </div>
                    </div>

                    {/* Registration Trends */}
                    <div className="chart-container">
                        <h3>Registration Trends</h3>
                        {loading ? (
                            <div className="skeleton" style={{ height: 300, borderRadius: 10 }}></div>
                        ) : (
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

                    {/* Gender Distribution */}
                    <div className="chart-container">
                        <h3>Gender Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                        {loading ? (
                            <div className="skeleton" style={{ height: 300, borderRadius: 10 }}></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={genderChartData}>
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    {Object.keys(genderChartData[0] || {})
                                        .filter(k => k !== 'period')
                                        .map((gender, idx) => (
                                            <Bar key={gender} dataKey={gender} stackId="a" fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* User Type Distribution */}
                    <div className="chart-container">
                        <h3>User Type Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                        {loading ? (
                            <div className="skeleton" style={{ height: 300, borderRadius: 10 }}></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={userTypeChartData}>
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    {Object.keys(userTypeChartData[0] || {})
                                        .filter(k => k !== 'period')
                                        .map((type, idx) => (
                                            <Bar key={type} dataKey={type} stackId="a" fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Age Group Distribution */}
                    <div className="chart-container">
                        <h3>Age Group Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                        {loading ? (
                            <div className="skeleton" style={{ height: 300, borderRadius: 10 }}></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ageGroupChartData.data}>
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip content={<CustomAgeTooltip filter={filter} />} />
                                    {ageGroupChartData.ageGroups.map((ag, idx) => (
                                        <Bar key={ag} dataKey={ag} stackId="a" fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                </main>
            </div>
        );
    };

    export default AnalysisReport;
