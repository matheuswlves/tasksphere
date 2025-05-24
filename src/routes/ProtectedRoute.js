import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'C:/Users/mathe/tasksphere/src/contexts/AuthContext.js';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth(); 

    if (isLoading) {
        return <div>Verificando autenticação...</div>; 
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />; 
};

export default ProtectedRoute;