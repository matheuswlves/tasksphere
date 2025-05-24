import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'C:/Users/mathe/tasksphere/src/contexts/AuthContext.js';
import { getProjectById, deleteProject } from 'C:/Users/mathe/tasksphere/src/api/projectApi.js';
import TaskList from 'C:/Users/mathe/tasksphere/src/components/organisms/TaskList.js'; 

function ProjectDetailPage() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProjectDetails = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getProjectById(projectId);
            const isCreator = data.creator_id === user.id;
            const isCollaborator = data.collaborators?.includes(user.id);

            if (!isCreator && !isCollaborator) {
                setError("Você não tem permissão para visualizar este projeto.");
                return; 
            }
            setProject(data);
            setError('');
        } catch (err) {
            setError('Falha ao buscar detalhes do projeto.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId, user]); 

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    const handleDeleteProject = async () => {
        if (project.creator_id !== user.id) {
            alert("Apenas o criador do projeto pode excluí-lo.");
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
            try {
                await deleteProject(projectId);
                alert('Projeto excluído com sucesso.');
                navigate('/dashboard');
            } catch (err) {
                setError('Falha ao excluir projeto.'); 
                console.error(err);
            }
        }
    };

    if (loading) return <div>Carregando detalhes do projeto...</div>; 
    if (error) return <div style={{ color: 'red' }}>{error} <Link to="/dashboard">Ir para o Dashboard</Link></div>;
    if (!project) return <div>Projeto não encontrado.</div>; 

    const isCreator = project.creator_id === user.id;

    return (
        
        <div className="page-container"> {}
            {}
            <h2>{project?.name}</h2>
            <p>{project?.description}</p>
            <p><strong>Data de Início:</strong> {project ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Data de Término:</strong> {project ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>

            {isCreator && (
                <div className="card-acoes" style={{ marginBottom: '20px', marginTop: '20px' }}> {}
                    <Link to={`/project/${projectId}/edit`} className="btn btn-secundario">
                        Editar Projeto
                    </Link>
                    <button onClick={handleDeleteProject} className="btn btn-perigo"> {}
                        Excluir Projeto
                    </button>
                    <Link to={`/project/${projectId}/collaborators`} className="btn btn-secundario">
                        Gerenciar Colaboradores
                    </Link>
                </div>
            )}

            <h3>Colaboradores:</h3>
            {}
            <ul>
                {project?.collaborators?.map(collabId => <li key={collabId}>ID do Usuário: {collabId} (Detalhes a serem buscados)</li>)}
            </ul>

            <h3>Tarefas:</h3>
                    <Link to={`/project/${projectId}/task/new`} className="btn btn-primario" style={{ marginBottom: '15px'}}>
                        Adicionar Nova Tarefa
                    </Link>

                    <TaskList projectId={projectId} projectCreatorId={project?.creator_id} />   

            {}
            {}
            {}
        </div>
        
    );
}

export default ProjectDetailPage;