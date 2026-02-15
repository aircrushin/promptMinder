'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Dynamic import for the heavy ChatTest component
const ChatTest = dynamic(() => import('./ChatTest'), {
  loading: () => (
    <Card className="h-full flex flex-col shadow-md border-border/40">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-lg mr-3" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 px-4 py-4">
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  ssr: false
});

export default function ChatTestWrapper(props) {
  return <ChatTest {...props} />;
}