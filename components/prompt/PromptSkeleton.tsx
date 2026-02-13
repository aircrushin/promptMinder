// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

export function PromptSkeleton() {
  const { t } = useLanguage();
  if (!t) return null;
  const tp = t.promptDetailPage;
  
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-secondary"
          disabled
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tp?.backToList || 'Back to Prompt List'}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem)]">
        <div className="h-full flex flex-col">
          <Card className="border-none shadow-lg bg-gradient-to-br from-background to-secondary/10 flex-1">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="mt-6">
                <Skeleton className="h-[300px] w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-[50px] flex-1" />
                  <Skeleton className="h-[50px] w-[50px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}