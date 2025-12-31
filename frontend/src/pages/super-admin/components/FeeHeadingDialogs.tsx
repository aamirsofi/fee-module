import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface FeeHeadingDialogsProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDelete: () => void;
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  selectedCount: number;
  handleBulkDelete: () => Promise<void>;
}

export function FeeHeadingDialogs({
  deleteDialogOpen,
  setDeleteDialogOpen,
  handleDelete,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  selectedCount,
  handleBulkDelete,
}: FeeHeadingDialogsProps) {
  return (
    <>
      {/* Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee category? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Categories</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} fee category(es)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedCount} Category(ies)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

