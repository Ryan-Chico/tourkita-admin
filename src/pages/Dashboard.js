import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [topRatedDestinations, setTopRatedDestinations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener for users + guests
    useEffect(() => {
        const usersRef = collection(db, "users");
        const guestsRef = collection(db, "guests");

        // Listen to registered users
        const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
            const registeredUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isGuest: false, // mark as registered
            }));

            // Listen to guests
            const unsubscribeGuests = onSnapshot(guestsRef, (guestSnap) => {
                const guestUsers = guestSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isGuest: true, // mark as guest
                    status: "Guest", // optional
                }));

                setUsers([...registeredUsers, ...guestUsers]);
                setLoading(false);
            });

            // Cleanup guest listener
            return () => unsubscribeGuests();
        });

        return () => unsubscribeUsers();
    }, []);

    //  Compute active user stats after data loads
    const { activeUsers, activeRegistered, activeGuests } = useMemo(() => {
        const nonArchived = users.filter(u => u.status !== "archived");
        const active = nonArchived.filter(u => u.activeStatus === true);
        const registered = active.filter(u => !u.isGuest);
        const guests = active.filter(u => u.isGuest);

        return {
            activeUsers: active,
            activeRegistered: registered,
            activeGuests: guests,
        };
    }, [users]);

    // 🔹 Feedback listener
    useEffect(() => {
        const feedbackRef = collection(db, "feedbacks");
        const unsubscribe = onSnapshot(feedbackRef, (snapshot) => {
            setLoading(true);

            const ratingsMap = {};
            snapshot.forEach(doc => {
                const { location, rating } = doc.data();
                if (!location) return;

                if (!ratingsMap[location]) {
                    ratingsMap[location] = { total: 0, count: 0, withRatingCount: 0 };
                }

                if (rating !== undefined && rating !== null) {
                    ratingsMap[location].total += rating;
                    ratingsMap[location].withRatingCount += 1;
                }
                ratingsMap[location].count += 1;
            });

            const processed = Object.entries(ratingsMap).map(([site, values]) => ({
                site,
                rating: values.withRatingCount > 0
                    ? parseFloat((values.total / values.withRatingCount).toFixed(2))
                    : 0,
                feedbackCount: values.count,
            }));

            const topByRating = processed.sort((a, b) => b.rating - a.rating).slice(0, 5);
            setTopRatedDestinations(topByRating);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getPercentageColor = (value) => ({
        color: value > 0 ? "green" : value < 0 ? "red" : "#999",
    });

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h2>Overview</h2>
                </header>

                <section className="cards-container">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="card brown">
                                <div className="skeleton skeleton-icon" />
                                <div className="skeleton skeleton-title" />
                                <div className="skeleton skeleton-line short" />
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="card brown">
                                <p>Online: All Users</p>
                                <h2>{activeUsers.length}</h2>
                          
                            </div>
                            <div className="card brown">
                                <p>Online: Registered Users</p>
                                <h2>{activeRegistered.length}</h2>
                              
                            </div>
                            <div className="card brown">
                                <p>Online: Guest Users</p>
                                <h2>{activeGuests.length}</h2>
                               
                            </div>
                        </>
                    )}
                </section>

                <section className="chart-section" style={{ marginTop: "2rem" }}>
                    {loading ? (
                        <div className="chart-container skeleton-chart">
                            <div className="skeleton skeleton-title" style={{ width: "40%", height: "20px", marginBottom: "1rem" }} />
                            <div className="skeleton skeleton-rect" />
                        </div>
                    ) : (
                        <>
                            <h2>Top Rated Sites - Based on User Feedback</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={topRatedDestinations}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 5]} />
                                    <YAxis type="category" dataKey="site" />
                                    <Tooltip
                                        formatter={(value, name) =>
                                            name === "rating"
                                                ? [`${value} / 5`, "Average Rating"]
                                                : [value, "Total Feedback"]
                                        }
                                    />
                                    <Bar dataKey="rating" fill="#AB886D" barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                            <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
                                * Only locations with feedback are shown. Some may have feedback without ratings.
                            </p>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
