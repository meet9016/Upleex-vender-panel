// Utility for consistent error message styling
import React from 'react';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <p className={`error-message ${className}`}>
      {message}
    </p>
  );
};

// Hook for managing form errors
export const useFormErrors = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasError = (field: string) => !!errors[field];

  const getError = (field: string) => errors[field];

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasError,
    getError,
    setErrors
  };
};

export default ErrorMessage;