import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTasksByProjectId, deleteTask as deleteTaskApi } from '../../api/taskApi';
import { useAuth } from '../../contexts/AuthContext';

const ITEMS_PER_PAGE = 5;

function TaskList({ projectId, projectCreatorId, systemUsers = [] }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const usersMap = useMemo(() => {
        const map = new Map();
        if (Array.isArray(systemUsers)) {
            systemUsers.forEach(u => map.set(u.id, u.name));
        }
        return map;
    }, [systemUsers]);

    const fetchProjectTasks = useCallback(async () => {
        if (!projectId) {
            setTasks([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const projectTasksData = await getTasksByProjectId(projectId);
            setTasks(projectTasksData || []);
            setError('');
        } catch (err) {
            setError('Falha ao carregar tarefas.');
            console.error("Erro em TaskList ao buscar tarefas:", err.response || err.message || err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectTasks();
    }, [fetchProjectTasks]);

    const handleDeleteTask = async (taskId, taskCreatorId) => {
        if (user.role !== 'admin' && user.id !== taskCreatorId && user.id !== projectCreatorId) {
            alert("Você não tem permissão para excluir esta tarefa.");
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
            try {
                await deleteTaskApi(taskId);
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (err) {
                alert("Falha ao excluir tarefa: " + (err.message || 'Erro desconhecido'));
            }
        }
    };

    const filteredTasks = useMemo(() => {
        let tempTasks = Array.isArray(tasks) ? tasks : [];
        if (statusFilter) {
            tempTasks = tempTasks.filter(task => task.status === statusFilter);
        }
        if (searchTerm) {
            tempTasks = tempTasks.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return tempTasks;
    }, [tasks, statusFilter, searchTerm]);

    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTasks, currentPage]);

    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

    const goToNextPage = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
    };
    const goToPreviousPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    if (loading) return <div className="page-container" style={{textAlign: 'center', padding: '20px'}}>Carregando tarefas...</div>;
    if (error && !loading) return <p style={{ color: 'red', padding: '20px' }}>{error}</p>;

    return (
        <div className="task-list-section" style={{marginTop: '20px'}}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Buscar tarefas por título..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{ flexGrow: 1, padding: '8px' }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '8px' }}
                >
                    <option value="">Todos os Status</option>
                    <option value="todo">A Fazer</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="done">Concluída</option>
                </select>
            </div>

            {paginatedTasks.length === 0 && !loading ? (
                <p>Nenhuma tarefa encontrada para este projeto ou com os filtros aplicados.</p>
            ) : (
                paginatedTasks.map(task => {
                    const creatorName = usersMap.get(task.creator_id) || `ID ${task.creator_id}`;
                    return (
                        <div key={task.id} className="card" style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start' }}>
                            <img
                                src={task.image_url || 'https://via.placeholder.com/50'}
                                alt={task.title}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '15px', borderRadius: 'var(--cantos-arredondados)' }}
                            />
                            <div style={{flex: 1}}>
                                <h5 className="card-titulo" style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{task.title}</h5>
                                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>Status: {task.status}</p>
                                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>
                                    Entrega: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                                </p>
                                <small>Criada por: {creatorName}</small>
                                <div className="card-acoes" style={{ marginTop: '8px' }}>
                                    {(user.role === 'admin' || user.id === task.creator_id || user.id === projectCreatorId) && (
                                        <>
                                            <Link to={`/project/${projectId}/task/${task.id}/edit`} className="btn btn-link" style={{ padding: '0', marginRight: '10px' }}>
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteTask(task.id, task.creator_id)}
                                                className="btn btn-link"
                                                style={{ color: 'var(--cor-perigo, red)', padding: '0' }}
                                            >
                                                Excluir
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {totalPages > 1 && (
                <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <button onClick={goToPreviousPage} disabled={currentPage === 1} className="btn btn-secundario">
                        Anterior
                    </button>
                    <span>
                        Página {currentPage} de {totalPages}
                    </span>
                    <button onClick={goToNextPage} disabled={currentPage === totalPages} className="btn btn-secundario">
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}

export default TaskList;