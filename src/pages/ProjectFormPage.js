import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createProject, getProjectById, updateProject } from '../api/projectApi';

function ProjectFormPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditing = Boolean(projectId);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialProjectCreatorId, setInitialProjectCreatorId] = useState(null);

    const fetchProjectData = useCallback(async () => {
        if (isEditing && user) {
            setLoading(true);
            try {
                const project = await getProjectById(projectId);
                if (project.creator_id !== user.id && user.role !== 'admin') {
                    setError("Você não está autorizado a editar este projeto.");
                    navigate('/dashboard');
                    return;
                }
                setName(project.name);
                setDescription(project.description || '');
                setStartDate(project.start_date.split('T')[0]);
                setEndDate(project.end_date.split('T')[0]);
                setInitialProjectCreatorId(project.creator_id);
            } catch (err) {
                setError('Falha ao carregar dados do projeto.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [projectId, isEditing, user, navigate]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    const validateForm = () => {
        if (!name.trim() || !startDate || !endDate) {
            setError('Nome, Data de Início e Data de Término são obrigatórios.');
            return false;
        }
        if (name.trim().length < 3) {
            setError('O nome do projeto deve ter pelo menos 3 caracteres.');
            return false;
        }
        if (description.length > 500) {
            setError('A descrição não pode exceder 500 caracteres.');
            return false;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            setError('A Data de Término deve ser posterior à Data de Início.');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (isEditing && initialProjectCreatorId && user.id !== initialProjectCreatorId && user.role !== 'admin') {
            setError("Você não tem permissão para submeter edições para este projeto.");
            navigate('/dashboard');
            return;
        }

        setLoading(true);
        const projectPayload = {
            name: name.trim(),
            description,
            start_date: startDate,
            end_date: endDate,
        };

        try {
            if (isEditing) {
                const currentProject = await getProjectById(projectId);
                await updateProject(projectId, { ...currentProject, ...projectPayload, collaborators: currentProject.collaborators, creator_id: currentProject.creator_id });
            } else {
                await createProject({ ...projectPayload, creator_id: user.id, collaborators: [user.id] });
            }
            navigate(isEditing ? `/project/${projectId}` : '/dashboard');
        } catch (err) {
            setError(`Falha ao ${isEditing ? 'atualizar' : 'criar'} projeto.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) return <div className="page-container" style={{textAlign: 'center'}}>Carregando detalhes do projeto...</div>;
    
    if (isEditing && error.includes("autorizado")) {
        return <div className="page-container" style={{ color: 'red' }}>{error} <Link to="/dashboard">Voltar ao Dashboard</Link></div>;
    }
    
    return (
        <div className="page-container" style={{ maxWidth: '700px' }}>
            <h2>{isEditing ? 'Editar Projeto' : 'Criar Novo Projeto'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Nome do Projeto:</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="description">Descrição (opcional):</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength="500"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="startDate">Data de Início:</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="endDate">Data de Término:</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                <button
                    type="submit"
                    className="btn btn-primario"
                    disabled={loading}
                    style={{ width: '100%', marginTop: '10px' }}
                >
                    {loading ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Projeto')}
                </button>
            </form>
            {isEditing && projectId && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to={`/project/${projectId}`} className="btn btn-link">
                        Cancelar Edição (Voltar ao Projeto)
                    </Link>
                </div>
            )}
            {!isEditing && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/dashboard" className="btn btn-link">
                        Cancelar (Voltar ao Dashboard)
                    </Link>
                </div>
            )}
        </div>
    );
}

export default ProjectFormPage;