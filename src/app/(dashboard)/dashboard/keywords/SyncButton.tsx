"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncGscDataAction } from "./actions";
import { toast } from "sonner";

export function SyncButton({ accountId }: { accountId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    try {
      setIsSyncing(true);
      await syncGscDataAction(accountId);
      toast.success("Sync job enqueued! Data will update in the background shortly.");
    } catch (error) {
      toast.error("Failed to start sync");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSync} 
      disabled={isSyncing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      Manual Sync
    </Button>
  );
}
