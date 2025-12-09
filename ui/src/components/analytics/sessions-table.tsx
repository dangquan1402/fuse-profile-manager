/**
 * Sessions Table Component
 *
 * Displays session history with pagination and filtering.
 * Shows session duration, tokens, cost, and metadata.
 */

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search, Clock, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginatedSessions } from '@/hooks/use-usage';

interface SessionsTableProps {
  data?: PaginatedSessions;
  isLoading?: boolean;
}

export function SessionsTable({ data, isLoading }: SessionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Get sessions array (stable reference for memoization)
  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions]);

  // Filter sessions based on search term
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;

    const term = searchTerm.toLowerCase();
    return sessions.filter(
      (session) =>
        session.profile.toLowerCase().includes(term) ||
        session.model.toLowerCase().includes(term) ||
        session.id.toLowerCase().includes(term)
    );
  }, [sessions, searchTerm]);

  // Pagination for filtered data
  const pageSize = 10;
  const paginatedSessions = useMemo(() => {
    if (!filteredSessions) return [];
    const start = currentPage * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage]);

  const totalPages = Math.ceil((filteredSessions?.length || 0) / pageSize);

  if (isLoading) {
    return <SessionsTableSkeleton />;
  }

  if (!data || data.sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No sessions found</h3>
        <p className="text-muted-foreground">Start using Claude Code to see session history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by profile, model, or session ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead>Last Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.map((session) => (
              <TableRow key={session.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{session.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Badge variant="secondary">{session.profile}</Badge>
                </TableCell>
                <TableCell className="font-medium">{session.model}</TableCell>
                <TableCell>{session.duration ? formatDuration(session.duration) : '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    {formatNumber(session.tokens)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />$
                    {session.cost.toFixed(4)}
                  </div>
                </TableCell>
                <TableCell className="text-right">{session.requests}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, filteredSessions?.length || 0)} of{' '}
            {filteredSessions?.length} sessions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className={cn('w-8 h-8 p-0')}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Skeleton loading state
function SessionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead>Last Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-[70px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
