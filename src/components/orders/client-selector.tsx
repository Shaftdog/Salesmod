
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Client } from "@/lib/types"
import { QuickClientForm } from "./quick-client-form"

type ClientSelectorProps = {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  onQuickAdd: (clientData: any) => void;
};

export function ClientSelector({ clients, value, onChange, onQuickAdd }: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)

  const handleQuickAddSuccess = (clientData: any) => {
    onQuickAdd(clientData);
    setShowQuickAdd(false);
    setOpen(false);
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? clients.find((client) => client.id === value)?.companyName
            : "Select client..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search client..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.companyName}
                  onSelect={() => {
                    onChange(client.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.companyName}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
                <CommandItem onSelect={() => {
                    setShowQuickAdd(true);
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Quick Add New Client
                </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <QuickClientForm open={showQuickAdd} onOpenChange={setShowQuickAdd} onSuccess={handleQuickAddSuccess} />
    </>
  )
}
