import axios from 'axios';

// Small wrapper around backend endpoints used by the React UI.
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Send a credit application payload to the backend prediction endpoint.
 * Returns the structured prediction response used by the frontend.
 */
export const predictLoan = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/predict`, formData);
  return response.data;
};

/**
 * Fetch a next candidate application id from the backend. The backend
 * derives this by finding the maximum numeric application id.
 */
export const getLatestId = async () => {
  const response = await axios.get(`${API_BASE_URL}/latest-id`);
  return response.data;
};
