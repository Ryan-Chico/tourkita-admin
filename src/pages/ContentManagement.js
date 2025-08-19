import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path
import "./ContentManagement.css"; // for custom paper stles 
import { serverTimestamp } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
const ContentManagement = () => {
    const [terms, setTerms] = useState("");
    const [privacy, setPrivacy] = useState("");
    const [faqs, setFaqs] = useState([]);
    const [modalType, setModalType] = useState(""); // "terms", "privacy", or "faqs"
    const [loading, setLoading] = useState(true);

    const [tempContent, setTempContent] = useState("");
    const [tempFaqs, setTempFaqs] = useState([]);

    const [actionLoading, setActionLoading] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            const [termsDoc, privacyDoc, faqDoc] = await Promise.all([
                getDoc(doc(db, "services", "latest")),
                getDoc(doc(db, "privacy", "latest")),
                getDoc(doc(db, "faq", "latest")),
            ]);

            if (termsDoc.exists()) {
                setTerms(termsDoc.data().content || []);
            }

            if (privacyDoc.exists()) {
                setPrivacy(privacyDoc.data().content || []);
            }

            if (faqDoc.exists()) {
                setFaqs(faqDoc.data().items || []);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const openModal = (type) => {
        setModalType(type);
        if (type === "terms") setTempParagraphs(terms || []);
        if (type === "privacy") setTempParagraphs(privacy || []);
        if (type === "faqs") setTempFaqs([...faqs]);
    };


    const closeModal = () => {
        setModalType("");
        setTempContent("");
        setTempFaqs([]);
    };

    const [tempParagraphs, setTempParagraphs] = useState([]);

    const updateParagraph = (index, value) => {
        const updated = [...tempParagraphs];
        updated[index] = value;
        setTempParagraphs(updated);
    };

    const addParagraph = () => {
        setTempParagraphs([...tempParagraphs, ""]);
    };

    const removeParagraph = (index) => {
        const updated = [...tempParagraphs];
        updated.splice(index, 1);
        setTempParagraphs(updated);
    };


    const handleSave = async () => {
        setActionLoading(true);
        const timestamp = serverTimestamp();
        try {
            if (modalType === "terms") {
                await setDoc(doc(db, "services", "latest"), {
                    content: tempParagraphs,
                    timestamp,
                });
                setTerms(tempParagraphs);
            }

            if (modalType === "privacy") {
                await setDoc(doc(db, "privacy", "latest"), {
                    content: tempParagraphs,
                    timestamp,
                });
                setPrivacy(tempParagraphs);
            }

            if (modalType === "faqs") {
                await setDoc(doc(db, "faq", "latest"), {
                    items: tempFaqs,
                    timestamp,
                });
                setFaqs(tempFaqs);
            }

            closeModal();
            alert("Changes saved successfully.");
        } catch (error) {
            alert("Failed to save. Please try again.");
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };


    const updateFaq = (index, field, value) => {
        const updated = [...tempFaqs];
        updated[index][field] = value;
        setTempFaqs(updated);
    };

    const addFaq = () => {
        setTempFaqs([...tempFaqs, { question: "", answer: "" }]);
    };

    const removeFaq = (index) => {
        setTempFaqs(tempFaqs.filter((_, i) => i !== index));
    };


    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="content-area">
                <div className="ar-header">
                    <h2>Content Management</h2>
                </div>
                <div className="paper-section">
                    <h2>Terms of Service</h2>
                    <p className="paper-preview">
                        {terms.length > 0 ? terms[0].slice(0, 300) + "..." : "No content yet."}
                    </p>
                    <button onClick={() => openModal("terms")} className="edit-btn">Edit</button>
                </div>

                <div className="paper-section">
                    <h2>Privacy Policy</h2>
                    <p className="paper-preview">
                        {privacy.length > 0 ? privacy[0].slice(0, 300) + "..." : "No content yet."}
                    </p>
                    <button onClick={() => openModal("privacy")} className="edit-btn">Edit</button>
                </div>

                <div className="paper-section">
                    <h2>FAQs</h2>
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="faq-item">
                            <strong>Q:</strong> {faq.question}<br />
                            <strong>A:</strong> {faq.answer}
                        </div>
                    ))}
                    <button onClick={() => openModal("faqs")} className="edit-btn">Edit</button>
                </div>

                {modalType && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>
                                Edit{" "}
                                {modalType === "terms"
                                    ? "Terms of Service"
                                    : modalType === "privacy"
                                        ? "Privacy Policy"
                                        : "FAQs"}
                            </h2>

                            {modalType === "faqs" ? (
                                <div className="faq-modal-enhanced">
                                    {tempFaqs.map((faq, index) => (
                                        <div key={index} className="faq-item-enhanced">
                                            <div className="faq-header">
                                                <span className="faq-number">#{index + 1}</span>
                                                <button
                                                    onClick={() => removeFaq(index)}
                                                    className="remove-btn"
                                                    disabled={actionLoading}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <label className="faq-label">Question</label>
                                            <input
                                                type="text"
                                                className="faq-input"
                                                value={faq.question}
                                                onChange={(e) => updateFaq(index, "question", e.target.value)}
                                                placeholder="Enter the question"
                                            />
                                            <label className="faq-label">Answer</label>
                                            <textarea
                                                className="faq-textarea"
                                                value={faq.answer}
                                                onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                                placeholder="Enter the answer"
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={addFaq}
                                        className="add-btn"
                                        disabled={actionLoading}
                                    >
                                        Add FAQ
                                    </button>
                                </div>
                            ) : (
                                <div className="paragraph-editor">
                                    {tempParagraphs.map((para, index) => (
                                        <div key={index} className="paragraph-row">
                                            <label className="para-label">{index + 1}.</label>
                                            <textarea
                                                value={para}
                                                onChange={(e) => updateParagraph(index, e.target.value)}
                                                className="para-textarea"
                                                rows={3}
                                            />
                                            <button
                                                onClick={() => removeParagraph(index)}
                                                className="remove-btn"
                                                disabled={actionLoading}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addParagraph}
                                        className="add-btn"
                                        disabled={actionLoading}
                                    >
                                        Add Paragraph
                                    </button>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    onClick={handleSave}
                                    className="save-btn"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="cancel-btn"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

};

export default ContentManagement;
