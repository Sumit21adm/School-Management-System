/**
 * Centralized Form Styling Configuration
 * All form inputs, labels, and buttons should use these consistent styles
 */

export const formStyles = {
  // Input field styles
  input: {
    base: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400",
    disabled: "disabled:bg-gray-100 disabled:text-gray-500",
    error: "border-red-500 focus:ring-red-500",
  },

  // Select dropdown styles
  select: {
    base: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white",
    disabled: "disabled:bg-gray-100 disabled:text-gray-500",
  },

  // Textarea styles
  textarea: {
    base: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 resize-none",
    disabled: "disabled:bg-gray-100 disabled:text-gray-500",
  },

  // Label styles
  label: {
    base: "block text-sm font-medium text-gray-900 mb-2",
    required: "text-red-500",
    optional: "text-gray-500 font-normal",
  },

  // Button styles
  button: {
    primary: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed",
    secondary: "inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition",
    success: "inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400",
    danger: "inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400",
  },

  // Section headers
  header: {
    title: "text-xl font-semibold text-gray-900 mb-2",
    subtitle: "text-sm text-gray-600",
  },

  // Form sections
  section: {
    container: "p-6 border-b border-gray-200",
    title: "text-xl font-semibold text-gray-900",
  },
};

// Helper function to combine classes
export const combineClasses = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Full class names for common patterns
export const getInputClass = (disabled?: boolean, error?: boolean) => {
  return combineClasses(
    formStyles.input.base,
    disabled && formStyles.input.disabled,
    error && formStyles.input.error
  );
};

export const getSelectClass = (disabled?: boolean) => {
  return combineClasses(
    formStyles.select.base,
    disabled && formStyles.select.disabled
  );
};

export const getTextareaClass = (disabled?: boolean) => {
  return combineClasses(
    formStyles.textarea.base,
    disabled && formStyles.textarea.disabled
  );
};
