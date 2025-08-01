import { Loader, Folder, ChevronLeft, Home } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Select, Text, Button } from "rizzui";

const CitationSearch = ({
  searchResults,
  addCitationToLibrary,
  getCitationTitle,
  getCitationAuthors,
  citations, 
  fetchPaperLoader,
  userWorkSpaces,
  isWorkSpaceLoading,
  setSelectedProject,
  selectedProject,
  setSelectedWorkSpace,
  selectedWorkSpace,
  isFolderLoading,
  fetchFolder,
  isSelectedFolder,
  setIsSelectedFolder
}) => {
  
  // State for folder navigation
  const [currentParentId, setCurrentParentId] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]);
  
  const isCitationInLibrary = (citationId) => {
    return citations.some(citation => String(citation.id) === String(citationId));
  };

  const getAvailableProjects = () => {
    if (!selectedWorkSpace || !userWorkSpaces?.workspaces) return [];
    const workspace = userWorkSpaces.workspaces.find(ws => ws.id === selectedWorkSpace);
    return workspace?.projects || [];
  };

  const workspaceOptions = userWorkSpaces?.workspaces?.map(workspace => ({
    label: `${workspace.name}${workspace.is_default_workspace ? '' : ''}`,
    value: workspace.id
  })) || [];

  const projectOptions = getAvailableProjects().map(project => ({
    label: `${project.name}${project.is_default_project ? '' : ''}`,
    value: project.id
  }));

  useEffect(() => {
    if (userWorkSpaces?.workspaces && userWorkSpaces.workspaces.length > 0 && !selectedWorkSpace) {
      const defaultWorkspace = userWorkSpaces.workspaces.find(ws => ws.is_default_workspace) || userWorkSpaces.workspaces[0];
      setSelectedWorkSpace(defaultWorkspace.id);
      
      if (defaultWorkspace.projects && defaultWorkspace.projects.length > 0) {
        const defaultProject = defaultWorkspace.projects.find(p => p.is_default_project) || defaultWorkspace.projects[0];
        setSelectedProject(defaultProject.id);
      }
    }
  }, [userWorkSpaces, selectedWorkSpace, setSelectedWorkSpace, setSelectedProject]);

  const handleWorkspaceChange = (workspaceId) => {
    setSelectedWorkSpace(workspaceId);
    
    const workspace = userWorkSpaces.workspaces.find(ws => ws.id === workspaceId);
    if (workspace?.projects && workspace.projects.length > 0) {
      const firstProject = workspace.projects[0];
      setSelectedProject(firstProject.id);
    } else {
      setSelectedProject(null);
    }
  };

  // Handle project change
  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    // Reset folder navigation when project changes
    setCurrentParentId(null);
    setNavigationPath([]);
    setIsSelectedFolder(null);
  };

  // Handle folder selection
  const handleFolderSelection = (folderId) => {
    setIsSelectedFolder(folderId);
  };

  // Get folders to display based on current parent and selected project
  const getFoldersToDisplay = () => {
    if (!fetchFolder || fetchFolder.length === 0 || !selectedProject) return [];
    
    // First filter by selected project
    const projectFolders = fetchFolder.filter(folder => folder.project_id === selectedProject);
    
    // If currentParentId is null, show root folders (folders with no parent or parent_id is null)
    if (currentParentId === null) {
      return projectFolders.filter(folder => !folder.parent_id || folder.parent_id === null);
    }
    
    // Show folders that have the current parent as their parent_id
    return projectFolders.filter(folder => folder.parent_id === currentParentId);
  };

  // Navigate into a folder (show its children)
  const navigateToFolder = (folder) => {
    // Check if this folder has children in the current project
    const hasChildren = fetchFolder.some(f => 
      f.parent_id === folder.id && 
      f.project_id === selectedProject
    );
    
    if (hasChildren) {
      // Add current folder to navigation path
      setNavigationPath(prev => [...prev, folder]);
      setCurrentParentId(folder.id);
    }
    
    // Always select the folder regardless of whether it has children
    setIsSelectedFolder(folder.id);
  };

  // Navigate back to parent folder
  const navigateBack = () => {
    if (navigationPath.length > 0) {
      const newPath = [...navigationPath];
      newPath.pop(); // Remove the last folder
      setNavigationPath(newPath);
      
      // Set current parent to the previous folder in path, or null if at root
      if (newPath.length > 0) {
        setCurrentParentId(newPath[newPath.length - 1].id);
      } else {
        setCurrentParentId(null);
      }
    }
  };

  // Navigate to root
  const navigateToRoot = () => {
    setNavigationPath([]);
    setCurrentParentId(null);
  };

  // Get current folder name for breadcrumb
  const getCurrentFolderName = () => {
    if (navigationPath.length === 0) return "Root";
    return navigationPath[navigationPath.length - 1].folder_name;
  };

  return (
    <>
    <div className="bg-blue-50 rounded-lg p-4 shadow mb-6">
      <Text className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        🗂️ Workspace & Project Selection
      </Text>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workspace Selector */}
        <div className="flex flex-col">
          <Text className="text-sm font-medium text-blue-900 mb-2">
            Select Workspace:
          </Text>
          {isWorkSpaceLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg bg-white">
              <Loader className="h-4 w-4 animate-spin text-blue-600" />
              <Text className="text-sm text-gray-600">Loading workspaces...</Text>
            </div>
          ) : (
            <Select
              placeholder="Select a workspace..."
              options={workspaceOptions}
              value={workspaceOptions.find(option => option.value === selectedWorkSpace)}
              onChange={(selectedOption) => handleWorkspaceChange(selectedOption?.value)}
              className="w-full bg-white border border-blue-200 rounded-lg"
              dropdownClassName="bg-white border border-gray-200 shadow-lg rounded-lg"
            />
          )}
        </div>

        {/* Project Selector */}
        <div className="flex flex-col">
          <Text className="text-sm font-medium text-blue-900 mb-2">
            Select Project:
          </Text>
          <Select
            placeholder="Select a project..."
            options={projectOptions}
            value={projectOptions.find(option => option.value === selectedProject)}
            onChange={(selectedOption) => handleProjectChange(selectedOption?.value)}
            disabled={!selectedWorkSpace || projectOptions.length === 0}
            className="w-full bg-white border border-blue-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            dropdownClassName="bg-white border border-gray-200 shadow-lg rounded-lg"
          />
          {selectedWorkSpace && getAvailableProjects().length === 0 && (
            <Text className="text-xs text-gray-500 mt-1">No projects available in selected workspace</Text>
          )}
        </div>
      </div>
    </div>

    {/* Folder Selection Box */}
    <div className="bg-gray-50 rounded-lg p-4 shadow mb-6">
      <Text className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        📁 Folder Selection
      </Text>
      
      {isFolderLoading ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
          <Loader className="h-4 w-4 animate-spin text-blue-600" />
          <Text className="text-sm text-gray-600">Loading folders...</Text>
        </div>
      ) : fetchFolder && fetchFolder.length > 0 ? (
        <div className="space-y-4">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={navigateToRoot}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <Text className="text-sm">Root</Text>
            </button>
            
            {navigationPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <Text className="text-gray-400">/</Text>
                <button
                  onClick={() => {
                    // Navigate to this specific folder in the path
                    const newPath = navigationPath.slice(0, index + 1);
                    setNavigationPath(newPath);
                    setCurrentParentId(folder.id);
                  }}
                  className="hover:text-blue-600 transition-colors"
                >
                  <Text className="text-sm">{folder.folder_name}</Text>
                </button>
              </React.Fragment>
            ))}
          </div>       

          {/* Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getFoldersToDisplay().map((folder) => {
              const hasChildren = fetchFolder.some(f => 
                f.parent_id === folder.id && 
                f.project_id === selectedProject
              );
              
              return (
                <div
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 bg-white hover:shadow-md
                    ${isSelectedFolder === folder.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Folder 
                    className={`h-5 w-5 ${
                      isSelectedFolder === folder.id ? 'text-blue-600' : 'text-yellow-500'
                    }`} 
                  />
                  <div className="flex min-w-0 justify-between items-center w-full">
                    <Text className={`text-sm font-medium truncate ${
                      isSelectedFolder === folder.id ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {folder.folder_name}
                    </Text>
                    {hasChildren && (
                      <div className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg transform hover:scale-110 transition-transform duration-200">
                        {fetchFolder.filter(f => 
                          f.parent_id === folder.id && 
                          f.project_id === selectedProject
                        ).length}
                      </div>
                    )}
                  </div>
                  {hasChildren && (
                    <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {getFoldersToDisplay().length === 0 && (
            <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-gray-200">
              <Text className="text-gray-500">No folders found</Text>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Text className="text-gray-500">No folders available</Text>
        </div>
      )}
    </div>

    <div className="space-y-6">
      <Text className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        📄 Papers Results
      </Text>
      
      {fetchPaperLoader ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-blue-600" />
              <Text className="text-sm text-gray-600">Loading citations...</Text>
            </div>
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Authors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journal & Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResults.map((result, index) => (
                  <tr key={result.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <Text className="font-semibold text-gray-900 text-sm leading-tight">
                          {getCitationTitle(result)}
                        </Text>
                        <Text className="text-xs text-gray-600">
                          <strong>Authors:</strong> {getCitationAuthors(result)}
                        </Text>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {result["container-title"] && (
                          <Text className="text-sm text-gray-900">
                            {result["container-title"]}
                          </Text>
                        )}
                        {result.issued?.["date-parts"]?.[0]?.[0] && (
                          <Text className="text-xs text-gray-600">
                            Year: {result.issued["date-parts"][0][0]}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Text className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium inline-block">
                        {result.source || "database"}
                      </Text>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isCitationInLibrary(result.id) ? (
                        <Button
                          disabled
                          size="sm"
                          className="bg-green-100 text-green-800 cursor-not-allowed text-xs px-3 py-1"
                        >
                          ✅ Added
                        </Button>
                      ) : (
                        <Button
                          onClick={() => addCitationToLibrary(result)}
                          size="sm"
                          className="bg-blue-500 border-white whitespace-nowrap text-white text-xs px-3 py-1"
                        >
                        Add to Library
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
          <Text className="text-gray-500">No paper found</Text>
        </div>
      )}
    </div>
    </>
  );
};

export default CitationSearch;
