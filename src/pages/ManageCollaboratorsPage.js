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
    const [collaboratorsDetails, setCollaboratorsDetails] = useState([]); 
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [actionLoading, setActionLoading] = useState(false); 
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchProjectAndCollaborators = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const projectData = await getProjectById(projectId);
            if (projectData.creator_id !== user.id) {
                setError("Você não está autorizado a gerenciar colaboradores para este projeto.");
                setLoading(false);
                return;
            }
            setProject(projectData);

            if (projectData.collaborators && projectData.collaborators.length > 0) {
                const usersResponse = await axios.get(`http://localhost:3001/users`);
                const detailedCollaborators = usersResponse.data.filter(u => projectData.collaborators.includes(u.id));
                setCollaboratorsDetails(detailedCollaborators);
            } else {
                setCollaboratorsDetails([]);
            }
            setError('');
        } catch (err) {
            setError('Falha ao carregar dados do projeto ou colaboradores.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId, user]); 

    useEffect(() => {
        fetchProjectAndCollaborators();
    }, [fetchProjectAndCollaborators]);

    const fetchSuggestedUsers = async () => { 
        setActionLoading(true); 
        setSuccessMessage(''); setError('');
        try {
            const response = await axios.get(RANDOM_USER_API);
            const suggestions = response.data.results.map(ru => ({
                id: ru.login.uuid,
                name: `${ru.name.first} ${ru.name.last}`,
                email: ru.email,
            }));
            setSuggestedUsers(suggestions);
        } catch (err) {
            setError('Falha ao buscar sugestões da API externa.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddCollaborator = async (suggestedUser) => { 
        if (!project || user.id !== project.creator_id) return;

        setActionLoading(true);
        setSuccessMessage(''); setError('');

        try {
            let internalUserResponse = await axios.get(`http://localhost:3001/users?email=${suggestedUser.email}`);
            let internalUser = internalUserResponse.data[0];
            let newCollaboratorId;

            if (internalUser) {
                newCollaboratorId = internalUser.id;
            } else {
                const newInternalUserData = { name: suggestedUser.name, email: suggestedUser.email, password: "temporaryPassword" };
                const createdUserResponse = await axios.post(`http://localhost:3001/users`, newInternalUserData);
                internalUser = createdUserResponse.data;
                newCollaboratorId = internalUser.id;
                alert(`Usuário Simulado Criado: ${internalUser.name} (ID: ${internalUser.id}). Eles precisariam definir uma senha adequada.`);
            }

            if (project.collaborators.includes(newCollaboratorId)) {
                setError(`${internalUser.name} já é um colaborador.`);
                setActionLoading(false);
                return;
            }

            const updatedCollaborators = [...project.collaborators, newCollaboratorId];
            await updateProject(projectId, { ...project, collaborators: updatedCollaborators });
            
            setProject(prev => ({ ...prev, collaborators: updatedCollaborators }));
            setCollaboratorsDetails(prevDetails => [...prevDetails, internalUser]);
            
            setSuccessMessage(`${internalUser.name} adicionado como colaborador.`); 
        } catch (err) {
            setError(`Falha ao adicionar colaborador: ${err.message}`);
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorIdToRemove) => { 
        if (!project || user.id !== project.creator_id) return;
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
                setCollaboratorsDetails(prevDetails => prevDetails.filter(c => c.id !== collaboratorIdToRemove));
                
                setSuccessMessage('Colaborador removido com sucesso.'); 
            } catch (err) {
                setError(`Falha ao remover colaborador: ${err.message}`);
                console.error(err);
            } finally {
                setActionLoading(false);
            }
        } else {
             setActionLoading(false); 
        }
    };

    if (loading) return <div>Carregando gerenciamento de colaboradores...</div>;
    if (error && error.includes("autorizado")) return <div style={{ color: 'red' }}>{error} <Link to={`/project/${projectId}`}>Voltar ao Projeto</Link></div>;
    if (!project) return <div>Projeto não encontrado ou acesso negado. <Link to="/dashboard">Voltar ao Dashboard</Link></div>;


    return (
        <div className="page-container"> {/* Ou sua classe de container principal */}
            <h2>Gerenciar Colaboradores para: {project?.name}</h2>
            {/* ... mensagens de erro/sucesso e lista de colaboradores atuais ... */}

            <hr />
            <h3>Adicionar Novos Colaboradores</h3>
            <button
                onClick={fetchSuggestedUsers}
                className="btn btn-primario" // <<<<<<< CLASSE ADICIONADA AQUI
                disabled={actionLoading}
                style={{ marginBottom: '15px' }} // Adicionando uma margem inferior para espaçamento
            >
                {actionLoading ? 'Carregando Sugestões...' : 'Buscar Sugestões de Usuários (RandomUser.me)'}
            </button>

            {/* ... lista de usuários sugeridos ... */}

            <div style={{ marginTop: "20px" }}>
                <Link to={`/project/${projectId}`} className="btn btn-link"> {/* Opcional: estilizar o link de voltar também */}
                    Voltar para o Projeto
                </Link>
            </div>
        </div>
    );
}

export default ManageCollaboratorsPage;