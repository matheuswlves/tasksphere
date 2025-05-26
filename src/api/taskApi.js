import axios from 'axios';

const API_URL = 'https://my-json-server.typicode.com/matheuswlves/tasksphere';

export const getTasksByProjectId = async (projectId) => {
    const response = await axios.get(`${API_URL}/tasks?project_id=${projectId}`);
    return response.data;
};

export const getTaskById = async (taskId) => {
    const response = await axios.get(`${API_URL}/tasks/${taskId}`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await axios.post(`${API_URL}/tasks`, taskData);
    return response.data;
};

export const updateTask = async (taskId, taskData) => {
    const response = await axios.put(`${API_URL}/tasks/${taskId}`, taskData);
    return response.data;
};

export const deleteTask = async (taskId) => {
    await axios.delete(`${API_URL}/tasks/${taskId}`);
};