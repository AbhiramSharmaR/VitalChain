import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Assuming standard FastAPI port

export const getVitals = async (userId: string) => {
  const response = await axios.get(`${API_URL}/vitals/${userId}`);
  return response.data;
};

export const streamVitals = async (userId: string, vitals: any) => {
  const response = await axios.post(`${API_URL}/vitals/stream?user_id=${userId}`, vitals);
  return response.data;
};

export const getMapData = async (emergencyId: string) => {
  const response = await axios.get(`${API_URL}/map/${emergencyId}`);
  return response.data;
};

export const getLatency = async (userId: string) => {
  const response = await axios.get(`${API_URL}/vitals/${userId}/latency`);
  return response.data;
};

export const getChatbotResponse = async (userId: string, message: string) => {
  const response = await axios.post(`${API_URL}/chatbot/`, { user_id: userId, message });
  return response.data;
};
