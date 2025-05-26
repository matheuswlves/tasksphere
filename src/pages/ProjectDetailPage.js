import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { useAuth } from '../contexts/AuthContext';
import { getProjectById, deleteProject } from '../api/projectApi';
import TaskList from '../components/organisms/TaskList';

function ProjectDetailPage() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [systemUsers, setSystemUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL_USERS = 'http://localhost:3001/users'; 

    const fetchPageData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setError("Usuário não autenticado.");
            return;
        }
        setLoading(true);
        try {
            const projectData = await getProjectById(projectId);
            const isAdmin = user.role === 'admin';
            const isCreator = projectData.creator_id === user.id;
            const isCollaborator = projectData.collaborators?.includes(user.id);

            if (!isAdmin && !isCreator && !isCollaborator) {
                setError("Você não tem permissão para visualizar este projeto.");
                setLoading(false);
                return;
            }
            setProject(projectData);

            try {
                const usersResponse = await axios.get(API_URL_USERS);
                setSystemUsers(usersResponse.data || []);
            } catch (usersError) {
                console.error("Falha ao buscar usuários do sistema:", usersError);
                setError(prevError => prevError ? `${prevError} E falha ao buscar lista de usuários.` : 'Falha ao buscar lista de usuários.');
            }

            setError(''); 
        } catch (err) {
            setError('Falha ao buscar detalhes do projeto.');
            console.error("Erro em fetchPageData (projeto):", err.response || err.message || err);
        } finally {
            setLoading(false);
        }
    }, [projectId, user]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleDeleteProject = async () => {
        if (!project) return;
        if (project.creator_id !== user.id && user.role !== 'admin') {
            alert("Apenas o criador do projeto ou um administrador pode excluí-lo.");
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
            try {
                setLoading(true);
                await deleteProject(projectId);
                alert('Projeto excluído com sucesso.');
                navigate('/dashboard');
            } catch (err) {
                setError('Falha ao excluir projeto.');
                console.error("Erro em handleDeleteProject:", err.response || err.message || err);
            }
        }
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center' }}>Carregando...</div>;
    if (error) return <div className="page-container" style={{ color: 'red' }}>{error} <Link to="/dashboard">Ir para o Dashboard</Link></div>;
    if (!project) return <div className="page-container" style={{ textAlign: 'center' }}>Projeto não encontrado.</div>;

    const canManageProject = user && (project.creator_id === user.id || user.role === 'admin');
    const canCreateTask = user && (project.creator_id === user.id || user.role === 'admin' || project.collaborators?.includes(user.id));

    return (
        <div className="page-container">
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            <p><strong>Data de Início:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
            <p><strong>Data de Término:</strong> {new Date(project.end_date).toLocaleDateString()}</p>

            {canManageProject && (
                <div className="card-acoes" style={{ marginBottom: '20px', marginTop: '20px' }}>
                    <Link to={`/project/${projectId}/edit`} className="btn btn-secundario">
                        Editar Projeto
                    </Link>
                    <button onClick={handleDeleteProject} className="btn btn-perigo">
                        Excluir Projeto
                    </button>
                    <Link to={`/project/${projectId}/collaborators`} className="btn btn-secundario">
                        Gerenciar Colaboradores
                    </Link>
                </div>
            )}

            <h3>Colaboradores:</h3>
            <ul>
                {project.collaborators?.map(collabId => {
                    const collaborator = systemUsers.find(u => u.id === collabId);
                    return <li key={collabId}>{collaborator ? `${collaborator.name} (${collaborator.email})` : `ID do Usuário: ${collabId}`}</li>;
                })}
            </ul>

            <h3>Tarefas:</h3>
            {canCreateTask && (
                <Link to={`/project/${projectId}/task/new`} className="btn btn-primario" style={{ marginBottom: '15px' }}>
                    Adicionar Nova Tarefa
                </Link>
            )}
            <TaskList
                projectId={projectId}
                projectCreatorId={project.creator_id}
                systemUsers={systemUsers} 
            />
        </div>
    );
}

export default ProjectDetailPage;