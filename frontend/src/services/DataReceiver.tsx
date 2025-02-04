'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001');

export default function DataReceiver() {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    // Listen for database updates
    socket.on('db_update', (update) => {
      setData(update);
    });

    return () => {
      socket.off('db_update');
    };
  }, []);

  return (
    <div>
      <h2>Real-time Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}