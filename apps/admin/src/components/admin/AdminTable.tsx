import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
  title: string;
  data: any[];
  columns: Column[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  addLabel?: string;
}

export default function AdminTable({
  title,
  data,
  columns,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Add New'
}: AdminTableProps) {
  if (loading) {
    return (
      <Card className="p-6 bg-surface border-gray-600">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface2 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface2 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-on">{title}</h1>
        {onAdd && (
          <Button onClick={onAdd} className="bg-brand hover:bg-brand2 text-gray-900">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>

      <Card className="bg-surface border-gray-600">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                {columns.map((column) => (
                  <th key={column.key} className="text-left p-4 text-gray-200 font-medium">
                    {column.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-right p-4 text-gray-200 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center p-8 text-gray-300">
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-600 hover:bg-surface2/30">
                    {columns.map((column) => (
                      <td key={column.key} className="p-4 text-gray-200">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(row)}
                              className="border-gray-500 text-gray-200 hover:border-brand hover:bg-surface2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDelete(row)}
                              className="border-gray-500 text-gray-200 hover:border-minecraft-red hover:text-minecraft-red hover:bg-surface2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}