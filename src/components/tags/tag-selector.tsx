"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TagBadge } from "./tag-badge";
import { Check, Plus, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag, ClientTag } from "@/lib/types";

type TagSelectorProps = {
  clientId: string;
  allTags: Tag[];
  clientTags: ClientTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
};

export function TagSelector({ clientId, allTags, clientTags, onAddTag, onRemoveTag }: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  const clientTagIds = new Set(clientTags.map(ct => ct.tagId));
  const availableTags = allTags.filter(tag => !clientTagIds.has(tag.id));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {clientTags.map((clientTag) => (
        clientTag.tag && (
          <TagBadge
            key={clientTag.tagId}
            tag={clientTag.tag}
            removable
            onRemove={() => onRemoveTag(clientTag.tagId)}
          />
        )
      ))}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <Plus className="h-3 w-3" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      onAddTag(tag.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

