import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder = 'Select an option', className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col w-full">
        <label className="mb-1.5 text-sm font-medium text-gray-700">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border appearance-none ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } rounded-lg outline-none transition-all focus:ring-2 ${className}`}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="mt-1 text-sm text-red-600">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
