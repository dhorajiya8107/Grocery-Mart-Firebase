import React, { useState } from 'react';
import { Controller, Control } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps {
  control: Control<any>;
  name: string;
  type: string;
  label: string;
  className?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ 
  control, 
  name, 
  type, 
  label,
  className 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="relative group flex flex-col">
          <div className="relative w-full">
            <Input
              {...field}
              type={type}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "peer h-10 px-3 border-gray-300",
                className,
                error ? "border-red-500" : "",
                "focus-visible:ring-0 focus-visible:border-black"
              )}
            />
            <label 
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none",
                "transition-all duration-300 origin-left z-10",
                isFocused || field.value
                  ? "text-xs -translate-y-full top-0 text-black" 
                  : "text-base -translate-y-1/2",
                "peer-focus:text-xs peer-focus:-translate-y-full peer-focus:top-0 peer-focus:text-black"
              )}
            >
              {label}
            </label>
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-1">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default FloatingLabelInput;