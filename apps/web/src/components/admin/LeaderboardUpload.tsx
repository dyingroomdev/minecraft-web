import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Database } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { apiClient } from '../../lib/api';

export function LeaderboardUpload() {
  const queryClient = useQueryClient();
  const [season, setSeason] = useState('');
  const [leaderboardType, setLeaderboardType] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ season, type, file }: { season: string; type: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return fetch(`/admin/leaderboards/upload?season=${season}&leaderboard_type=${type}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      setSeason('');
      setLeaderboardType('');
      setFile(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!season || !leaderboardType || !file) return;
    
    uploadMutation.mutate({ season, type: leaderboardType, file });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Upload Leaderboard
          </CardTitle>
          <CardDescription>
            Upload leaderboard data from CSV or JSON files
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g., 2024-spring"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Leaderboard Type</label>
              <input
                type="text"
                value={leaderboardType}
                onChange={(e) => setLeaderboardType(e.target.value)}
                placeholder="e.g., pvp, building, mining"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to upload CSV or JSON file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV: player,score columns required
                  </p>
                </label>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={!season || !leaderboardType || !file || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Leaderboard'}
            </Button>
          </form>
          
          {uploadMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Upload failed. Please check your file format and try again.
              </p>
            </div>
          )}
          
          {uploadMutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                Leaderboard uploaded successfully!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">File Format Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center mb-2">
              <FileText className="h-4 w-4 mr-2" />
              CSV Format
            </h4>
            <pre className="bg-gray-100 p-3 rounded text-sm">
{`player,score,kills,deaths
PlayerOne,1500,45,12
PlayerTwo,1200,38,15
PlayerThree,1100,42,18`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium flex items-center mb-2">
              <FileText className="h-4 w-4 mr-2" />
              JSON Format
            </h4>
            <pre className="bg-gray-100 p-3 rounded text-sm">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}