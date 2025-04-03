import React from 'react';
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import { Input } from '../ui/input';
import { Control, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface TextInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  type?: string;
  placeHolder?: string;
  readonly?: boolean;
  className?: string;                     
  id?: string;
  value?: string;
}

const TextInput = <T extends FieldValues>({
  control,
  name,
  label,
  type,
  placeHolder,
  className,
  id,
  value,
  readonly = false
}: TextInputProps<T>) => {
  return (
    <FormField
      control={control as Control<FieldValues>}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={label ? placeHolder || `Enter ${label}` : ''}
              {...field}
              value={field.value ?? ''}
              className={cn('w-full border border-gray-300 rounded-[6px] px-4 py-2 text-sm focus:outline-none focus:ring-2 ', className)}
              readOnly={readonly}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TextInput;
