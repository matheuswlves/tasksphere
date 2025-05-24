import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 

function Header() {
    const { user } = useAuth(); 

    return (
        <header className="app-header">
            <div className="header-content">
                <Link to="/dashboard" className="logo">
                    TaskSphere
                </Link>
                <nav className="app-nav">
                    {user && (
                        <span className="user-greeting">Olá, {user.name || user.email}!</span>
                    )}
                    {}
                </nav>
            </div>
        </header>
    );
}

export default Header;