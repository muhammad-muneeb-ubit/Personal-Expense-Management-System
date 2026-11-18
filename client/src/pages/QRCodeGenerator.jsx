import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Trash2, Link, ExternalLink, AlertTriangle, X } from "lucide-react";
import { apiRequest } from '../lib/api';

export default function QRCodeGenerator({ notify }) {
    const [url, setUrl] = useState("");
    const [qrImage, setQrImage] = useState("");
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);

            const response = await apiRequest("/qr-codes");

            setHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch QR history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const deleteQR = async (id) => {
        try {
            await apiRequest(`/qr-codes/${id}`, {
                method: "DELETE",
            });

            setHistory((prev) =>
                prev.filter((item) => item._id !== id)
            );
        } catch (error) {
            console.error("Failed to delete QR code:", error);
        }
    };

    const clearHistory = async () => {
        try {
            await apiRequest("/qr-codes", {
                method: "DELETE",
            });

            setHistory([]);
            setClearConfirmOpen(false);
            notify?.("All generated QR codes deleted.");
        } catch (error) {
            console.error("Failed to clear history:", error);
            notify?.(error.message, "error");
        }
    };

    const generateQR = async (inputUrl = url, saveToHistory = true) => {
        setError("");
        setQrImage("");

        let cleanUrl = inputUrl.trim();

        if (!cleanUrl) {
            setError("Please enter a URL.");
            return;
        }

        // Automatically add https:// if missing
        if (!/^https?:\/\//i.test(cleanUrl)) {
            cleanUrl = `https://${cleanUrl}`;
        }

        try {
            new URL(cleanUrl);
        } catch {
            setError("Please enter a valid URL.");
            return;
        }

        setLoading(true);

        try {
            const image = await QRCode.toDataURL(cleanUrl, {
                width: 600,
                margin: 3,
                errorCorrectionLevel: "H",
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
            });

            setQrImage(image);
            setUrl("");

            if (saveToHistory) {
                const response = await apiRequest("/qr-codes", {
                    method: "POST",
                    body: JSON.stringify({ url: cleanUrl }),
                });

                setHistory((prev) => [response.data, ...prev]);
            }
        } catch (err) {
            setError("Unable to generate QR code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = (image = qrImage, filename = "qr-code.png") => {
        if (!image) return;

        const link = document.createElement("a");
        link.href = image;
        link.download = filename;
        link.click();
    };

    const copyUrl = async (value = url) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            setError("Unable to copy URL.");
        }
    };

    const regenerateQR = async (item) => {
        setUrl(item.url);
        await generateQR(item.url, false);
    };

    return (
        <div className="page-content qr-page">
            <div className="page-heading">
                <div>
                    <div className="eyebrow">POCKETWISE WORKSPACE</div>
                    <h1>QR Code Generator</h1>
                    <p>Generate, preview, download, and manage QR codes for your URLs.</p>
                </div>
            </div>

            <div className="qr-generator-grid">
                <section className="panel qr-generator-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Generate QR Code</h2>
                            <p>Create a QR code from a website URL.</p>
                        </div>
                        <div className="stat-icon purple"><QrCode size={18} /></div>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        generateQR();
                    }} className="qr-form">
                        <label className="field">
                            <span>Website URL</span>
                            <div className="qr-input-wrap">
                                <Link size={17} />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <small>HTTPS will be added automatically if missing.</small>
                        </label>

                        {error && <p className="inline-error"><AlertTriangle size={15} />{error}</p>}

                        <button type="submit" disabled={loading} className="button primary qr-primary-button">
                            <QrCode size={17} />
                            {loading ? "Generating..." : "Generate QR Code"}
                        </button>
                    </form>
                </section>

                <section className="panel qr-preview-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>QR Code Preview</h2>
                            <p>Preview and save the generated image.</p>
                        </div>
                    </div>

                    {qrImage ? (
                        <div className="qr-preview-content">
                            <div className="qr-image-wrap">
                                <img src={qrImage} alt="Generated QR Code" />
                            </div>
                            <p className="qr-preview-url">{url}</p>
                            <div className="qr-preview-actions">
                                <button onClick={() => downloadQR()} className="button primary">
                                    <Download size={16} /> Download PNG
                                </button>
                                <button onClick={() => copyUrl()} className="button secondary">
                                    <Copy size={16} /> Copy URL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="qr-empty-preview">
                            <div className="qr-empty-icon"><QrCode size={38} /></div>
                            <strong>No QR code generated yet</strong>
                            <p>Enter a URL to generate your QR code.</p>
                        </div>
                    )}
                </section>

                <section className="panel qr-history-panel">
                    <div className="panel-heading qr-history-heading">
                        <div>
                            <h2>QR Code History</h2>
                            <p>{history.length} QR code{history.length !== 1 ? "s" : ""} generated</p>
                        </div>

                        {history.length > 0 && (
                            <button
                                onClick={() => setClearConfirmOpen(true)}
                                className="button qr-clear-button"
                            >
                                <Trash2 size={15} /> Clear History
                            </button>
                        )}
                    </div>

                    {loadingHistory ? (
                        <div className="qr-empty-preview qr-history-empty"><p>Loading QR history...</p></div>
                    ) : history.length === 0 ? (
                        <div className="qr-empty-preview qr-history-empty">
                            <div className="qr-empty-icon"><QrCode size={34} /></div>
                            <strong>No QR codes generated yet</strong>
                            <p>Your generated codes will appear here.</p>
                        </div>
                    ) : (
                        <div className="qr-history-list">
                            {history.map((item) => (
                                <div key={item._id} className="qr-history-item">
                                    <div className="qr-history-info">
                                        <strong>{item.url}</strong>
                                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                                    </div>

                                    <div className="qr-row-actions">
                                        <button onClick={() => regenerateQR(item)} title="Preview QR"><QrCode size={16} /></button>
                                        <button onClick={() => copyUrl(item.url)} title="Copy URL"><Copy size={16} /></button>
                                        <button
                                            onClick={async () => {
                                                const image = await QRCode.toDataURL(item.url, {
                                                    width: 600,
                                                    margin: 3,
                                                    errorCorrectionLevel: "H",
                                                });
                                                downloadQR(image, `qr-${item._id}.png`);
                                            }}
                                            title="Download QR"
                                        ><Download size={16} /></button>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open URL">
                                            <ExternalLink size={16} />
                                        </a>
                                        <button onClick={() => deleteQR(item._id)} title="Delete" className="qr-delete-action">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {clearConfirmOpen && (
                <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setClearConfirmOpen(false)}>
                    <section className="modal qr-confirm-modal">
                        <div className="modal-heading">
                            <div className="qr-confirm-heading">
                                <div className="qr-confirm-icon"><AlertTriangle size={20} /></div>
                                <div>
                                    <h2>Clear QR history?</h2>
                                    <p>Are you sure you want to delete all generated QR codes?</p>
                                </div>
                            </div>
                            <button className="icon-button" onClick={() => setClearConfirmOpen(false)}><X size={19} /></button>
                        </div>
                        <div className="modal-actions">
                            <button className="button secondary" onClick={() => setClearConfirmOpen(false)}>Cancel</button>
                            <button className="button qr-confirm-delete" onClick={clearHistory}>
                                <Trash2 size={15} /> Delete All
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
