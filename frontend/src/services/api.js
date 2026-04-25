import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const predictLoan = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/predict`, formData);
  return response.data;
};

export const getLatestId = async () => {
  const response = await axios.get(`${API_BASE_URL}/latest-id`);
  return response.data;
};
