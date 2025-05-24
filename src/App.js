// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// IMPORTS QUE FALTAVAM NO TRECHO ENVIADO ANTERIORMENTE, MAS VOCÊ DEVE TÊ-LOS NO SEU CÓDIGO COMPLETO
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage from './pages/ProjectFormPage';
import TaskFormPage from './pages/TaskFormPage';
import ManageCollaboratorsPage from './pages/ManageCollaboratorsPage';
// --- FIM DOS IMPORTS QUE FALTAVAM ---
import ProtectedRoute from './routes/ProtectedRoute';
import Header from './components/layout/Header';

const ProtectedLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <Header />
            <main className="page-content-wrapper">
                <Outlet />
            </main>
            {user && (
                <footer className="app-footer" style={{ textAlign: 'center', padding: '20px', marginTop: '30px' }}>
                    <button onClick={handleLogout} className="btn btn-secundario">
                        Sair da Conta
                    </button>
                </footer>
            )}
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<ProtectedRoute />}>
                        <Route path="/" element={<ProtectedLayout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            {/* ADICIONANDO AS ROTAS DE PROJETO E TAREFA AQUI DENTRO */}
                            <Route path="project/new" element={<ProjectFormPage />} />
                            <Route path="project/:projectId" element={<ProjectDetailPage />} />
                            <Route path="project/:projectId/edit" element={<ProjectFormPage />} />
                            <Route path="project/:projectId/task/new" element={<TaskFormPage />} />
                            <Route path="project/:projectId/task/:taskId/edit" element={<TaskFormPage />} />
                            <Route path="project/:projectId/collaborators" element={<ManageCollaboratorsPage />} />
                            {/* FIM DAS ROTAS ADICIONADAS */}
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;