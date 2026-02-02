import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');

    const LIMIT = 5;

    useEffect(() => {
        loadBookings();
    }, [offset, sortBy, sortOrder]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const response = await bookingService.getAll({
                limit: LIMIT,
                offset,
                sortBy,
                sortOrder
            });
            setBookings(response.data.results);
            setTotal(response.data.total);
        } catch (err) {
            console.error('Failed to load bookings', err);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await bookingService.cancel(id);
            alert('Booking cancelled successfully');
            loadBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'Cancellation failed');
        }
    };

    const totalPages = Math.ceil(total / LIMIT);
    const currentPage = Math.floor(offset / LIMIT) + 1;

    return (
        <div>
            <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Sort By</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="created_at">Booking Date</option>
                            <option value="depart_time">Departure Time</option>
                            <option value="total_price">Total Price</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Order</label>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="DESC">Descending</option>
                            <option value="ASC">Ascending</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading bookings...</div>
            ) : (
                <>
                    <div className="grid">
                        {bookings.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>No bookings found.</p>
                        ) : (
                            bookings.map(b => (
                                <div key={b.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{b.origin} → {b.destination}</span>
                                        <span className={`status-badge status-${b.status}`}>
                                            {b.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Flight: <strong>{b.flight_number}</strong></span>
                                            <span>${b.flight_unit_price}/seat</span>
                                        </div>
                                        <div style={{ marginBottom: '0.25rem' }}>
                                            Depart: {new Date(b.depart_time).toLocaleString()}
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            Arrive: {new Date(b.arrive_time).toLocaleString()}
                                        </div>
                                        <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Seats: {b.seats}</span>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)' }}>${b.total_price}</span>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Booked on: {new Date(b.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {b.status !== 'cancelled' && (
                                        <button className="danger" onClick={() => cancelBooking(b.id)} style={{ width: '100%' }}>
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {total > LIMIT && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                            <button
                                className="secondary"
                                style={{ width: 'auto' }}
                                disabled={currentPage === 1}
                                onClick={() => setOffset((currentPage - 2) * LIMIT)}
                            >
                                Prev
                            </button>
                            <span style={{ color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
                            <button
                                className="secondary"
                                style={{ width: 'auto' }}
                                disabled={currentPage === totalPages}
                                onClick={() => setOffset(currentPage * LIMIT)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Bookings;
