// Custom theme configuration for ResearchCollab
// Note: Rizzui uses Tailwind classes directly, so we define utility classes

// Theme-specific utility classes
export const themeClasses = {
  // Academic-style text colors
  text: {
    academic: 'text-gray-800',
    subtitle: 'text-gray-600',
    muted: 'text-gray-500',
    accent: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  },
  
  // Background colors for different states
  background: {
    primary: 'bg-blue-50',
    secondary: 'bg-gray-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
  },
  
  // Border colors
  border: {
    light: 'border-gray-200',
    primary: 'border-blue-300',
    success: 'border-green-300',
    warning: 'border-yellow-300', 
    danger: 'border-red-300',
  },
  
  // Citation-specific styles
  citation: {
    card: 'border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors',
    used: 'border-green-200 bg-green-50',
    title: 'font-medium text-gray-900 line-clamp-2',
    author: 'text-sm text-gray-600',
    preview: 'text-xs text-gray-500 line-clamp-2',
  },
};

// Academic color palette
export const colors = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export default themeClasses;
