'use client';

import React from 'react'
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';


  const AddressTypeButton = ({
      type,
      icon: Icon,
      label,
      selected,
      onClick,
    }: {
      type: "home" | "work" | "hotel" | "other"
      icon: React.ElementType
      label: string
      selected: boolean
      onClick: () => void
    }) => (
      <Button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center justify-center gap-2 p-2 rounded-lg transition-all h-auto",
          "border border-gray-200 hover:border-primary/10",
          "text-sm font-medium bg-white hover:bg-primary/10",
          selected ? "bg-primary/10 border-primary/10 text-primary" : "text-gray-600",
        )}
      >
        <Icon size={18} className={selected ? "text-green-700" : "text-green-700"} />
        {label}
      </Button>
    )

export default AddressTypeButton;