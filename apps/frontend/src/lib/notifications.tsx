import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const notifications = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4" />,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="h-4 w-4" />,
      duration: 4000,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};