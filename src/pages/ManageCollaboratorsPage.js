import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectById, updateProject } from '../api/projectApi';
import axios from 'axios';

const RANDOM_USER_API = 'https://randomuser.me/api/?results=5&inc=name,email,login';

function ManageCollaboratorsPage() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [currentCollaboratorsDetails, setCurrentCollaboratorsDetails] = useState([]);
    const [allSystemUsers, setAllSystemUsers] = useState([]);
    const [usersToAdd, setUsersToAdd] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchProjectData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setError("Usuário não autenticado.");
            return;
        }
        setLoading(true);
        try {
            const projectData = await getProjectById(projectId);
            if (projectData.creator_id !== user.id && user.role !== 'admin') {
                setError("Você não está autorizado a gerenciar colaboradores para este projeto.");
                setProject(null); 
                setLoading(false);
                return;
            }
            setProject(projectData);

            if (projectData.collaborators && projectData.collaborators.length > 0) {
                const usersResponse = await axios.get(`http://localhost:3001/users`);
                const detailedCollaborators = usersResponse.data.filter(u => projectData.collaborators.includes(u.id));
                setCurrentCollaboratorsDetails(detailedCollaborators);
            } else {
                setCurrentCollaboratorsDetails([]);
            }
            setError('');
        } catch (err) {
            setError('Falha ao carregar dados do projeto.');
            console.error("Erro em fetchProjectData:", err.response || err.message || err);
        } finally {
            setLoading(false);
        }
    }, [projectId, user, navigate]); 

    const fetchAllSystemUsers = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:3001/users`);
            setAllSystemUsers(response.data || []);
        } catch (err) {
            console.error("Falha ao buscar todos os usuários do sistema:", err.response || err.message || err);
            setError("Não foi possível carregar a lista de usuários do sistema.");
        }
    }, []);

    useEffect(() => {
        fetchProjectData();
        fetchAllSystemUsers();
    }, [fetchProjectData, fetchAllSystemUsers]);

    useEffect(() => {
        if (project && allSystemUsers.length > 0) {
            const potentialCollaborators = allSystemUsers.filter(systemUser =>
                systemUser.id !== project.creator_id &&
                !project.collaborators.includes(systemUser.id) &&
                (searchTerm === '' || 
                 systemUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 systemUser.email.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setUsersToAdd(potentialCollaborators);
        } else {
            setUsersToAdd([]);
        }
    }, [searchTerm, allSystemUsers, project]);


    const handleAddExistingCollaborator = async (userIdToAdd) => {
        if (!project || (user.id !== project.creator_id && user.role !== 'admin')) {
            setError("Apenas o criador do projeto ou um administrador pode adicionar colaboradores.");
            return;
        }
        if (project.collaborators.includes(userIdToAdd)) {
            setError("Este usuário já é um colaborador.");
            return;
        }

        setActionLoading(true);
        setSuccessMessage(''); setError('');

        try {
            const updatedCollaborators = [...project.collaborators, userIdToAdd];
            await updateProject(projectId, { ...project, collaborators: updatedCollaborators });
            
            setProject(prev => ({ ...prev, collaborators: updatedCollaborators }));
            const addedUser = allSystemUsers.find(u => u.id === userIdToAdd);
            if (addedUser) {
                setCurrentCollaboratorsDetails(prevDetails => [...prevDetails, addedUser]);
                setSuccessMessage(`${addedUser.name} adicionado como colaborador.`);
            }
        } catch (err) {
            setError(`Falha ao adicionar colaborador: ${err.message}`);
            console.error("Erro em handleAddExistingCollaborator:", err.response || err.message || err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorIdToRemove) => {
        if (!project || (user.id !== project.creator_id && user.role !== 'admin')) {
            setError("Apenas o criador do projeto ou um administrador pode remover colaboradores.");
            return;
        }
        if (collaboratorIdToRemove === project.creator_id) {
            setError("O criador do projeto não pode ser removido.");
            return;
        }
        setActionLoading(true);
        setSuccessMessage(''); setError('');

        if (window.confirm("Tem certeza que deseja remover este colaborador?")) {
            try {
                const updatedCollaborators = project.collaborators.filter(id => id !== collaboratorIdToRemove);
                await updateProject(projectId, { ...project, collaborators: updatedCollaborators });

                setProject(prev => ({ ...prev, collaborators: updatedCollaborators }));
                setCurrentCollaboratorsDetails(prevDetails => prevDetails.filter(c => c.id !== collaboratorIdToRemove));
                
                setSuccessMessage('Colaborador removido com sucesso.');
            } catch (err) {
                setError(`Falha ao remover colaborador: ${err.message}`);
                console.error("Erro em handleRemoveCollaborator:", err.response || err.message || err);
            } finally {
                setActionLoading(false);
            }
        } else {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="page-container" style={{textAlign: 'center'}}>Carregando...</div>;
    if (!project && !error) return <div className="page-container" style={{textAlign: 'center'}}>Carregando dados do projeto...</div>; // Melhor feedback inicial
    if (error && error.includes("autorizado")) return <div className="page-container" style={{ color: 'red' }}>{error} <Link to={`/project/${projectId}`}>Voltar ao Projeto</Link></div>;
    if (!project && error) return <div className="page-container" style={{ color: 'red', textAlign: 'center' }}>{error} <Link to="/dashboard">Voltar ao Dashboard</Link></div>;


    return (
        <div className="page-container" style={{maxWidth: '800px'}}>
            <h2>Gerenciar Colaboradores para: {project?.name}</h2>
            
            {error && !error.includes("autorizado") && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            <h3>Colaboradores Atuais:</h3>
            {currentCollaboratorsDetails.length > 0 ? (
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                    {currentCollaboratorsDetails.map(collab => (
                        <li key={collab.id} className="card" style={{ marginBottom: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{collab.name} ({collab.email}) {collab.id === project.creator_id ? <strong>(Criador)</strong> : ''}</span>
                            {collab.id !== project.creator_id && (
                                <button 
                                    onClick={() => handleRemoveCollaborator(collab.id)} 
                                    className="btn btn-perigo btn-pequeno"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Removendo...' : 'Remover'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : <p>Nenhum colaborador (além do criador) neste projeto ainda.</p>}

            <hr style={{margin: '30px 0'}}/>

            <h3>Adicionar Novos Colaboradores (Usuários Existentes no Sistema)</h3>
            <input
                type="text"
                placeholder="Buscar usuário por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box' }}
            />

            {usersToAdd.length > 0 ? (
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                    {usersToAdd.map(u => (
                        <li key={u.id} className="card" style={{ marginBottom: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{u.name} ({u.email})</span>
                            <button
                                onClick={() => handleAddExistingCollaborator(u.id)}
                                className="btn btn-primario btn-pequeno"
                                disabled={actionLoading}
                            >
                                Adicionar
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                searchTerm && <p>Nenhum usuário encontrado com o termo buscado ou todos já são colaboradores/criador.</p>
            )}
            
            <div style={{ marginTop: "30px", textAlign: 'center' }}>
                <Link to={`/project/${projectId}`} className="btn btn-link">
                    Voltar para o Projeto
                </Link>
            </div>
        </div>
    );
}

export default ManageCollaboratorsPage;