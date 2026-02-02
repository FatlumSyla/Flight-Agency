import React, { useState, useEffect } from 'react';
import { flightService, bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Flights = () => {
    const { isAdmin } = useAuth();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({
        origin: '',
        destination: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'depart_time'
    });

    useEffect(() => {
        loadFlights();
    }, []);

    const loadFlights = async (params = {}) => {
        setLoading(true);
        try {
            const activeParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== '')
            );

            const response = Object.keys(activeParams).length > 0
                ? await flightService.search(activeParams)
                : await flightService.getAll();

            setFlights(Array.isArray(response.data) ? response.data : response.data.results);
        } catch (err) {
            console.error('Failed to load flights', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadFlights(searchParams);
    };

    const handleReset = () => {
        const defaultParams = { origin: '', destination: '', minPrice: '', maxPrice: '', sortBy: 'depart_time' };
        setSearchParams(defaultParams);
        loadFlights(defaultParams);
    };

    const bookFlight = async (flightId) => {
        const seats = prompt("How many seats?", "1");
        if (!seats) return;

        try {
            await bookingService.create({ flightId, seats: parseInt(seats) });
            alert('Booking confirmed!');
            loadFlights(searchParams);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        }
    };

    return (
        <div>
            <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Origin</label>
                        <input
                            type="text"
                            placeholder="e.g. New York"
                            value={searchParams.origin}
                            onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Destination</label>
                        <input
                            type="text"
                            placeholder="e.g. London"
                            value={searchParams.destination}
                            onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Min Price</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={searchParams.minPrice}
                            onChange={(e) => setSearchParams({ ...searchParams, minPrice: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Max Price</label>
                        <input
                            type="number"
                            placeholder="1000"
                            value={searchParams.maxPrice}
                            onChange={(e) => setSearchParams({ ...searchParams, maxPrice: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Sort By</label>
                        <select
                            value={searchParams.sortBy}
                            onChange={(e) => setSearchParams({ ...searchParams, sortBy: e.target.value })}
                        >
                            <option value="depart_time">Departure Time</option>
                            <option value="price">Price</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" style={{ flex: 1 }}>Search</button>
                        <button type="button" className="secondary" style={{ flex: 1 }} onClick={handleReset}>Reset</button>
                    </div>
                </form>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading flights...</div>
            ) : (
                <div className="grid">
                    {flights.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>No flights found matching your criteria.</p>
                    ) : (
                        flights.map(f => (
                            <div key={f.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{f.origin} → {f.destination}</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>${f.price}</span>
                                </div>
                                <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '0.875rem' }}>{new Date(f.depart_time).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.875rem' }}>Flight: {f.flight_number}</div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: f.available_seats > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {f.available_seats} seats remaining
                                    </div>
                                </div>
                                {!isAdmin && (
                                    <button
                                        onClick={() => bookFlight(f.id)}
                                        disabled={f.available_seats === 0}
                                        style={{ width: '100%', opacity: f.available_seats === 0 ? 0.5 : 1 }}
                                    >
                                        {f.available_seats === 0 ? 'Sold Out' : 'Book Now'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Flights;
