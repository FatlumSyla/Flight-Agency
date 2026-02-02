import React, { useState, useEffect } from 'react';
import { flightService } from '../services/api';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';

const Admin = () => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, capacity: 0, available: 0 });
    const [showModal, setShowModal] = useState(false);
    const [editingFlight, setEditingFlight] = useState(null);
    const [formData, setFormData] = useState({
        flight_number: '',
        origin: '',
        destination: '',
        depart_time: '',
        arrive_time: '',
        capacity: '',
        price: ''
    });

    useEffect(() => {
        loadFlights();
        // Set body background for admin
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        return () => {
            document.body.style.background = '';
        };
    }, []);

    const loadFlights = async () => {
        setLoading(true);
        try {
            const response = await flightService.getAll();
            const data = response.data;
            setFlights(data);

            const total = data.length;
            const capacity = data.reduce((sum, f) => sum + parseInt(f.capacity), 0);
            const available = data.reduce((sum, f) => sum + parseInt(f.available_seats), 0);
            setStats({ total, capacity, available });
        } catch (err) {
            console.error('Failed to load flights', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Departure before Arrival
        if (new Date(formData.depart_time) >= new Date(formData.arrive_time)) {
            alert('Error: Arrival time must be later than departure time.');
            return;
        }

        try {
            if (editingFlight) {
                await flightService.update(editingFlight.id, formData);
            } else {
                await flightService.create(formData);
            }
            setShowModal(false);
            setEditingFlight(null);
            setFormData({ flight_number: '', origin: '', destination: '', depart_time: '', arrive_time: '', capacity: '', price: '' });
            loadFlights();
        } catch (err) {
            console.error('Failed to save flight', err);
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const deleteFlight = async (id, booked) => {
        if (booked > 0) {
            if (!confirm(`This flight has ${booked} active bookings. Are you sure?`)) return;
        } else {
            if (!confirm('Are you sure you want to delete this flight?')) return;
        }

        try {
            await flightService.delete(id);
            loadFlights();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const openEditModal = (flight) => {
        setEditingFlight(flight);
        setFormData({
            flight_number: flight.flight_number,
            origin: flight.origin,
            destination: flight.destination,
            depart_time: flight.depart_time.slice(0, 16),
            arrive_time: flight.arrive_time.slice(0, 16),
            capacity: flight.capacity,
            price: flight.price
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            flight_number: '',
            origin: '',
            destination: '',
            depart_time: '',
            arrive_time: '',
            capacity: '',
            price: ''
        });
    };

    const formatDisplayDateTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0
                }}>
                    ✈️ Admin
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        ADMIN
                    </span>
                    <button className="secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => window.location.href = '/'}>
                        View Site
                    </button>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: '0.25rem' }}>Total Flights</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.total}</p>
                </div>
                <div className="stat-card">
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: '0.25rem' }}>Total Capacity</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.capacity}</p>
                </div>
                <div className="stat-card">
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: '0.25rem' }}>Available Seats</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.available}</p>
                </div>
            </div>

            <div className="card admin-card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Create New Flight</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>Flight #</label>
                            <input required value={formData.flight_number} onChange={e => setFormData({ ...formData, flight_number: e.target.value })} placeholder="AA123" />
                        </div>
                        <div className="form-group">
                            <label>Origin</label>
                            <input required value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} placeholder="JFK" />
                        </div>
                        <div className="form-group">
                            <label>Destination</label>
                            <input required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="LHR" />
                        </div>
                        <div className="form-group">
                            <label>Departure</label>
                            <input type="datetime-local" required value={formData.depart_time} onChange={e => setFormData({ ...formData, depart_time: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Arrival</label>
                            <input type="datetime-local" required value={formData.arrive_time} onChange={e => setFormData({ ...formData, arrive_time: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Capacity</label>
                            <input type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Price ($)</label>
                            <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" style={{ width: 'auto', background: 'var(--admin-success-gradient)', color: '#1a5f7a', padding: '0.75rem 2rem' }}>
                        {editingFlight ? 'Update' : 'Create'}
                    </button>
                </form>
            </div>

            <div className="card admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>All Flights</h2>
                    <button className="secondary" style={{ width: 'auto', padding: '6px 12px' }} onClick={loadFlights}>
                        <RefreshCw size={14} />
                    </button>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: 'var(--admin-gradient)', color: 'white' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Flight #</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Route</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Departure</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Seats</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Price</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flights.map(f => {
                                const booked = f.capacity - f.available_seats;
                                return (
                                    <tr key={f.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px', fontSize: '14px' }}><strong>{f.flight_number}</strong></td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>{f.origin} → {f.destination}</td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>{formatDisplayDateTime(f.depart_time)}</td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>
                                            {f.available_seats}/{f.capacity}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>${parseFloat(f.price).toFixed(2)}</td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="secondary" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => openEditModal(f)}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="danger" style={{ width: 'auto', padding: '4px 8px', background: 'var(--admin-danger-gradient)' }} onClick={() => deleteFlight(f.id, booked)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card admin-card" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Update Flight</h3>
                            <button className="secondary" style={{ width: 'auto', padding: '4px 8px', fontSize: '1.25rem' }} onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Flight #</label>
                                    <input required value={formData.flight_number} onChange={e => setFormData({ ...formData, flight_number: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Price</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Origin</label>
                                    <input required value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Destination</label>
                                    <input required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Departure</label>
                                    <input type="datetime-local" required value={formData.depart_time} onChange={e => setFormData({ ...formData, depart_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Arrival</label>
                                    <input type="datetime-local" required value={formData.arrive_time} onChange={e => setFormData({ ...formData, arrive_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                                <button type="submit" style={{ flex: 1, background: 'var(--admin-success-gradient)', color: '#1a5f7a' }}>Update</button>
                                <button type="button" className="secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
