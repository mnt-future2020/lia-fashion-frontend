"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[80px] h-[36px] border-2",
            className
          )}
          style={{ 
            backgroundColor: color,
            borderColor: color === "#FFFFFF" ? "#e2e8f0" : color // Add border for white color
          }}
        >
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <HexColorPicker color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
} 