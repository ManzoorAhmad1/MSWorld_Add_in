import { Loader, Folder, ChevronLeft, Home, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Text, Button } from "rizzui";
import TableSkeleton from "./TableSkeleton";

const CitationSearch = ({
  searchResults,
  setSearchResults,
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
  setIsSelectedFolder,
  setFetchPaperLoader,
  // Pagination props
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  handlePageChange,
  handlePreviousPage,
  handleNextPage,
  // Citation insertion
  insertCitation,
  markCitationAsUnused,
  syncCitationsWithDocument,
  isSyncing, // Visual indicator for sync state
}) => {
  console.log(searchResults,'searchResults')
  // State for folder navigation
  const [currentParentId, setCurrentParentId] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]);
  
  // State for bulk selection in search results
  const [selectedSearchResults, setSelectedSearchResults] = useState(new Set());

  // Wrapper function to handle sync with loading state
  const handleSyncCitations = async () => {
    if (!syncCitationsWithDocument || isSyncing) return;

    try {
      await syncCitationsWithDocument();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };  const isCitationInLibrary = (citationId) => {
    return citations.some(
      (citation) => String(citation.id) === String(citationId)
    );
  };

  // Handle search result selection with automatic insertion
  const handleSearchResultSelect = (resultId, checked) => {
    console.log("🎯 handleSearchResultSelect called:", { resultId, checked });
    
    const newSelected = new Set(selectedSearchResults);
    if (checked) {
      newSelected.add(resultId);
      // Insert citation directly - it will add to library and mark as used
      const selectedResult = searchResults.find(r => r.id === resultId);
      if (selectedResult) {
        console.log("📄 Found result to insert:", selectedResult);
        insertCitationToWord(selectedResult);
      } else {
        console.log("❌ Could not find result with ID:", resultId);
      }
    } else {
      newSelected.delete(resultId);
      // Mark citation as unused when unchecked
      console.log("🗑️ Removing citation from document:", resultId);
      removeCitationFromDocument(resultId);
    }
    setSelectedSearchResults(newSelected);
  };

  // Insert citation directly to Word
  const insertCitationToWord = (result) => {
    console.log("💾 insertCitationToWord called with:", result);
    if (insertCitation) {
      console.log("✅ Calling parent insertCitation function");
      insertCitation(result);
    } else {
      console.log("❌ insertCitation function not available");
    }
  };

  // Remove citation from document (mark as unused)
  const removeCitationFromDocument = (resultId) => {
    // Use the markCitationAsUnused function from home.js
    if (markCitationAsUnused) {
      markCitationAsUnused(resultId);
    }
  };

  // Handle select all search results with automatic insertion
  const handleSelectAllSearchResults = (checked) => {
    if (checked) {
      // Select all citations and insert/use them
      const allIds = new Set(searchResults.map(r => r.id));
      setSelectedSearchResults(allIds);
      // Insert all citations that are not already used
      searchResults.forEach(result => {
        const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
        const isUsed = citationInLibrary?.used || false;
        if (!isUsed) {
          insertCitationToWord(result);
        }
      });
    } else {
      // Uncheck all - mark all currently selected or used citations as unused
      searchResults.forEach(result => {
        const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
        const isUsed = citationInLibrary?.used || false;
        const isSelected = selectedSearchResults.has(result.id);
        if (isUsed || isSelected) {
          removeCitationFromDocument(result.id);
        }
      });
      setSelectedSearchResults(new Set());
    }
  };

  // Clear selections when search results change
  useEffect(() => {
    setSelectedSearchResults(new Set());
  }, [searchResults]);

  // Sync selectedSearchResults with citations that are used
  useEffect(() => {
    const usedCitationIds = citations
      .filter(c => c.used)
      .map(c => c.id);
    
    const unusedCitationIds = citations
      .filter(c => !c.used)
      .map(c => c.id);
    
    const currentSearchResultIds = searchResults.map(r => r.id);
    const usedSearchResultIds = usedCitationIds.filter(id => 
      currentSearchResultIds.includes(id)
    );
    const unusedSearchResultIds = unusedCitationIds.filter(id => 
      currentSearchResultIds.includes(id)
    );
    
    setSelectedSearchResults(prev => {
      const newSelected = new Set(prev);
      
      // Add used citations to selected
      usedSearchResultIds.forEach(id => newSelected.add(id));
      
      // Remove unused citations from selected
      unusedSearchResultIds.forEach(id => newSelected.delete(id));
      
      return newSelected;
    });
  }, [citations, searchResults]);

  const getAvailableProjects = () => {
    if (!selectedWorkSpace || !userWorkSpaces?.workspaces) return [];
    const workspace = userWorkSpaces.workspaces.find(
      (ws) => ws.id === selectedWorkSpace
    );
    return workspace?.projects || [];
  };

  const workspaceOptions =
    userWorkSpaces?.workspaces?.map((workspace) => ({
      label: `${workspace.name}${workspace.is_default_workspace ? "" : ""}`,
      value: workspace.id,
    })) || [];

  const projectOptions = getAvailableProjects().map((project) => ({
    label: `${project.name}${project.is_default_project ? "" : ""}`,
    value: project.id,
  }));

  useEffect(() => {
    if (
      userWorkSpaces?.workspaces &&
      userWorkSpaces.workspaces.length > 0 &&
      !selectedWorkSpace
    ) {
      const defaultWorkspace =
        userWorkSpaces.workspaces.find((ws) => ws.is_default_workspace) ||
        userWorkSpaces.workspaces[0];
      setSelectedWorkSpace(defaultWorkspace.id);

      if (defaultWorkspace.projects && defaultWorkspace.projects.length > 0) {
        const defaultProject =
          defaultWorkspace.projects.find((p) => p.is_default_project) ||
          defaultWorkspace.projects[0];
        setSelectedProject(defaultProject.id);
      }
    }
  }, [
    userWorkSpaces,
    selectedWorkSpace,
    setSelectedWorkSpace,
    setSelectedProject,
  ]);

  const handleWorkspaceChange = (workspaceId) => {
    setSelectedWorkSpace(workspaceId);

    const workspace = userWorkSpaces.workspaces.find(
      (ws) => ws.id === workspaceId
    );
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
    const projectFolders = fetchFolder.filter(
      (folder) => folder.project_id === selectedProject
    );

    // If currentParentId is null, show root folders (folders with no parent or parent_id is null)
    if (currentParentId === null) {
      return projectFolders.filter(
        (folder) => !folder.parent_id || folder.parent_id === null
      );
    }

    // Show folders that have the current parent as their parent_id
    return projectFolders.filter(
      (folder) => folder.parent_id === currentParentId
    );
  };

  // Navigate into a folder (show its children)
  const navigateToFolder = async (folder) => {
    // Check if this folder has children in the current project
    const hasChildren = fetchFolder.some(
      (f) => f.parent_id === folder.id && f.project_id === selectedProject
    );

    if (hasChildren) {
      setNavigationPath((prev) => [...prev, folder]);
      setCurrentParentId(folder.id);
    }

    setIsSelectedFolder(folder.id);

    // Note: API call moved to home.js for centralized data management
    // The parent component will handle the data fetching based on isSelectedFolder changes
  };

  // Navigate to root
  const navigateToRoot = () => {
    navigateToFolder({ id: null, folder_name: "Root" });
    setNavigationPath([]);
    setCurrentParentId(null);
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
                <Text className="text-sm text-gray-600">
                  Loading workspaces...
                </Text>
              </div>
            ) : (
              <select
                value={selectedWorkSpace || ""}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a workspace...</option>
                {workspaceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Project Selector */}
          <div className="flex flex-col">
            <Text className="text-sm font-medium text-blue-900 mb-2">
              Select Project:
            </Text>
            <select
              value={selectedProject || ""}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={!selectedWorkSpace || projectOptions.length === 0}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <option value="">Select a project...</option>
              {projectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedWorkSpace && getAvailableProjects().length === 0 && (
              <Text className="text-xs text-gray-500 mt-1">
                No projects available in selected workspace
              </Text>
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
                      navigateToFolder(folder);
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
                const hasChildren = fetchFolder.some(
                  (f) =>
                    f.parent_id === folder.id &&
                    f.project_id === selectedProject
                );

                return (
                  <div
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 bg-white hover:shadow-md
                    ${
                      isSelectedFolder === folder.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                  >
                    <Folder
                      className={`h-5 w-5 ${
                        isSelectedFolder === folder.id
                          ? "text-blue-600"
                          : "text-yellow-500"
                      }`}
                    />
                    <div className="flex min-w-0 justify-between items-center w-full">
                      <Text
                        className={`text-sm font-medium truncate ${
                          isSelectedFolder === folder.id
                            ? "text-blue-900"
                            : "text-gray-700"
                        }`}
                      >
                        {folder.folder_name}
                      </Text>
                      {hasChildren && (
                        <div className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg transform hover:scale-110 transition-transform duration-200">
                          {
                            fetchFolder.filter(
                              (f) =>
                                f.parent_id === folder.id &&
                                f.project_id === selectedProject
                            ).length
                          }
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
        <div className="flex items-center justify-between">
          <Text className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            📄 Papers Results
            {searchResults.length > 0 && (
              <span className="text-sm text-gray-500">({searchResults.length})</span>
            )}
          </Text>
        </div>

        {fetchPaperLoader ? (
          <TableSkeleton rows={5} />
        ) : searchResults.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(() => {
                            // Check if all search results are selected (either in selectedSearchResults or used)
                            const allSelected = searchResults.every(result => {
                              const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
                              const isUsed = citationInLibrary?.used || false;
                              const isSelected = selectedSearchResults.has(result.id);
                              return isSelected || isUsed;
                            });
                            return searchResults.length > 0 && allSelected;
                          })()}
                          ref={(el) => {
                            if (el) {
                              // Set indeterminate if some but not all are selected
                              const someSelected = searchResults.some(result => {
                                const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
                                const isUsed = citationInLibrary?.used || false;
                                const isSelected = selectedSearchResults.has(result.id);
                                return isSelected || isUsed;
                              });
                              const allSelected = searchResults.every(result => {
                                const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
                                const isUsed = citationInLibrary?.used || false;
                                const isSelected = selectedSearchResults.has(result.id);
                                return isSelected || isUsed;
                              });
                              el.indeterminate = someSelected && !allSelected;
                            }
                          }}
                          onChange={(e) => handleSelectAllSearchResults(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={searchResults.length === 0 || isSyncing}
                        />
                        {isSyncing && (
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title & Authors
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journal & Year
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="">
                  {searchResults.map((result, index) => {
                    const citationInLibrary = citations.find(c => String(c.id) === String(result.id));
                    const isInLibrary = !!citationInLibrary;
                    const isUsed = citationInLibrary?.used || false;
                    const isSelected = selectedSearchResults.has(result.id);
                    
                    // Determine checkbox state - allow unchecking even if used
                    const checkboxChecked = isSelected || isUsed;
                    const checkboxDisabled = false; // Never disable checkbox - allow unchecking
                    
                    return (
                      <React.Fragment key={result.id || index}>
                        <tr className="transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkboxChecked}
                                onChange={(e) => handleSearchResultSelect(result.id, e.target.checked)}
                                disabled={checkboxDisabled || isSyncing}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                              />
                              {isSyncing && (
                                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <Text className="font-semibold text-gray-900 text-sm leading-tight">
                                {getCitationTitle(result)}
                              </Text>
                              <Text className="text-xs text-gray-600 mb-2">
                                <strong>Authors:</strong> {result?.authors}
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
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                                {result.CitationCount || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modern Pagination Design */}
            {searchResults.length > 0 && totalResults > 10 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                {/* Center - Results info */}
                <div className="text-sm text-gray-600">
                  {(currentPage - 1) * (pageSize || 10) + 1}-
                  {Math.min(currentPage * (pageSize || 10), totalResults)} of{" "}
                  {totalResults}
                </div>

                {/* Right side - Navigation */}
                <div className="flex items-center gap-1">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    size="sm"
                    className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 border border-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page numbers with smart pagination */}
                  {totalPages > 1 &&
                    (() => {
                      const pages = [];
                      const maxVisiblePages = 7; // Maximum pages to show

                      if (totalPages <= maxVisiblePages) {
                        // Show all pages if total is small
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Smart pagination for many pages
                        if (currentPage <= 4) {
                          // Near beginning: 1 2 3 4 5 ... Last
                          for (let i = 1; i <= 5; i++) {
                            pages.push(i);
                          }
                          pages.push("...");
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 3) {
                          // Near end: 1 ... 46 47 48 49 50
                          pages.push(1);
                          pages.push("...");
                          for (let i = totalPages - 4; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Middle: 1 ... 23 24 25 ... 50
                          pages.push(1);
                          pages.push("...");
                          for (
                            let i = currentPage - 1;
                            i <= currentPage + 1;
                            i++
                          ) {
                            pages.push(i);
                          }
                          pages.push("...");
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((page, index) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 py-1 text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            size="sm"
                            className={`min-w-[32px] h-8 text-sm border ${
                              page === currentPage
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      });
                    })()}

                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    size="sm"
                    className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 border border-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
