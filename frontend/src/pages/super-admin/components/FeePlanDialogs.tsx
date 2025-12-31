import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeePlanDialogsProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  setDeleteItem: (item: { id: number; schoolId: number } | null) => void;
  handleDelete: () => Promise<void>;
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  selectedFeePlanIds: number[];
  handleBulkDeleteWithDialog: () => Promise<void>;
}

export function FeePlanDialogs({
  deleteDialogOpen,
  setDeleteDialogOpen,
  setDeleteItem,
  handleDelete,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  selectedFeePlanIds,
  handleBulkDeleteWithDialog,
}: FeePlanDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee plan? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Plans</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFeePlanIds.length} fee
              plan(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDeleteWithDialog}>
              Delete {selectedFeePlanIds.length} Plan(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
