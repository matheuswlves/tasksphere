import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjects } from '../api/projectApi';

function DashboardPage() {
    const [allUserProjects, setAllUserProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth(); 

    const [projectSearchTerm, setProjectSearchTerm] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const allProjectsFromApi = await getProjects();
                let projectsToDisplay;

                if (user.role === 'admin') {
                    projectsToDisplay = allProjectsFromApi; 
                } else {
                    projectsToDisplay = allProjectsFromApi.filter(p =>
                        p.creator_id === user.id || (p.collaborators && p.collaborators.includes(user.id))
                    );
                }
                setAllUserProjects(projectsToDisplay);
                setError('');
            } catch (err) {
                setError('Falha ao buscar projetos.');
                console.error("Erro no Dashboard ao buscar projetos:", err);
                setAllUserProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [user]); 

    const displayedProjects = useMemo(() => {
        if (!projectSearchTerm) {
            return allUserProjects;
        }
        return allUserProjects.filter(project =>
            project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
        );
    }, [allUserProjects, projectSearchTerm]);

    if (loading) return <div className="page-container" style={{textAlign: 'center'}}>Carregando projetos...</div>;
    if (error) return <div className="page-container" style={{ color: 'red', textAlign: 'center' }}>{error}</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Dashboard</h2>
                <Link to="/project/new" className="btn btn-primario">
                    Criar Novo Projeto
                </Link>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Buscar projetos por nome..."
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                />
            </div>

            <h3>{user?.role === 'admin' ? 'Todos os Projetos (Admin View)' : 'Seus Projetos:'}</h3>
            {displayedProjects.length === 0 ? (
                <p>{projectSearchTerm ? 'Nenhum projeto encontrado com esse nome.' : (user?.role === 'admin' ? 'Nenhum projeto cadastrado no sistema.' : 'Nenhum projeto para você. Crie um!')}</p>
            ) : (
                <div className="projects-list-container">
                    {displayedProjects.map(project => (
                        <div key={project.id} className="card">
                            <h4 className="card-titulo">
                                <Link to={`/project/${project.id}`}>{project.name}</Link>
                            </h4>
                            <p className="card-descricao">
                                {project.description ? project.description.substring(0, 150) + (project.description.length > 150 ? '...' : '') : 'Sem descrição.'}
                            </p>
                            <p className="card-datas">
                                Início: {new Date(project.start_date).toLocaleDateString()} - Fim: {new Date(project.end_date).toLocaleDateString()}
                            </p>
                            <div className="card-acoes">
                                <Link to={`/project/${project.id}`} className="btn btn-link">
                                    Ver Detalhes
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardPage;