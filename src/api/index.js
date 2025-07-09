// Example API usage
import { publicRequest, privateRequest } from '../utils/request';

// Example: Get public data
export const signin = async (body) => {
  const response = await publicRequest.post('/api/v1/users/signin',body);
  return response.data;
};

// Example: Get private data
export const fetchUserFilesDocs = async () => {
  const response = await privateRequest.get('/api/v1/files/user/files');
  return response.data;
};
