import React from 'react';

/**
 * App Provider wrapper component
 * This component wraps the entire app with necessary providers
 * Note: RizzUI doesn't require a provider, components work standalone
 */
export const AppProviders = ({ children }) => {
  return (
    <div className="rizzui-app">
      {children}
    </div>
  );
};

export default AppProviders;
