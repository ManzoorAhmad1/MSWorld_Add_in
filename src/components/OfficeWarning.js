import React from 'react';

const OfficeWarning = () => (
  <div className="w-full bg-rose-50 border-l-4 border-rose-400 text-rose-900 p-4 rounded-lg shadow mt-4">
    <div className="flex flex-col gap-1">
      <h4 className="font-bold text-lg flex items-center gap-2">⚠️ Microsoft Word Required</h4>
      <p>This add-in is designed to work within Microsoft Word. Please install and run it from Word to access all features.</p>
      <p className="text-sm">Currently running in demo mode with limited functionality.</p>
    </div>
  </div>
);

export default OfficeWarning;
