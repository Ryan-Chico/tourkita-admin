import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import TourkitaLogo from './TourkitaLogo.jpg';
import { 
    FaSignOutAlt, 
    FaUserCircle, 
    FaMapMarkerAlt, 
    FaTachometerAlt, 
    FaUsers, 
    FaComments, 
    FaBell, 
    FaChartBar, 
    FaCamera, 
    FaFileAlt 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const navSections = [
    {
        title: 'Insights',
        items: [
            { to: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
            { to: '/analysis-report', icon: FaChartBar, label: 'Reports' }
        ]
    },
    {
        title: 'Management',
        items: [
            { to: '/user-management', icon: FaUsers, label: 'Users' },
            { to: '/feedback', icon: FaComments, label: 'Feedback' },
            { to: '/notification-management', icon: FaBell, label: 'Notifications' },
            { to: '/markers-management', icon: FaMapMarkerAlt, label: 'Markers' }
        ]
    },
    {
        title: 'Tools',
        items: [
            { to: '/ar-management', icon: FaCamera, label: 'AR Tools' },
            { to: '/content-management', icon: FaFileAlt, label: 'Content' }
        ]
    }
];

const Sidebar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={TourkitaLogo} alt="Tour Kita Logo" className="app-logo" />
                <h1 className="app-title">TourKita</h1>
            </div>

            <nav className="sidebar-nav">
                {navSections.map((section) => (
                    <div key={section.title} className="nav-section">
                        <h2 className="nav-section-title">{section.title}</h2>
                        {section.items.map(({ to, icon: Icon, label }) => (
                            <NavLink key={to} to={to} className="nav-link">
                                <Icon className="nav-icon" />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <FaUserCircle className="user-icon" />
                    <span className="user-name">Admin</span>
                </div>
                <button onClick={handleLogout} className="logout-button" title="Log Out">
                    <FaSignOutAlt />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;