import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = isAdmin
        ? [{ to: '/admin', label: 'Admin' }]
        : [
            { to: '/', label: 'Flights' },
            { to: '/bookings', label: 'My Bookings' }
        ];

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <header style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            maxWidth: '1200px',
            margin: '0 auto',
            borderRadius: '0 0 16px 16px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Plane className="primary" size={24} color="var(--primary)" />
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>FlightAgency</h1>
                </div>

                {/* Desktop Nav */}
                <nav style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    '@media (max-width: 768px)': { display: 'none' }
                }} className="desktop-only">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                color: location.pathname === link.to ? 'white' : 'var(--text-muted)',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {user?.name}
                        </span>
                        <button className="secondary" onClick={handleLogout} style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="secondary mobile-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ width: 'auto', padding: '0.5rem', display: 'none' }}
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav Overlay */}
            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderTop: '1px solid var(--border)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    borderRadius: '0 0 16px 16px',
                    zIndex: 999
                }}>
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                color: location.pathname === link.to ? 'white' : 'var(--text-muted)',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                padding: '0.5rem 0'
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.name}</span>
                        <button className="secondary" onClick={handleLogout} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-toggle { display: block !important; }
                }
            `}</style>
        </header>
    );
};

export default Navbar;
