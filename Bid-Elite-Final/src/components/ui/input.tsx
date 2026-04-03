import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-dim transition-colors focus:outline-none focus:ring-1 ${
            error
              ? "border-error/50 focus:border-error focus:ring-error"
              : "border-border focus:border-accent focus:ring-accent"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-text-dim">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
