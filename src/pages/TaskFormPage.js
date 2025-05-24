import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from 'C:/Users/mathe/tasksphere/src/contexts/AuthContext.js';
import { createTask, getTaskById, updateTask } from 'C:/Users/mathe/tasksphere/src/api/taskApi.js';
import { getProjectById } from 'C:/Users/mathe/tasksphere/src/api/projectApi.js'; 

function TaskFormPage() {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditing = Boolean(taskId);

    const [title, setTitle] = useState(''); 
    const [status, setStatus] = useState('todo'); 
    const [dueDate, setDueDate] = useState('');
    const [imageUrl, setImageUrl] = useState(''); 

    const [projectCreatorId, setProjectCreatorId] = useState(null);
    const [taskCreatorId, setTaskCreatorId] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [canProceed, setCanProceed] = useState(false); 

    const fetchProjectCreator = useCallback(async () => {
        if (!user) return;
        try {
            const project = await getProjectById(projectId);
            setProjectCreatorId(project.creator_id);
            if (!project.collaborators?.includes(user.id) && project.creator_id !== user.id) {
                setError("Você não é um colaborador deste projeto e não pode criar ou editar tarefas.");
                setCanProceed(false);
                return false;
            }
            return true; 
        } catch (err) {
            console.error("Falha ao buscar criador do projeto", err);
            setError("Falha ao verificar detalhes do projeto. Não é possível prosseguir.");
            setCanProceed(false);
            return false;
        }
    }, [projectId, user]);

    const fetchTaskData = useCallback(async () => {
        if (isEditing && user) {
            setLoading(true);
            try {
                const task = await getTaskById(taskId);
                setTaskCreatorId(task.creator_id); 
                setTitle(task.title);
                setStatus(task.status);
                setDueDate(task.due_date.split('T')[0]); 
                setImageUrl(task.image_url);
                setCanProceed(true); 
            } catch (err) {
                setError('Falha ao carregar dados da tarefa.');
                console.error(err);
                setCanProceed(false);
            } finally {
                setLoading(false);
            }
        } else if (!isEditing) {
        }
    }, [taskId, isEditing, user]);

    useEffect(() => {
         const initialize = async () => {
             setLoading(true);
             const isCollaboratorOrCreator = await fetchProjectCreator();
             if (isCollaboratorOrCreator) {
                 if (isEditing) {
                     await fetchTaskData();
                 } else {
                     setCanProceed(true); 
                 }
             }
             setLoading(false);
         };
         initialize();
    }, [fetchProjectCreator, fetchTaskData, isEditing]);


    const canEditOrDeleteTask = () => {
        if (!user || !projectCreatorId) return false; 
        return user.id === taskCreatorId || user.id === projectCreatorId;
    };

    const validateForm = () => {
        setError(''); 
        if (!title.trim() || !status || !dueDate || !imageUrl.trim()) {
            setError('Todos os campos são obrigatórios.');
            return false;
        }
        if (title.trim().length < 3) {
            setError('O título da tarefa deve ter pelo menos 3 caracteres.');
            return false;
        }
        if (new Date(dueDate) <= new Date()) {
            setError('A data de entrega deve ser no futuro.');
            return false;
        }
        try {
            new URL(imageUrl);
        } catch (_) {
            setError('URL da imagem deve ser uma URL válida.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (isEditing && !canEditOrDeleteTask()) {
             setError("Você não tem permissão para editar esta tarefa.");
             return;
        }

        setLoading(true);
        const taskData = {
            title: title.trim(),
            status,
            due_date: new Date(dueDate).toISOString(), 
            image_url: imageUrl.trim(),
            project_id: projectId, 
        };

    try {
        if (isEditing) {
            console.log("Tentando atualizar tarefa...");
            await updateTask(taskId, taskData); 
        } else {
            console.log("Tentando criar tarefa...");
            await createTask(taskData);
        }
        console.log("Operação da API bem-sucedida");
        alert(`Tarefa ${isEditing ? 'atualizada' : 'criada'} com sucesso!`); 
        navigate(`/project/${projectId}`); 
    } catch (err) {
        console.error("Falha na operação da API:", err.response || err.message || err);
        setError(`Falha ao ${isEditing ? 'atualizar' : 'criar'} tarefa. ` + (err.message || 'Verifique o console para detalhes.'));
    } finally {
        setLoading(false);
        console.log("handleSubmit finalizado");
    }
        
    };

    if (loading) return <div>Carregando...</div>;
    if (!canProceed) { 
         return <div style={{ color: 'red' }}>{error || "Não é possível carregar o formulário da tarefa."} <Link to={`/project/${projectId}`}>Voltar ao Projeto</Link></div>;
    }
    if (isEditing && projectCreatorId && taskCreatorId && !canEditOrDeleteTask()){
         return <div style={{ color: 'red' }}>Você não tem permissão para editar esta tarefa. <Link to={`/project/${projectId}`}>Voltar ao Projeto</Link></div>;
    }


    return (
        <div className="page-container" style={{ maxWidth: '600px' }}> {}
            <h2>{isEditing ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Título:</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="status">Status:</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="todo">A Fazer</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="done">Concluída</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dueDate">Data de Entrega:</label>
                    <input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="imageUrl">URL da Imagem:</label>
                    <input
                        id="imageUrl"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://exemplo.com/imagem.png"
                    />
                </div>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                <button
                    type="submit"
                    className="btn btn-primario" 
                    disabled={loading || (isEditing && !canEditOrDeleteTask())} 
                    style={{ width: '100%', marginTop: '10px' }} 
                >
                    {loading ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Tarefa')}
                </button>
            </form>
            {}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to={`/project/${projectId}`} className="btn btn-link">
                    Voltar para o Projeto
                </Link>
            </div>
        </div>
    );
}

export default TaskFormPage;
