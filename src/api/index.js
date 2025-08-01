// Example API usage
import { publicRequest, privateRequest } from '../utils/request';

// Example: Get public data
export const signin = async (body) => {
  const response = await publicRequest.post('/api/v1/users/signin',body);
  return response.data;
};

// Example: Get private data
export const fetchUserFilesDocs = async (projectId) => {
  const response = await privateRequest.get(`/api/v1/files/files-by-project/${projectId}`);
  return response.data;
};
export const getWorkspaces = async () => {
  const response = await privateRequest.get('/api/v1/workspace/get-workspaces');
  return response.data;
};
export const getFolder = async () => {
  const response = await privateRequest.get('/api/v1/folders/user/folders');
  return response.data;
};


export const getFolders = async (data) => {
  const response = await axiosInstancePrivate.get(
    `/files/user-files/${data?.projectId}?pageNo=${
      data?.pageNo ? (data?.pageNo === -1 ? 1 : data?.pageNo) : ""
    }&limit=${data?.limit ? data?.limit : ""}&search=${
      data?.search ? encodeURIComponent(data?.search.toString()) : ""
    }&orderBy=${data?.orderBy ? data?.orderBy : ""}&orderDirection=${
      data?.orderDirection ? data?.orderDirection : ""
    }&filters=${
      data?.allFilters && data?.allFilters?.length > 0
        ? JSON.stringify(
            data?.allFilters?.map((filter) => ({
              name: filter?.name,
              filters: filter?.selectedFilters,
            }))
          )
        : ""
    }&folderId=${data?.folderId ? data?.folderId : ""}`
  );
  return response;
};