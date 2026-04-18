"use client";

import { useState, useEffect } from "react";
import { User, LogIn, BarChart3, Users, Send, Search, RefreshCw, X } from "lucide-react";

type Registration = {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    category: string;
    amount: number;
    status: string;
    ticket_id: string | null;
    paytm_order_id: string | null;
    paytm_payment_id: string | null;
    created_at: string;
    payments?: {
        paytm_payment_id: string;
        status: string;
        amount: number;
    }[];
};

type Stats = {
    totalRevenue: number;
    totalTicketsSold: number;
    totalRegistrations: number;
    categoryCounts: Record<string, number>;
};

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Login State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Dashboard State
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<Registration[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "initiated" | "failed">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<Registration | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    const PAGE_SIZE = 10;

    useEffect(() => {
        // Check if token exists by blindly fetching users. 
        // If it fails with 401, we aren't authenticated.
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/admin/stats`, { credentials: 'include' });
            if (res.ok) {
                setIsAuthenticated(true);
                fetchDashboardData();
            } else {
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const [statsRes, usersRes] = await Promise.all([
                fetch(`${apiUrl}/api/admin/stats`, { credentials: 'include' }),
                fetch(`${apiUrl}/api/admin/users`, { credentials: 'include' })
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
            }
        } catch (e) {
            console.error("Failed to fetch dashboard datas");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await res.json();
            if (res.ok) {
                setIsAuthenticated(true);
                fetchDashboardData();
            } else {
                setLoginError(data.message || "Login failed");
            }
        } catch {
            setLoginError("An error occurred during login");
        }
    };

    const handleResendTicket = async (id: string) => {
        if (!confirm("Are you sure you want to resend the ticket email to this user?")) return;

        setResendingId(id);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/admin/resend-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationId: id }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                alert("Ticket resent successfully!");
            } else {
                alert("Failed: " + data.message);
            }
        } catch {
            alert("An error occurred while resending the ticket");
        } finally {
            setResendingId(null);
        }
    };

    useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.ticket_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
            u.category.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const pageNumbers = (() => {
        const delta = 2;
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    })();

    if (isCheckingAuth) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: 'var(--accent-pink, #f70a7d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <User size={24} color="#000" />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Admin Panel</h1>
                        <p style={{ color: '#a1a1aa', margin: '5px 0 0', fontSize: '0.9rem' }}>Sign in to manage HubO Events</p>
                    </div>

                    {loginError && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{loginError}</div>}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#e4e4e7' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none' }}
                            />
                        </div>
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#e4e4e7' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none' }}
                            />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--accent-pink, #f70a7d)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <LogIn size={18} /> Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {/* Top Navbar */}
            <nav style={{ padding: '20px 40px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', backgroundColor: 'var(--accent-pink, #f70a7d)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>H</div>
                    Admin Dashboard
                </h1>
                <button
                    onClick={() => {
                        setIsAuthenticated(false);
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                        fetch(`${apiUrl}/api/admin/logout`, { method: 'POST', credentials: 'include' });
                    }}
                    style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#e4e4e7', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                    Logout
                </button>
            </nav>

            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Stats Row */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa', marginBottom: '10px' }}><BarChart3 size={20} /> Total Revenue</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{stats.totalRevenue.toLocaleString()}</div>
                        </div>
                        <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa', marginBottom: '10px' }}><Users size={20} /> Tickets Sold</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalTicketsSold} <span style={{ fontSize: '1rem', color: '#71717a' }}>/ {stats.totalRegistrations} Pending</span></div>
                        </div>
                        <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa', marginBottom: '10px' }}>Categories</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {Object.entries(stats.categoryCounts).map(([cat, count]) => (
                                    <span key={cat} style={{ backgroundColor: '#27272a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#e4e4e7' }}>
                                        {cat}: <b>{count}</b>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table Section */}
                <div style={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>
                            Recent Registrations
                            <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 400, color: '#71717a' }}>({filteredUsers.length} results)</span>
                        </h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <input
                                    type="text"
                                    placeholder="Search name, email, ticket ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ padding: '8px 12px 8px 36px', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '240px' }}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                                style={{ padding: '8px 12px', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e4e4e7', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="initiated">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                            <button onClick={fetchDashboardData} style={{ background: '#27272a', border: 'none', color: '#e4e4e7', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#09090b', color: '#a1a1aa' }}>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Name</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Ticket ID</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Category</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Amount</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>No registrations found.</td></tr>
                                ) : paginatedUsers.map(user => (
                                    <tr key={user.id} style={{ borderTop: '1px solid #27272a', backgroundColor: selectedUser?.id === user.id ? '#27272a' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 500, color: '#fff' }}>{user.name}</div>
                                            <div style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>{user.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#e4e4e7' }}>{user.ticket_id ?? '—'}</td>
                                        <td style={{ padding: '16px 20px', color: '#e4e4e7' }}>{user.category}</td>
                                        <td style={{ padding: '16px 20px', color: '#e4e4e7' }}>₹{user.amount}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {(() => {
                                                const hasPaidPayment = user.payments?.some(p => p.status === 'paid');
                                                const effectiveStatus = hasPaidPayment ? 'paid' : user.status;

                                                return (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        backgroundColor: effectiveStatus === 'paid' || effectiveStatus === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' :
                                                            effectiveStatus === 'failed' || effectiveStatus === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                        color: effectiveStatus === 'paid' || effectiveStatus === 'confirmed' ? '#4ade80' :
                                                            effectiveStatus === 'failed' || effectiveStatus === 'cancelled' ? '#ef4444' : '#facc15'
                                                    }}>
                                                        {effectiveStatus.toUpperCase()}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#a1a1aa' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <button onClick={() => setSelectedUser(user)} style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <span style={{ color: '#71717a', fontSize: '0.85rem' }}>
                                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredUsers.length)}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} results
                            </span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ padding: '6px 12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: currentPage === 1 ? '#52525b' : '#e4e4e7', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                                >
                                    ← Prev
                                </button>
                                {pageNumbers.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setCurrentPage(n)}
                                        style={{ padding: '6px 10px', minWidth: '34px', backgroundColor: n === currentPage ? 'var(--accent-pink, #f70a7d)' : '#27272a', border: '1px solid ' + (n === currentPage ? 'var(--accent-pink, #f70a7d)' : '#3f3f46'), color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: n === currentPage ? 600 : 400 }}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '6px 12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: currentPage === totalPages ? '#52525b' : '#e4e4e7', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ backgroundColor: '#18181b', borderRadius: '12px', width: '100%', maxWidth: '500px', border: '1px solid #27272a', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>Ticket Details</h2>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>ID:</span> {selectedUser.id}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Name:</span> {selectedUser.name}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Email:</span> {selectedUser.email}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Phone:</span> {selectedUser.phone}</div>
                            <div style={{ borderTop: '1px solid #27272a', margin: '10px 0' }} />
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Ticket ID:</span> <span style={{ color: '#22d3ee', fontWeight: 600 }}>{selectedUser.ticket_id ?? '—'}</span></div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Category:</span> {selectedUser.category}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Address:</span> {selectedUser.address ?? '—'}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Amount:</span> ₹{selectedUser.amount}</div>
                            <div style={{ borderTop: '1px solid #27272a', margin: '10px 0' }} />
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Status:</span> {selectedUser.status}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Order ID:</span> {selectedUser.paytm_order_id ?? 'N/A'}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Payment ID:</span> {selectedUser.payments?.[0]?.paytm_payment_id ?? selectedUser.paytm_payment_id ?? 'N/A'}</div>
                            <div><span style={{ color: '#71717a', width: '100px', display: 'inline-block' }}>Date:</span> {new Date(selectedUser.created_at).toLocaleString()}</div>
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #27272a', backgroundColor: '#09090b', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {selectedUser.status === 'paid' && (
                                <button
                                    onClick={() => handleResendTicket(selectedUser.id)}
                                    disabled={resendingId === selectedUser.id}
                                    style={{ background: 'var(--accent-pink, #f70a7d)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Send size={16} /> {resendingId === selectedUser.id ? 'Sending...' : 'Resend Ticket'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
