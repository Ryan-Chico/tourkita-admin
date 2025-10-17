import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import './ExportButtons.css';

// 1. Accept `columnVisibility` as a prop
const ExportButtons = ({ users, columnVisibility }) => {

    // 2. Define a configuration object. This makes it easy to manage headers and get data for each column.
    const columnConfig = {
        userId: { header: 'User ID', accessor: (user) => user.id },
        email: { header: 'Email', accessor: (user) => user.email || '—' },
        name: { header: 'Name', accessor: (user) => user.name || '—' },
        age: { header: 'Age', accessor: (user) => user.age || 'N/A' },
        gender: { header: 'Gender', accessor: (user) => user.gender || '—' },
        contactNumber: { header: 'Contact Number', accessor: (user) => user.contactNumber || '—' },
        status: { header: 'Status', accessor: (user) => user.status },
        activeStatus: { header: 'Active Status', accessor: (user) => (user.activeStatus ? 'Online' : 'Offline') },
        userType: { header: 'User Type', accessor: (user) => user.userType || '—' },
        registeredDate: {
            header: 'Registered Date',
            accessor: (user) => {
                const date = user.registeredDate;
                if (date instanceof Date) {
                    return date.toLocaleDateString();
                }
                return date || 'N/A';
            }
        },
    };

    const visibleColumnKeys = Object.keys(columnConfig).filter(key => columnVisibility[key]);

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'pt', 'a4');
        const date = new Date().toLocaleString();

        doc.setFontSize(14);
        doc.text("User Management Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 35);

        const tableColumn = ["No", ...visibleColumnKeys.map(key => columnConfig[key].header)];

        const tableRows = users.map((user, index) => [
            index + 1,
            ...visibleColumnKeys.map(key => columnConfig[key].accessor(user))
        ]);

        autoTable(doc, {
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });

        doc.save(`user_management_${Date.now()}.pdf`);
    };

    const handleExportExcel = () => {
        const data = users.map((user, index) => {
            const rowData = { "No": index + 1 };
            visibleColumnKeys.forEach(key => {
                // The header becomes the key and the accessor gets the value.
                rowData[columnConfig[key].header] = columnConfig[key].accessor(user);
            });
            return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, `user_management_${Date.now()}.xlsx`);
    };

    return (
        <div className="export-buttons-container">
            <button onClick={handleExportPDF} className="export-btn pdf">
                <FaFilePdf /> Export PDF
            </button>
            <button onClick={handleExportExcel} className="export-btn excel">
                <FaFileExcel /> Export Excel
            </button>
        </div>
    );
};

export default ExportButtons;