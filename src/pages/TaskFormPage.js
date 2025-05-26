import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTask, getTaskById, updateTask } from '../api/taskApi';
import { getProjectById } from '../api/projectApi';

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
        if (!user) return false; 
        try {
            const project = await getProjectById(projectId);
            setProjectCreatorId(project.creator_id);
            if (user.role === 'admin' || project.creator_id === user.id || project.collaborators?.includes(user.id)) {
                return true;
            } else {
                setError("Você não tem permissão para gerenciar tarefas neste projeto.");
                setCanProceed(false);
                return false;
            }
        } catch (err) {
            console.error("Falha ao buscar dados do projeto para o formulário de tarefa", err);
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
            } catch (err) {
                setError('Falha ao carregar dados da tarefa.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [taskId, isEditing, user]);

    useEffect(() => {
        const initialize = async () => {
            if (!user) {
                setError("Usuário não autenticado.");
                setCanProceed(false);
                setLoading(false);
                return;
            }
            setLoading(true);
            const hasProjectAccess = await fetchProjectCreator();
            if (hasProjectAccess) {
                if (isEditing) {
                    await fetchTaskData(); 
                }
                setCanProceed(true); 
            } else {
            }
            setLoading(false);
        };
        initialize();
    }, [fetchProjectCreator, fetchTaskData, isEditing, user]);


    const canEditThisTask = () => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (!projectCreatorId) return false; 
        if (isEditing && taskCreatorId) { 
            return user.id === taskCreatorId || user.id === projectCreatorId;
        }
        return true; 
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

        if (isEditing && !canEditThisTask()) {
            setError("Você não tem permissão para editar esta tarefa.");
            return;
        }

        setLoading(true);
        const taskPayload = {
            title: title.trim(),
            status,
            due_date: new Date(dueDate).toISOString(),
            image_url: imageUrl.trim(),
            project_id: projectId,
        };

        try {
            if (isEditing) {
                await updateTask(taskId, { ...taskPayload, creator_id: taskCreatorId });
            } else {
                await createTask({ ...taskPayload, creator_id: user.id });
            }
            alert(`Tarefa ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
            navigate(`/project/${projectId}`);
        } catch (err) {
            setError(`Falha ao ${isEditing ? 'atualizar' : 'criar'} tarefa. ` + (err.message || 'Verifique o console para detalhes.'));
            console.error("Falha na operação da API (TaskForm):", err.response || err.message || err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container" style={{textAlign: 'center'}}>Carregando...</div>;
    if (!canProceed) {
        return <div className="page-container" style={{ color: 'red' }}>{error || "Não é possível carregar o formulário da tarefa."} <Link to={projectId ? `/project/${projectId}` : "/dashboard"}>Voltar</Link></div>;
    }
    if (isEditing && projectCreatorId && taskCreatorId && !canEditThisTask()){
        return <div className="page-container" style={{ color: 'red' }}>Você não tem permissão para editar esta tarefa. <Link to={`/project/${projectId}`}>Voltar ao Projeto</Link></div>;
    }

    return (
        <div className="page-container" style={{ maxWidth: '600px' }}>
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
                    disabled={loading || (isEditing && !canEditThisTask())}
                    style={{ width: '100%', marginTop: '10px' }}
                >
                    {loading ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Tarefa')}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to={`/project/${projectId}`} className="btn btn-link">
                    Voltar para o Projeto
                </Link>
            </div>
        </div>
    );
}

export default TaskFormPage;