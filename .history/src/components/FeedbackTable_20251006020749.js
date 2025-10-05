import React, { useState } from "react";
import "./FeedbackTable.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

const FeedbackTable = ({
    loading = false,
    feedback = [],
    isAllTab = false,
    isFeatureTab = false,
    renderStars = () => null,
    formatTimestamp = (date) => date,
    onImageClick = () => { },
    onSendMessage = () => { },
    searchTerm: parentSearchTerm,
    setSearchTerm: parentSetSearchTerm,
    startDate: parentStartDate,
    endDate: parentEndDate,
    setStartDate: parentSetStartDate,
    setEndDate: parentSetEndDate,
    filterContext: parentFilterContext,
    setFilterContext: parentSetFilterContext,
}) => {
    // Local states
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [localStartDate, setLocalStartDate] = useState("");
    const [localEndDate, setLocalEndDate] = useState("");
    const [localFilterContext, setLocalFilterContext] = useState("");

    // Use parent state if provided
    const searchTerm = parentSearchTerm !== undefined ? parentSearchTerm : localSearchTerm;
    const setSearchTerm = parentSetSearchTerm !== undefined ? parentSetSearchTerm : setLocalSearchTerm;

    const startDate = parentStartDate !== undefined ? parentStartDate : localStartDate;
    const setStartDate = parentSetStartDate !== undefined ? parentSetStartDate : setLocalStartDate;

    const endDate = parentEndDate !== undefined ? parentEndDate : localEndDate;
    const setEndDate = parentSetEndDate !== undefined ? parentSetEndDate : setLocalEndDate;

    const filterContext = parentFilterContext !== undefined ? parentFilterContext : localFilterContext;
    const setFilterContext = parentSetFilterContext !== undefined ? parentSetFilterContext : setLocalFilterContext;

    // Unique options for dropdown
    const options = Array.from(new Set(feedback.map(f => f.feature || f.location))).filter(Boolean);

    // Filter feedback safely
    const filteredFeedback = feedback.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const email = item.email || "";
        const feature = item.feature || "";
        const location = item.location || "";
        const comment = item.comment || "";

        const matchesSearch =
            email.toLowerCase().includes(searchLower) ||
            feature.toLowerCase().includes(searchLower) ||
            location.toLowerCase().includes(searchLower) ||
            comment.toLowerCase().includes(searchLower);

        const matchesContext = filterContext
            ? location === filterContext || feature === filterContext
            : true;

        const itemDate = new Date(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt);
        const matchesDate =
            (!startDate || itemDate >= new Date(startDate)) &&
            (!endDate || itemDate <= new Date(endDate));

        return matchesSearch && matchesContext && matchesDate;
    });

    // PDF export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();
        doc.setFontSize(14);
        doc.text("Feedback Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 22);

        const tableColumn = [
            "No",
            "Email",
            ...(isAllTab ? ["App Feature"] : []),
            isFeatureTab ? "App Feature" : "Location",
            "Feedback",
            "Rating",
            "Time",
        ];

        const tableRows = filteredFeedback.map((entry, index) => [
            index + 1,
            entry.email,
            ...(isAllTab ? [entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—"] : []),
            isFeatureTab ? entry.feature || "—" : entry.location || "—",
            entry.comment,
            entry.rating || 0,
            formatTimestamp(entry.createdAt),
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: "striped",
            styles: { fontSize: 9 },
        });

        doc.save(`feedback_report_${new Date().getTime()}.pdf`);
    };

    // Excel export
    const handleExportExcel = () => {
        const data = filteredFeedback.map((entry, index) => ({
            No: index + 1,
            Email: entry.email,
            ...(isAllTab ? { "App Feature": entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—" } : {}),
            [isFeatureTab ? "App Feature" : "Location"]: isFeatureTab ? entry.feature || "—" : entry.location || "—",
            Feedback: entry.comment,
            Rating: entry.rating || 0,
            Time: formatTimestamp(entry.createdAt),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
        XLSX.writeFile(workbook, `feedback_report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div>
            <div className="table-controls">
                {/* Top row: filter + date range at top right */}
                <div className="top-row">
                    <select
                        className="filter-select"
                        value={filterContext}
                        onChange={e => setFilterContext(e.target.value)}
                    >
                        <option value="">All Locations / Features</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    <div className="date-range">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span>–</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <div className="bottom-row">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by email, feature/location, message..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <div className="export-buttons-container">
                        <button onClick={handleExportPDF} className="export-btn pdf">
                            <FaFilePdf /> Export PDF
                        </button>
                        <button onClick={handleExportExcel} className="export-btn excel">
                            <FaFileExcel /> Export Excel
                        </button>
                    </div>
                </div>
            </div>

            <table className="feedback-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Email</th>
                        {isAllTab && <th>App Feature</th>}
                        <th>{isFeatureTab ? "App Feature" : "Location"}</th>
                        <th>Feedback</th>
                        <th>Image</th>
                        <th>Rating</th>
                        <th>Time</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <tr key={i}>
                                <td colSpan="9">
                                    <div className="skeleton-card">
                                        <div className="skeleton skeleton-title"></div>
                                        <div className="skeleton skeleton-line medium"></div>
                                        <div className="skeleton skeleton-line"></div>
                                        <div className="skeleton skeleton-line short"></div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : filteredFeedback.length > 0 ? (
                        filteredFeedback.map((entry, index) => (
                            <tr key={entry.id || index}>
                                <td>{index + 1}</td>
                                <td>{entry.email}</td>
                                {isAllTab && (
                                    <td>{entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—"}</td>
                                )}
                                <td>{isFeatureTab ? entry.feature || "—" : entry.location || "—"}</td>
                                <td>{entry.comment}</td>
                                <td>
                                    {entry.imageUrl ? (
                                        <img
                                            src={entry.imageUrl}
                                            alt="Feedback"
                                            className="feedback-image"
                                            onClick={() => onImageClick(entry.imageUrl)}
                                        />
                                    ) : (
                                        "—"
                                    )}
                                </td>
                                <td>{renderStars(entry.rating || 0)}</td>
                                <td>{formatTimestamp(entry.createdAt)}</td>
                                <td>
                                    <button
                                        className="action-btn"
                                        onClick={() =>
                                            onSendMessage(entry.email, isFeatureTab ? entry.feature : entry.location)
                                        }
                                    >
                                        Send Message
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                                No feedback found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FeedbackTable;
