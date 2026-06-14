import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useUploadLeaderboard } from '../../../hooks/useLeaderboards';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Upload, FileText, Database, Trophy, Users, Target } from 'lucide-react';

interface UploadForm {
  season: string;
  leaderboard_type: string;
  title?: string;
}

export default function LeaderboardManager() {
  const { user } = useAdmin();
  const uploadLeaderboard = useUploadLeaderboard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>();

  const onSubmit = (data: UploadForm) => {
    if (isReadOnly || !selectedFile) return;
    
    uploadLeaderboard.mutate({
      season: data.season,
      type: data.leaderboard_type,
      title: data.title,
      file: selectedFile
    });
    
    // Reset form on success
    if (!uploadLeaderboard.isError) {
      reset();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['text/csv', 'application/json'];
    const validExtensions = ['.csv', '.json'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      toast.error('Please upload a CSV or JSON file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setSelectedFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on">Leaderboard Manager</h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload and manage leaderboard data for different seasons and categories
        </p>
      </div>

      {/* Upload Form */}
      <Card className="bg-surface border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-6 w-6 text-brand" />
          <h2 className="text-xl font-semibold text-on">Upload Leaderboard</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="season">Season *</Label>
              <Input
                id="season"
                {...register('season', { required: 'Season is required' })}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                placeholder="e.g., 2024-spring, season-1"
              />
              {errors.season && (
                <p className="text-red-400 text-sm mt-1">{errors.season.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="leaderboard_type">Category *</Label>
              <Input
                id="leaderboard_type"
                {...register('leaderboard_type', { required: 'Category is required' })}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                placeholder="e.g., pvp, building, mining"
              />
              {errors.leaderboard_type && (
                <p className="text-red-400 text-sm mt-1">{errors.leaderboard_type.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Display Title (Optional)</Label>
            <Input
              id="title"
              {...register('title')}
              disabled={isReadOnly}
              className="bg-surface2 border-gray-600"
              placeholder="e.g., Spring 2024 PvP Rankings"
            />
          </div>

          <div>
            <Label>Data File *</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-surface2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden"
                disabled={isReadOnly}
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-brand" />
                  <p className="text-on font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <p className="text-gray-300">
                      {isReadOnly ? 'File upload disabled' : 'Click to upload CSV or JSON file'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      CSV: player,score columns required • Max 5MB
                    </p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isReadOnly && (
            <Button
              type="submit"
              disabled={!selectedFile || uploadLeaderboard.isPending}
              className="bg-brand hover:bg-brand/90"
            >
              {uploadLeaderboard.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Leaderboard
            </Button>
          )}
        </form>
      </Card>

      {/* File Format Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-on">CSV Format</h3>
          </div>
          <pre className="bg-surface2 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`player,score,kills,deaths
PlayerOne,1500,45,12
PlayerTwo,1200,38,15
PlayerThree,1100,42,18`}
          </pre>
          <p className="text-gray-400 text-sm mt-2">
            Required columns: player, score. Additional columns become metadata.
          </p>
        </Card>

        <Card className="bg-surface border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-on">JSON Format</h3>
          </div>
          <pre className="bg-surface2 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`[
  {
    "player": "PlayerOne",
    "score": 1500,
    "metadata": {"kills": 45, "deaths": 12}
  },
  {
    "player": "PlayerTwo", 
    "score": 1200,
    "metadata": {"kills": 38, "deaths": 15}
  }
]`}
          </pre>
          <p className="text-gray-400 text-sm mt-2">
            Array of objects with player, score, and optional metadata fields.
          </p>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-accent" />
            <div>
              <p className="text-gray-400 text-sm">Supported Formats</p>
              <p className="text-on font-semibold">CSV & JSON</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-surface border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-brand" />
            <div>
              <p className="text-gray-400 text-sm">Max File Size</p>
              <p className="text-on font-semibold">5 MB</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-surface border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-minecraft-purple" />
            <div>
              <p className="text-gray-400 text-sm">Auto Positioning</p>
              <p className="text-on font-semibold">By Score</p>
            </div>
          </div>
        </Card>
      </div>

      {isReadOnly && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-yellow-400 text-sm">
            ℹ️ You have read-only access to leaderboards. Contact a Super Admin to upload data.
          </p>
        </Card>
      )}
    </div>
  );
}
