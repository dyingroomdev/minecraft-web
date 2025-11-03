import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Navbar } from './components/Navbar';
import Home from './pages/Home';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-bg text-on">
        <Navbar />
        <Home />
      </div>
    </QueryClientProvider>
  );
}

export default App;
