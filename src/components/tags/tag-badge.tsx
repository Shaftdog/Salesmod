import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Tag } from "@/lib/types";

type TagBadgeProps = {
  tag: Tag;
  onRemove?: () => void;
  removable?: boolean;
};

export function TagBadge({ tag, onRemove, removable = false }: TagBadgeProps) {
  return (
    <Badge
      variant="secondary"
      style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
      className="border gap-1"
    >
      {tag.name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

