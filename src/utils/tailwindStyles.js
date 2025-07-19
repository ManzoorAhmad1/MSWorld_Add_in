// Utility classes for common UI patterns
export const buttonStyles = {
  primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-primary",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-lg px-4 py-2 text-sm font-medium transition-all",
  success: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-success",
  danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-danger",
  disabled: "bg-gray-300 text-gray-500 cursor-not-allowed py-2 px-4 rounded-lg"
};

export const cardStyles = {
  base: "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow",
  elevated: "bg-white rounded-xl shadow-soft",
  interactive: "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
};

export const inputStyles = {
  base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all",
  withIcon: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all",
  error: "w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
};

export const statusStyles = {
  connected: "flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg",
  disconnected: "flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg",
  loading: "flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
};

export const textStyles = {
  title: "text-2xl font-bold text-gray-900",
  subtitle: "text-lg font-semibold text-gray-700",
  body: "text-base text-gray-600",
  caption: "text-sm text-gray-500"
};
