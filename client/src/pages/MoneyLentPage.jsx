
import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Plus, Pencil, Trash2, CheckCircle2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';

const money = (amount, currency = 'PKR') =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

const today = () => new Date().toLocaleDateString('en-CA');

const emptyForm = {
    personName: '',
    amount: '',
    date: today(),
    expectedReturnDate: '',
    notes: '',
};

export default function MoneyLentPage({ currency = 'PKR', notify, onChanged }) {
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        totalLent: 0,
        totalRepaid: 0,
        outstanding: 0,
    });

    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [repaying, setRepaying] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const loadRecords = useCallback(async () => {
        const data = await apiRequest('/lending');
        setRecords(data.lendings || []);
        setSummary(data.summary || {
            totalLent: 0,
            totalRepaid: 0,
            outstanding: 0,
        });
    }, []);

    useEffect(() => {
        loadRecords()
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [loadRecords]);

    function resetForm() {
        setForm(emptyForm);
        setEditing(null);
        setError('');
    }

    function startEdit(record) {
        setEditing(record._id);
        setForm({
            personName: record.personName,
            amount: String(record.amount),
            date: record.date?.slice(0, 10) || today(),
            expectedReturnDate: record.expectedReturnDate
                ? record.expectedReturnDate.slice(0, 10)
                : '',
            notes: record.notes || '',
        });
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError('');

        try {
            const payload = {
                ...form,
                amount: Number(form.amount),
                expectedReturnDate: form.expectedReturnDate || null,
            };

            if (editing) {
                await apiRequest(`/lending/${editing}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
                notify('Lending record updated.');
            } else {
                await apiRequest('/lending', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                notify('Money lending recorded.');
            }

            resetForm();
            await loadRecords();
            await onChanged?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteRecord(id) {
        if (!window.confirm('Delete this lending record and its repayment history?')) {
            return;
        }

        try {
            await apiRequest(`/lending/${id}`, { method: 'DELETE' });
            notify('Lending record deleted.');
            await loadRecords();
            await onChanged?.();
        } catch (e) {
            notify(e.message, 'error');
        }
    }

    async function addRepayment(e) {
        e.preventDefault();
        setBusy(true);
        setError('');

        try {
            await apiRequest(`/lending/${repaying._id}/repayments`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: Number(repaymentAmount),
                    date: today(),
                }),
            });

            notify('Repayment recorded.');
            setRepaying(null);
            setRepaymentAmount('');
            await loadRecords();
            await onChanged?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="page-content money-lent-page">
            <div className="page-heading">
                <div>
                    <div className="eyebrow">POCKETWISE WORKSPACE</div>
                    <h1>Money Lent</h1>
                    <p>Keep track of money you've lent and repayments you receive.</p>
                </div>
            </div>

            <div className="stats-grid money-lent-stats">
                <div className="stat-card">
                    <div className="stat-top">
                        <span>Total lent</span>
                        <div className="stat-icon purple"><HandCoins size={18} /></div>
                    </div>
                    <div className="stat-value">{money(summary.totalLent, currency)}</div>
                    <div className="stat-foot">Total amount recorded</div>
                </div>

                <div className="stat-card">
                    <div className="stat-top">
                        <span>Received back</span>
                        <div className="stat-icon green"><CheckCircle2 size={18} /></div>
                    </div>
                    <div className="stat-value">{money(summary.totalRepaid, currency)}</div>
                    <div className="stat-foot">Total repayments</div>
                </div>

                <div className="stat-card">
                    <div className="stat-top">
                        <span>Still to receive</span>
                        <div className="stat-icon orange"><HandCoins size={18} /></div>
                    </div>
                    <div className="stat-value">{money(summary.outstanding, currency)}</div>
                    <div className="stat-foot">Outstanding balance</div>
                </div>
            </div>

            <section className="panel" style={{ marginBottom: 22 }}>
                <div className="panel-heading">
                    <div>
                        <h2>{editing ? 'Edit lending record' : 'Record money lent'}</h2>
                        <p>Enter the person's details and amount.</p>
                    </div>
                </div>

                <form className="stack-form" onSubmit={submit}>
                    <div className="settings-grid money-lent-form-grid">
                        <label className="field">
                            <span>Person name</span>
                            <input
                                required
                                maxLength="70"
                                placeholder="e.g. Ahmed"
                                value={form.personName}
                                onChange={e => setForm({ ...form, personName: e.target.value })}
                            />
                        </label>

                        <label className="field">
                            <span>Amount ({currency})</span>
                            <input
                                type="number"
                                required
                                min="1"
                                step="1"
                                placeholder="e.g. 10000"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                            />
                        </label>

                        <label className="field">
                            <span>Date lent</span>
                            <input
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </label>

                        <label className="field">
                            <span>Expected return date</span>
                            <input
                                type="date"
                                value={form.expectedReturnDate}
                                onChange={e => setForm({
                                    ...form,
                                    expectedReturnDate: e.target.value,
                                })}
                            />
                        </label>
                    </div>

                    <label className="field">
                        <span>Notes (optional)</span>
                        <textarea
                            rows="3"
                            maxLength="500"
                            placeholder="Additional details..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                        />
                    </label>

                    {error && <div className="inline-error">{error}</div>}

                    <div className="form-actions">
                        <button className="button primary" disabled={busy}>
                            <Plus size={16} />
                            {busy ? 'Saving...' : editing ? 'Update record' : 'Save record'}
                        </button>

                        {editing && (
                            <button
                                type="button"
                                className="button secondary"
                                onClick={resetForm}
                            >
                                <X size={16} /> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="panel transactions-panel">
                <div className="panel-heading">
                    <div>
                        <h2>Lending history</h2>
                        <p>{records.length} lending records</p>
                    </div>
                </div>

                {loading ? (
                    <div className="chart-empty">Loading lending records...</div>
                ) : records.length === 0 ? (
                    <div className="chart-empty">
                        <HandCoins size={28} />
                        <p>No lending records yet. Add your first record above.</p>
                    </div>
                ) : (
                    <div className="table-scroll money-lent-table-wrapper">
                        <table className="transactions-table money-lent-table">
                            <thead>
                                <tr>
                                    <th>Person</th>
                                    <th>Amount</th>
                                    <th>Repaid</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record._id}>
                                        <td>
                                            <strong>{record.personName}</strong>
                                            <small style={{ display: 'block', color: '#9297a8' }}>
                                                {new Date(record.date).toLocaleDateString()}
                                            </small>
                                        </td>
                                        <td>{money(record.amount, currency)}</td>
                                        <td>{money(record.totalRepaid, currency)}</td>
                                        <td><strong>{money(record.outstanding, currency)}</strong></td>
                                        <td>
                                            <span className={`status-pill ${record.status === 'Paid' ? 'paid' : 'pending'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                {record.outstanding > 0 && (
                                                    <button
                                                        title="Record repayment"
                                                        onClick={() => {
                                                            setRepaying(record);
                                                            setRepaymentAmount('');
                                                            setError('');
                                                        }}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                <button title="Edit" onClick={() => startEdit(record)}>
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    title="Delete"
                                                    onClick={() => deleteRecord(record._id)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {repaying && (
                <div className="modal-backdrop">
                    <section className="modal">
                        <div className="modal-heading">
                            <div>
                                <h2>Record repayment</h2>
                                <p>
                                    {repaying.personName} · Outstanding:{' '}
                                    {money(repaying.outstanding, currency)}
                                </p>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setRepaying(null)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form className="stack-form" onSubmit={addRepayment}>
                            <label className="field">
                                <span>Amount received ({currency})</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={repaying.outstanding}
                                    step="1"
                                    required
                                    value={repaymentAmount}
                                    onChange={e => setRepaymentAmount(e.target.value)}
                                    placeholder="Enter repayment amount"
                                />
                            </label>

                            {error && <div className="inline-error">{error}</div>}

                            <button className="button primary" disabled={busy}>
                                {busy ? 'Saving...' : 'Save repayment'}
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
