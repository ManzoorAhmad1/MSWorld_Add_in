import React from "react";

const TableSkeleton = ({ rows = 5 }) => {
  return (
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
                Citations
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(rows)].map((_, index) => (
              <tr key={index} className="animate-pulse">
                {/* Title & Authors Column */}
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </td>
                
                {/* Journal & Year Column */}
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </td>
                
                {/* Source Column */}
                <td className="px-4 py-4">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </td>
                
                {/* Citations Column */}
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 bg-gray-200 rounded w-8"></div>
                  </div>
                </td>
                
                {/* Action Column */}
                <td className="px-4 py-4 text-center">
                  <div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
