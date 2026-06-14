import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, UserRound } from 'lucide-react';

import { apiClient, type ContactRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const REQUEST_LABELS: Record<ContactRequest['request_type'], string> = {
  ban_appeal: 'Ban Appeal',
  bug_report: 'Bug Report',
  staff_application: 'Staff Application',
  contact: 'General Contact',
};

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function ContactRequestsManager() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['contact-requests', statusFilter],
    queryFn: () => apiClient.getContactRequests(statusFilter),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateContactRequestStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-requests'] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Requests</h1>
          <p className="text-muted-foreground">
            Review ban appeals, bug reports, staff applications, and general messages.
          </p>
        </div>
        <label className="text-sm text-muted-foreground">
          Status
          <select
            className="ml-3 rounded-md border border-gray-600 bg-surface px-3 py-2 text-on"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </header>

      {query.isLoading ? (
        <p className="text-muted-foreground">Loading requests...</p>
      ) : query.error ? (
        <p className="text-red-400">Failed to load contact requests.</p>
      ) : query.data?.length === 0 ? (
        <Card><CardContent className="pt-6 text-muted-foreground">No requests match this filter.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {query.data?.map((request) => (
            <Card key={request.id}>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{REQUEST_LABELS[request.request_type]}</Badge>
                    <Badge variant={request.status === 'open' ? 'destructive' : 'outline'}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle>{request.subject}</CardTitle>
                </div>
                <select
                  aria-label={`Status for ${request.subject}`}
                  className="rounded-md border border-gray-600 bg-surface px-3 py-2 text-sm text-on"
                  value={request.status}
                  disabled={updateStatus.isPending}
                  onChange={(event) => updateStatus.mutate({ id: request.id, status: event.target.value })}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                  ))}
                </select>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2"><UserRound className="h-4 w-4" />{request.name}</span>
                  <a className="flex items-center gap-2 text-brand hover:underline" href={`mailto:${request.email}`}>
                    <Mail className="h-4 w-4" />{request.email}
                  </a>
                  {request.minecraft_username ? <span>Minecraft: {request.minecraft_username}</span> : null}
                  <span>{new Date(request.created_at).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-200">{request.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
