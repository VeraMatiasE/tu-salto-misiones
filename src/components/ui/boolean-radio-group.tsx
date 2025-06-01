'use client'

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormItem, FormControl, FormLabel } from "@/components/ui/form"

interface BooleanRadioGroupProps {
  value?: boolean
  onValueChange?: (value: boolean) => void
  trueLabel?: string
  falseLabel?: string
  className?: string
}

export const BooleanRadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroup>,
  BooleanRadioGroupProps
>(({ 
  value, 
  onValueChange, 
  trueLabel = "True", 
  falseLabel = "False",
  className,
  ...props 
}, ref) => {
  return (
    <RadioGroup
      ref={ref}
      onValueChange={(stringValue) => {
        const boolValue = stringValue === "true"
        onValueChange?.(boolValue)
      }}
      value={value?.toString()}
      className={className}
      {...props}
    >
      <FormItem className="flex items-center space-x-3 space-y-0">
        <FormControl>
          <RadioGroupItem value="false" />
        </FormControl>
        <FormLabel className="font-normal cursor-pointer">
          {falseLabel}
        </FormLabel>
      </FormItem>
      <FormItem className="flex items-center space-x-3 space-y-0">
        <FormControl>
          <RadioGroupItem value="true" />
        </FormControl>
        <FormLabel className="font-normal cursor-pointer">
          {trueLabel}
        </FormLabel>
      </FormItem>
    </RadioGroup>
  )
})

BooleanRadioGroup.displayName = "BooleanRadioGroup"