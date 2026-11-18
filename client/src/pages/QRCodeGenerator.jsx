
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Trash2, Link, Plus, ExternalLink, } from "lucide-react";
import { apiRequest } from '../lib/api';

export default function QRCodeGenerator() {
    const [url, setUrl] = useState("");
    const [qrImage, setQrImage] = useState("");
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const response =  apiRequest("/qr-codes", {
        method: "POST",
        body: JSON.stringify({
            url: cleanUrl,
        }),
    });

    setHistory((prev) => [response.data, ...prev]);

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
        } catch (error) {
            console.error("Failed to clear history:", error);
        }
    };

    const generateQR = async (inputUrl = url) => {
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
            setUrl(cleanUrl);

            const newItem = {
                id: Date.now(),
                url: cleanUrl,
                createdAt: new Date().toISOString(),
            };

            saveHistory([newItem, ...history]);
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
        await generateQR(item.url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                        <QrCode size={24} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold">QR Code Generator</h1>
                        <p className="text-sm text-muted-foreground">
                            Generate and manage QR codes for your URLs
                        </p>
                    </div>
                </div>
            </div>

            {/* Generator */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Generate QR Code</h2>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            generateQR();
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Website URL
                            </label>

                            <div className="relative">
                                <Link
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />

                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="https://example.com"
                                    className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                                Enter a website URL. HTTPS will be added automatically if missing.
                            </p>
                        </div>

                        {error && (
                            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                        >
                            <QrCode size={18} />
                            {loading ? "Generating..." : "Generate QR Code"}
                        </button>
                    </form>
                </div>

                {/* Preview */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">QR Code Preview</h2>

                    {qrImage ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="rounded-2xl border bg-white p-4">
                                <img
                                    src={qrImage}
                                    alt="Generated QR Code"
                                    className="h-64 w-64 object-contain"
                                />
                            </div>

                            <p className="max-w-full break-all text-center text-sm text-muted-foreground">
                                {url}
                            </p>

                            <div className="flex w-full flex-wrap justify-center gap-3">
                                <button
                                    onClick={() => downloadQR()}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                                >
                                    <Download size={16} />
                                    Download PNG
                                </button>

                                <button
                                    onClick={() => copyUrl()}
                                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
                                >
                                    <Copy size={16} />
                                    Copy URL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed text-center">
                            <QrCode
                                size={64}
                                className="mb-4 text-muted-foreground/40"
                            />

                            <p className="font-medium">No QR code generated yet</p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter a URL to generate your QR code
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">QR Code History</h2>
                        <p className="text-sm text-muted-foreground">
                            {history.length} QR code{history.length !== 1 ? "s" : ""} generated
                        </p>
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
                        >
                            <Trash2 size={16} />
                            Clear History
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <QrCode size={40} className="mx-auto mb-3 opacity-40" />
                        <p>No QR codes generated yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="break-all font-medium">{item.url}</p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => regenerateQR(item)}
                                        className="rounded-lg border p-2 transition hover:bg-muted"
                                        title="Preview QR"
                                    >
                                        <QrCode size={18} />
                                    </button>

                                    <button
                                        onClick={() => copyUrl(item.url)}
                                        className="rounded-lg border p-2 transition hover:bg-muted"
                                        title="Copy URL"
                                    >
                                        <Copy size={18} />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const image = await QRCode.toDataURL(item.url, {
                                                width: 600,
                                                margin: 3,
                                                errorCorrectionLevel: "H",
                                            });

                                            downloadQR(
                                                image,
                                                `qr-${item.id}.png`
                                            );
                                        }}
                                        className="rounded-lg border p-2 transition hover:bg-muted"
                                        title="Download QR"
                                    >
                                        <Download size={18} />
                                    </button>

                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-lg border p-2 transition hover:bg-muted"
                                        title="Open URL"
                                    >
                                        <ExternalLink size={18} />
                                    </a>

                                    <button
                                        onClick={() => deleteQR(item.id)}
                                        className="rounded-lg border p-2 text-red-500 transition hover:bg-red-500/10"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
