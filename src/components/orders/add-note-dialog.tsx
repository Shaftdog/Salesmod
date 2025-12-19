"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCreateNote, NoteType } from "@/lib/hooks/use-order-notes";

interface AddNoteDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const noteTypes = [
  { value: "general", label: "General Note" },
  { value: "phone", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "issue", label: "Issue/Problem" },
];

export function AddNoteDialog({
  order,
  open,
  onOpenChange,
}: AddNoteDialogProps) {
  const [noteType, setNoteType] = useState<NoteType>("general");
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const createNote = useCreateNote(order.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNote.mutateAsync({
        note: content.trim(),
        note_type: noteType,
        is_internal: false,
      });

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully",
      });

      setContent("");
      setNoteType("general");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Communication Note</DialogTitle>
          <DialogDescription>
            Add a note or communication record for order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noteType">Type</Label>
              <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
                <SelectTrigger id="noteType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Note Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {content.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent("");
                setNoteType("general");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createNote.isPending || !content.trim()}>
              {createNote.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

