
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateUserAnalyticsPDF = ({ users, feedbacks, filter, selectedYear, userType, averageRating, topRatedLocation }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    doc.setFontSize(18);
    doc.text("TourKita Full User Analytics", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 12;

    const filteredUsers = users.filter(u => {
        if (userType.toLowerCase() !== 'all' && u.userType.toLowerCase() !== userType.toLowerCase()) return false;
        const date = moment(u.registeredDate);
        if (!date.isValid()) return false;
        if (filter === 'Yearly') return date.year() === selectedYear;
        return true;
    });

    const totalUsers = filteredUsers.length;
    const guestUsers = filteredUsers.filter(u => u.userType === 'guest').length;

    const featureRatings = {};
    feedbacks.forEach(f => {
        if (f.feedbackType === 'App Feedback' && typeof f.rating === 'number') {
            const key = f.feature || "N/A";
            if (!featureRatings[key]) featureRatings[key] = [];
            featureRatings[key].push(f.rating);
        }
    });
    let topFeature = null;
    let topAvg = 0;
    for (const [feature, ratings] of Object.entries(featureRatings)) {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        if (avg > topAvg) {
            topAvg = avg;
            topFeature = feature;
        }
    }

    autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: [
            ["Average Rating", averageRating.toFixed(1)],
            ["Total Users", totalUsers],
            ["Guest Users", guestUsers],
            ["Top Destination", topRatedLocation ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})` : "N/A"],
            ["Top Feature", topFeature || "N/A"],
        ],
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    const createDistributionTable = (title, field) => {
        const counts = {};
        filteredUsers.forEach(u => {
            let key = u[field] || 'N/A';
            if (field === 'age') {
                const rangeStart = Math.floor(u.age / 10) * 10;
                key = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
            }
            counts[key] = (counts[key] || 0) + 1;
        });

        autoTable(doc, {
            startY: currentY,
            head: [[field.charAt(0).toUpperCase() + field.slice(1), "Count", "Percentage"]],
            body: Object.entries(counts).map(([k, v]) => [k, v, `${((v / totalUsers) * 100).toFixed(1)}%`]),
            margin: { left: margin, right: margin },
        });
        currentY = doc.lastAutoTable.finalY + 10;
    };

    createDistributionTable("Gender Distribution", "gender");
    createDistributionTable("User Type Distribution", "userType");
    createDistributionTable("Age Group Distribution", "age");

    doc.setFontSize(14);
    doc.text(`Registration Trend (${filter})`, margin, currentY);
    currentY += 5;

    const trendCounts = {};
    filteredUsers.forEach(u => {
        const date = moment(u.registeredDate);
        let key = '';
        if (filter === 'Monthly') key = date.format('MMM');
        else if (filter === 'Quarterly') key = `Q${Math.ceil((date.month() + 1) / 3)}`;
        else key = date.year();
        trendCounts[key] = (trendCounts[key] || 0) + 1;
    });

    const periods = Object.keys(trendCounts).sort();
    const trendBody = periods.map((p, idx) => {
        const current = trendCounts[p];
        const previous = idx > 0 ? trendCounts[periods[idx - 1]] : current;
        const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
        const changeStr = (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
        return [p, current, changeStr];
    });

    autoTable(doc, {
        startY: currentY,
        head: [[filter, "New Users", "Change"]],
        body: trendBody,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("URGENT ALERTS (Consecutive Low Ratings)", margin, currentY);
    currentY += 5;

    const urgentFeatures = [];
    Object.entries(featureRatings).forEach(([feature, ratings]) => {
        for (let i = 0; i <= ratings.length - 3; i++) {
            if (ratings[i] < 3 && ratings[i + 1] < 3 && ratings[i + 2] < 3) {
                urgentFeatures.push(feature);
                break;
            }
        }
    });

    if (urgentFeatures.length === 0) {
        doc.text("None", margin, currentY);
    } else {
        urgentFeatures.forEach(f => {
            doc.text(`• ${f}`, margin, currentY);
            currentY += 6;
        });
    }

    doc.save(`TourKita_Analysis_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
