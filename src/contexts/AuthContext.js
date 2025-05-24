import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; 

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3001'; 

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        
        const storedUser = localStorage.getItem('tasksphere_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.get(`${API_URL}/users?email=${email}`);
            if (response.data.length > 0) {
                const foundUser = response.data[0];
                if (foundUser.password === password) {
                    setUser(foundUser);
                    localStorage.setItem('tasksphere_user', JSON.stringify(foundUser));
                    return foundUser;
                }
            }
            throw new Error('Email ou senha inválidos');
        } catch (error) {
            console.error("Login falhou:", error);
            throw error; 
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('tasksphere_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading: loading }}>
            {!loading && children} {}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);