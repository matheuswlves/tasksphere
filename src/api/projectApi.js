import axios from 'axios';
const API_URL = 'http://localhost:3001';

export const getProjects = async () => {
    const response = await axios.get(`${API_URL}/projects`);
    return response.data;
};

export const getProjectById = async (id) => {
    const response = await axios.get(`${API_URL}/projects/${id}?_embed=tasks`);
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await axios.post(`${API_URL}/projects`, projectData);
    return response.data;
};

export const deleteProject = async (projectId) => {
    const response = await axios.delete(`${API_URL}/projects/${projectId}`);
    return response.data; 
};

export const updateProject = async (projectId, projectData) => {
    const response = await axios.put(`${API_URL}/projects/${projectId}`, projectData);
    return response.data;
};