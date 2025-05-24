import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { useNavigate, Navigate } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email e senha são obrigatórios.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Por favor, insira um endereço de email válido.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.');
        }
    };

    return (
      
        <div className="login-page-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label> {}
                    <input
                        id="email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Senha:</label> {}
                    <input
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>} {}
                {}
                <button
                    type="submit"
                    className="btn btn-primario"
                    style={{ width: '100%', marginTop: '10px' }}
                >
                    Login
                </button>
            </form>
        </div>
    );
}

export default LoginPage;