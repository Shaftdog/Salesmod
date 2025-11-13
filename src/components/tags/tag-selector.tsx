"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { TagBadge } from "./tag-badge";
import { Check, Plus, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTag } from "@/hooks/use-tags";
import type { Tag, ClientTag } from "@/lib/types";

type TagSelectorProps = {
  clientId: string;
  allTags: Tag[];
  clientTags: ClientTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
};

const PRESET_COLORS = [
  "#3771C8", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
];

export function TagSelector({ clientId, allTags, clientTags, onAddTag, onRemoveTag }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const { mutateAsync: createTag, isPending: isCreating } = useCreateTag();

  const clientTagIds = new Set(clientTags.map(ct => ct.tagId));
  const availableTags = allTags.filter(tag => !clientTagIds.has(tag.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await createTag({ name: newTagName.trim(), color: newTagColor });
      // Automatically add the newly created tag to the client
      onAddTag(newTag.id);
      // Reset form and close dialogs
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setCreateDialogOpen(false);
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <>
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
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setCreateDialogOpen(true);
                    }}
                    className="text-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Tag
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to organize your clients. The tag will be automatically added to this client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="e.g., VIP, Priority, New Client"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagName.trim()) {
                    handleCreateTag();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tag Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      newTagColor === color ? "border-foreground scale-110" : "border-muted-foreground/20"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                  Or choose custom:
                </Label>
                <input
                  id="custom-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer rounded border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <div
                className="px-2 py-1 rounded-md text-sm font-medium border"
                style={{
                  backgroundColor: `${newTagColor}20`,
                  color: newTagColor,
                  borderColor: newTagColor
                }}
              >
                {newTagName.trim() || "Tag Name"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewTagName("");
                setNewTagColor(PRESET_COLORS[0]);
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

