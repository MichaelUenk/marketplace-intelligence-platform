import React, { forwardRef, useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      label,
      error,
      helperText,
      disabled,
      className = '',
      id,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const selectedOption = options.find((opt) => opt.value === value);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = options[highlightedIndex];
            if (!option.disabled) {
              onChange?.(option.value);
              setIsOpen(false);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : options.length - 1
            );
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    const handleOptionClick = (option: SelectOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
    };

    return (
      <div className="select-wrapper" ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <button
          ref={ref}
          type="button"
          id={selectId}
          className={`select ${error ? 'select-error' : ''} ${isOpen ? 'select-open' : ''} ${className}`.trim()}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label` : undefined}
        >
          <span className={`select-value ${!selectedOption ? 'select-placeholder' : ''}`}>
            {selectedOption?.label || placeholder}
          </span>
          <span className="select-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            className="select-options"
            role="listbox"
            aria-labelledby={selectId}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                className={`select-option ${
                  option.value === value ? 'select-option-selected' : ''
                } ${highlightedIndex === index ? 'select-option-highlighted' : ''} ${
                  option.disabled ? 'select-option-disabled' : ''
                }`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
              >
                {option.label}
                {option.value === value && (
                  <span className="select-check">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {(error || helperText) && (
          <p className={`helper-text ${error ? 'error-text' : ''}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
