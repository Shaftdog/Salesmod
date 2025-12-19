"use client";

import { useState } from "react";
import { useOrderNotes, useDeleteNote, OrderNote, NoteType } from "@/lib/hooks/use-order-notes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  AlertCircle,
  Trash2,
  Loader2,
  Plus,
  Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderNotesSectionProps {
  orderId: string;
  onAddNote?: () => void;
  variant?: 'card' | 'inline';
}

const noteTypeLabels: Record<NoteType, string> = {
  general: "General",
  phone: "Phone Call",
  email: "Email",
  meeting: "Meeting",
  issue: "Issue",
};

const noteTypeColors: Record<NoteType, string> = {
  general: "bg-gray-500",
  phone: "bg-blue-500",
  email: "bg-green-500",
  meeting: "bg-purple-500",
  issue: "bg-red-500",
};

function getNoteTypeIcon(noteType: NoteType) {
  switch (noteType) {
    case 'phone':
      return <Phone className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'meeting':
      return <Users className="h-4 w-4" />;
    case 'issue':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

export function OrderNotesSection({ orderId, onAddNote, variant = 'card' }: OrderNotesSectionProps) {
  const { data: notes, isLoading, error } = useOrderNotes(orderId);
  const deleteNote = useDeleteNote(orderId);
  const { toast } = useToast();
  const [noteToDelete, setNoteToDelete] = useState<OrderNote | null>(null);

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote.mutateAsync(noteToDelete.id);
      toast({
        title: "Note Deleted",
        description: "The note has been deleted",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setNoteToDelete(null);
    }
  };

  // Loading state
  if (isLoading) {
    const loadingContent = (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

    if (variant === 'inline') {
      return loadingContent;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>{loadingContent}</CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    const errorContent = (
      <p className="text-sm text-destructive">Failed to load notes</p>
    );

    if (variant === 'inline') {
      return <div className="py-4">{errorContent}</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>{errorContent}</CardContent>
      </Card>
    );
  }

  // Notes list content
  const notesContent = (
    <>
      {notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={noteTypeColors[note.note_type]}>
                      <span className="flex items-center gap-1">
                        {getNoteTypeIcon(note.note_type)}
                        {noteTypeLabels[note.note_type]}
                      </span>
                    </Badge>
                    {note.is_internal && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {note.creator?.name && (
                      <>
                        <span>by {note.creator.name}</span>
                        <span>-</span>
                      </>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNoteToDelete(note)}
                  title="Delete"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No notes have been added for this order.
          </p>
          {onAddNote && (
            <Button variant="outline" onClick={onAddNote} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Note
            </Button>
          )}
        </div>
      )}
    </>
  );

  // Header with add button
  const headerContent = (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Notes</CardTitle>
        <CardDescription>
          {notes && notes.length > 0
            ? `${notes.length} note${notes.length === 1 ? "" : "s"}`
            : "No notes yet"}
        </CardDescription>
      </div>
      {onAddNote && notes && notes.length > 0 && (
        <Button onClick={onAddNote}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      )}
    </div>
  );

  // Delete confirmation dialog
  const deleteDialog = (
    <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this note? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteNote.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Render based on variant
  if (variant === 'inline') {
    return (
      <>
        <div className="space-y-4">
          {/* Inline header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {notes && notes.length > 0
                ? `${notes.length} note${notes.length === 1 ? "" : "s"}`
                : "No notes yet"}
            </p>
            {onAddNote && (
              <Button size="sm" onClick={onAddNote}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            )}
          </div>
          {notesContent}
        </div>
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>{headerContent}</CardHeader>
        <CardContent>{notesContent}</CardContent>
      </Card>
      {deleteDialog}
    </>
  );
}
