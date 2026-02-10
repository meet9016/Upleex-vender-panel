// components/ui/Input.tsx
"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";

type InputVariant = "default" | "error" | "success" | "warning";
type InputSize ="xs" | "sm" | "md" | "lg";

interface BaseInputProps {
    // Label & Helper Text
    label?: string;
    helperText?: string;
    error?: boolean;
    errorMessage?: string;

    // Styling
    variant?: InputVariant;
    size?: InputSize;
    fullWidth?: boolean;

    // Icons
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;

    // States
    isLoading?: boolean;
    isValid?: boolean;

    // Special Types
    isSearch?: boolean;
    showPasswordToggle?: boolean;
    multiline?: boolean;
    rows?: number;

    // Number Input
    onlyNumbers?: boolean;
    preventNegative?: boolean;

    // Accessibility
    ariaLabel?: string;
}

interface SingleLineInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    multiline?: false;
}

interface MultiLineInputProps extends BaseInputProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    multiline: true;
}

type CommonInputProps = SingleLineInputProps | MultiLineInputProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CommonInputProps>(
    (props, ref) => {
        const {
            // Label & Helper
            label,
            helperText,
            error = false,
            errorMessage,

            // Styling
            variant = "default",
            size = "md",
            fullWidth = true,

            // Icons
            leftIcon,
            rightIcon,
            onRightIconClick,

            // States
            isLoading = false,
            isValid = false,
            disabled,

            // Special
            isSearch = false,
            showPasswordToggle = false,
            multiline = false,
            rows = 4,

            // Number
            onlyNumbers = false,
            preventNegative = false,

            // Accessibility
            ariaLabel,

            // Standard props
            className = "",
            id,
            value,
            onChange,
            ...restProps
        } = props;

        const [showPassword, setShowPassword] = useState(false);
        const [internalValue, setInternalValue] = useState(value || "");
        const inputType =
            !multiline && "type" in props
                ? props.type ?? "text"
                : undefined;

        // Generate ID from label if not provided
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        // Determine actual type
        const actualType =
            showPasswordToggle && inputType === "password"
                ? showPassword
                    ? "text"
                    : "password"
                : inputType;


        // Base styles
        const baseStyles =
            "border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed bg-white";

        // Variant styles
        const variantStyles = {
            default: error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
            error: "border-red-500 focus:border-red-500 focus:ring-red-500",
            success: "border-green-500 focus:border-green-500 focus:ring-green-500",
            warning: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500",
        };

        // Size styles
        const sizeStyles = {
            xs: "px-2 py-1 text-xs",
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-sm",
            lg: "px-4 py-3 text-base",
        };

        // Icon padding
        const getIconPadding = () => {
            if (!leftIcon && !rightIcon && !isSearch && !showPasswordToggle && !isLoading) return "";

            let padding = "";
            if (leftIcon || isSearch) padding += " pl-10";
            if (rightIcon || showPasswordToggle || isLoading || (isSearch && internalValue)) padding += " pr-10";
            return padding;
        };

        // Width class
        const widthClass = fullWidth ? "w-full" : "";

        // Handle number input
        const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            let val = e.target.value;

            if (onlyNumbers) {
                val = val.replace(/[^0-9]/g, "");
            }

            if (preventNegative && parseFloat(val) < 0) {
                val = "0";
            }

            e.target.value = val;
            if (onChange) {
                onChange(e as any);
            }
        };

        // Handle search clear
        const handleClear = () => {
            setInternalValue("");
            if (onChange) {
                const syntheticEvent = {
                    target: { value: "" },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent as any);
            }
        };

        // Handle internal value change
        const handleChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
            setInternalValue(e.target.value);

            if (inputType === "number" && (onlyNumbers || preventNegative)) {
                handleNumberInput(e as React.ChangeEvent<HTMLInputElement>);
            } else if (onChange) {
                onChange(e as any);
            }
        };

        // Determine which icons to show
        const hasLeftIcon = leftIcon || isSearch;
        const hasRightIcon = rightIcon || showPasswordToggle || isLoading || (isSearch && internalValue);

        const inputClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${getIconPadding()} ${widthClass} ${className}`;

        return (
            <div className={fullWidth ? "w-full" : ""}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        {label}
                        {restProps.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {/* Left Icon */}
                    {hasLeftIcon && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                            {isSearch ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            ) : leftIcon}
                        </div>
                    )}

                    {/* Input or Textarea */}
                    {multiline ? (
                        <textarea
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            id={inputId}
                            rows={rows}
                            value={value}
                            onChange={handleChange}
                            disabled={disabled || isLoading}
                            aria-label={ariaLabel}
                            aria-invalid={error || variant === "error"}
                            className={inputClasses}
                            {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                            style={{ height: "42px" }}
                            
                        />
                    ) : (
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            id={inputId}
                            type={actualType}
                            value={value}
                            onChange={handleChange}
                            disabled={disabled || isLoading}
                            aria-label={ariaLabel}
                            aria-invalid={error || variant === "error"}
                            className={inputClasses}
                            {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
                            style={{ height: "42px" }}
                        />
                    )}

                    {/* Right Icons */}
                    {hasRightIcon && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            {/* Loading Spinner */}
                            {isLoading && (
                                <svg
                                    className="animate-spin h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            )}

                            {/* Search Clear Button */}
                            {isSearch && internalValue && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    aria-label="Clear search"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Password Toggle */}
                            {showPasswordToggle && !isLoading && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Custom Right Icon */}
                            {rightIcon && !isLoading && (
                                <button
                                    type="button"
                                    onClick={onRightIconClick}
                                    className={`text-gray-400 ${onRightIconClick ? 'hover:text-gray-600 cursor-pointer' : 'pointer-events-none'} focus:outline-none`}
                                    disabled={!onRightIconClick}
                                >
                                    {rightIcon}
                                </button>
                            )}

                            {/* Valid Checkmark */}
                            {isValid && !isLoading && (
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {(error || variant === "error") && errorMessage && (
                    <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
                )}

                {/* Helper Text */}
                {helperText && !error && variant !== "error" && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
