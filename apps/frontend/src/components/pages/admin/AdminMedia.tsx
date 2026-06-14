import { ChangeEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface UploadedMedia {
  filename: string;
  url: string;
  content_type?: string;
  size?: number;
}

export function AdminMedia() {
  const [file, setFile] = useState<File | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadedMedia | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (payload: File) => apiClient.uploadMedia(payload),
    onSuccess: (data: UploadedMedia) => {
      setLastUpload(data);
      setFile(null);
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setFile(selected ?? null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Upload images for news posts, hero slides, and other content blocks. Uploaded files are immediately accessible
          under <code>/api/media/&lt;filename&gt;</code>.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload media</CardTitle>
          <CardDescription>Supported formats: JPEG, PNG, GIF, WebP. Max size 5&nbsp;MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          <div className="flex gap-2">
            <Button
              onClick={() => file && uploadMutation.mutate(file)}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
            {file ? <span className="text-sm text-muted-foreground">{file.name}</span> : null}
          </div>
          {uploadMutation.isError ? (
            <p className="text-sm text-destructive">
              {(uploadMutation.error as Error).message || 'Upload failed. Please try again.'}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {lastUpload ? (
        <Card>
          <CardHeader>
            <CardTitle>Last upload</CardTitle>
            <CardDescription>Use the URL below in your content configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <code className="break-all text-foreground">{lastUpload.url}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(lastUpload.url)}
              >
                Copy URL
              </Button>
            </div>
            <div>
              <p>Filename: {lastUpload.filename}</p>
              {typeof lastUpload.size === 'number' ? (
                <p>Size: {(lastUpload.size / 1024).toFixed(1)} KB</p>
              ) : null}
              {lastUpload.content_type ? <p>Content type: {lastUpload.content_type}</p> : null}
            </div>
            <div className="rounded-md border border-border/70 bg-muted p-4">
              <img
                src={lastUpload.url}
                alt={lastUpload.filename}
                className="mx-auto max-h-64 rounded-lg object-contain"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
