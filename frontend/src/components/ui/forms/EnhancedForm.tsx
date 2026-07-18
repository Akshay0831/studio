import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../../lib/utils';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean | string;
  };
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  error?: string;
}

interface FormState {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string;
}

interface EnhancedFormProps {
  fields: FormField[];
  onSubmit: (data: FormState) => void | Promise<void>;
  className?: string;
  submitButtonText?: string;
  resetOnSubmit?: boolean;
  validationMode?: 'onBlur' | 'onChange' | 'onSubmit';
  showValidationSummary?: boolean;
  loading?: boolean;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid';
  width?: 'full' | 'auto';
}

export const EnhancedForm: React.FC<EnhancedFormProps> = ({
  fields,
  onSubmit,
  className,
  submitButtonText = 'Submit',
  resetOnSubmit = true,
  validationMode = 'onBlur',
  showValidationSummary = true,
  loading = false,
  disabled = false,
  layout = 'vertical',
  width = 'full'
}) => {
  const [formData, setFormData] = useState<FormState>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    const initialData: FormState = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || '';
    });
    setFormData(initialData);
  }, [fields]);

  const validateField = useCallback((fieldName: string, value: any): string => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return '';

    // Check required field
    if (field.required && !value && value !== false) {
      return `${field.label} is required`;
    }

    // Check validation rules
    if (field.validation) {
      if (field.validation.pattern && typeof value === 'string') {
        if (!field.validation.pattern.test(value)) {
          return 'Invalid format';
        }
      }

      if (field.validation.minLength && typeof value === 'string') {
        if (value.length < field.validation.minLength) {
          return `Minimum length is ${field.validation.minLength}`;
        }
      }

      if (field.validation.maxLength && typeof value === 'string') {
        if (value.length > field.validation.maxLength) {
          return `Maximum length is ${field.validation.maxLength}`;
        }
      }

      if (field.validation.min && typeof value === 'number') {
        if (value < field.validation.min) {
          return `Minimum value is ${field.validation.min}`;
        }
      }

      if (field.validation.max && typeof value === 'number') {
        if (value > field.validation.max) {
          return `Maximum value is ${field.validation.max}`;
        }
      }

      if (field.validation.custom) {
        const customResult = field.validation.custom(value);
        if (typeof customResult === 'string') {
          return customResult;
        } else if (customResult === false) {
          return 'Invalid value';
        }
      }
    }

    return '';
  }, [fields]);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) {
        errors[field.name] = error;
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  }, [formData, fields, validateField]);

  const handleInputChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Validate based on validation mode
    if (validationMode === 'onChange') {
      const error = validateField(fieldName, value);
      setFormErrors(prev => ({ ...prev, [fieldName]: error }));
    }

    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, [validationMode, validateField]);

  const handleBlur = useCallback((fieldName: string) => {
    if (validationMode === 'onBlur') {
      const error = validateField(fieldName, formData[fieldName]);
      setFormErrors(prev => ({ ...prev, [fieldName]: error }));
      setTouchedFields(prev => new Set([...prev, fieldName]));
    }
  }, [validationMode, validateField, formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form on submit
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form if configured
      if (resetOnSubmit) {
        const resetData: FormState = {};
        fields.forEach(field => {
          resetData[field.name] = field.defaultValue || '';
        });
        setFormData(resetData);
        setFormErrors({});
        setTouchedFields(new Set());
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, resetOnSubmit, fields]);

  const resetForm = useCallback(() => {
    const resetData: FormState = {};
    fields.forEach(field => {
      resetData[field.name] = field.defaultValue || '';
    });
    setFormData(resetData);
    setFormErrors({});
    setTouchedFields(new Set());
  }, [fields]);

  // Layout classes
  const layoutClasses = useMemo(() => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-col space-y-4';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      default:
        return 'space-y-4';
    }
  }, [layout]);

  const widthClasses = useMemo(() => {
    return width === 'full' ? 'w-full' : '';
  }, [width]);

  // Get field error with field-specific error or general validation error
  const getFieldError = (fieldName: string): string => {
    const field = fields.find(f => f.name === fieldName);
    return field?.error || formErrors[fieldName] || '';
  };

  // Get field touched status
  const isFieldTouched = (fieldName: string): boolean => {
    return touchedFields.has(fieldName);
  };

  // Count total errors
  const totalErrors = useMemo(() => {
    return Object.keys(formErrors).length;
  }, [formErrors]);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', widthClasses, className)}>
      {/* Form fields */}
      <div className={layoutClasses}>
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className={cn(
                'block text-sm font-medium',
                getFieldError(field.name) ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-studio-text'
              )}
            >
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.type === 'select' && (
              <select
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                disabled={disabled || isSubmitting}
                className={cn(
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  getFieldError(field.name) 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-studio-border dark:bg-studio-card'
                )}
              >
                <option value="">Select an option</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'textarea' && (
              <textarea
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                disabled={disabled || isSubmitting}
                placeholder={field.placeholder}
                rows={4}
                className={cn(
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  getFieldError(field.name) 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-studio-border dark:bg-studio-card'
                )}
              />
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={field.name}
                  checked={formData[field.name] || false}
                  onChange={(e) => handleInputChange(field.name, e.target.checked)}
                  disabled={disabled || isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={field.name} className="ml-2 text-sm text-gray-700 dark:text-studio-text">
                  {field.label}
                </label>
              </div>
            )}

            {field.type === 'radio' && (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`${field.name}-${option.value}`}
                      name={field.name}
                      value={option.value}
                      checked={formData[field.name] === option.value}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      disabled={disabled || isSubmitting}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={`${field.name}-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-studio-text">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {(field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number') && (
              <input
                type={field.type}
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                disabled={disabled || isSubmitting}
                placeholder={field.placeholder}
                className={cn(
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  getFieldError(field.name) 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-studio-border dark:bg-studio-card'
                )}
              />
            )}

            {/* Field description */}
            {field.description && !isFieldTouched(field.name) && (
              <p className="text-sm text-gray-500 dark:text-studio-muted">
                {field.description}
              </p>
            )}

            {/* Field error */}
            {getFieldError(field.name) && isFieldTouched(field.name) && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {getFieldError(field.name)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Validation summary */}
      {showValidationSummary && totalErrors > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
            Please fix the following {totalErrors} error{totalErrors > 1 ? 's' : ''}:
          </h3>
          <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
            {fields
              .filter(field => getFieldError(field.name))
              .map(field => (
                <li key={field.name} className="list-disc list-inside">
                  {getFieldError(field.name)}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Form actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={resetForm}
          disabled={disabled || isSubmitting}
          className="px-4 py-2 border border-gray-300 dark:border-studio-border rounded-md text-gray-700 dark:text-studio-text bg-white dark:bg-studio-card hover:bg-gray-50 dark:hover:bg-studio-card/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={disabled || isSubmitting || totalErrors > 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};

// Hook for form management
export const useForm = <T extends FormState>(
  initialValues: T,
  validationRules?: { [K in keyof T]?: (value: T[K]) => string | undefined }
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<{ [K in keyof T]?: string }>({});
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());

  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => new Set([...prev, name]));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors: { [K in keyof T]?: string } = {};
    let isValid = true;

    (Object.keys(values) as Array<keyof T>).forEach(key => {
      const rule = validationRules?.[key];
      if (rule) {
        const error = rule(values[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(new Set());
  }, [initialValues]);

  const isDirty = useMemo(() => {
    return (Object.keys(values) as Array<keyof T>).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    clearError,
    validate,
    reset,
    isDirty,
    isValid
  };
};