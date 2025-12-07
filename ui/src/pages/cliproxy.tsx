/**
 * CLIProxy Page
 * Phase 03: REST API Routes & CRUD
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CliproxyTable } from '@/components/cliproxy-table';
import { CliproxyDialog } from '@/components/cliproxy-dialog';
import { useCliproxy } from '@/hooks/use-cliproxy';

export function CliproxyPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useCliproxy();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CLIProxy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage OAuth-based provider variants (Gemini, Codex, Antigravity, Qwen)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Variant
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading variants...</div>
      ) : (
        <CliproxyTable data={data?.variants || []} />
      )}

      <CliproxyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
