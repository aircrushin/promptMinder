import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  promptId, 
  t 
}) {
  const { toast } = useToast();
  const router = useRouter();
  const tp = t.promptDetailPage;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/prompts');
      } else {
        throw new Error(tp.deleteError);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({ 
        title: "Error",
        description: tp.deleteError,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tp.deleteConfirmTitle}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{tp.deleteConfirmDescription}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleDelete();
              onOpenChange(false);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}