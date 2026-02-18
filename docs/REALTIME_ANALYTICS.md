# Real-Time Analytics - Implementation Guide

This guide explains how to implement real-time analytics for the n8n marketplace using WebSockets.

## Overview

Real-time analytics provides:
- Live user count
- Live download counter
- Revenue ticker with updates
- Real-time event tracking

## Implementation Options

### Option 1: Supabase Realtime (Recommended)

Supabase provides built-in real-time subscriptions to database changes.

#### Setup Steps:

1. **Enable Realtime for Tables:**

   In Supabase Dashboard:
   - Go to Database > Replication
   - Enable Realtime for: `events`, `page_views`, `search_analytics`

2. **Create Realtime Hook:**

   ```typescript
   // lib/realtime-supabase.ts
   import { createClient } from '@supabase/supabase-js';
   import { useEffect, useState } from 'react';

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );

   export function useRealtimeStats() {
     const [stats, setStats] = useState({
       liveUsers: 0,
       downloadsToday: 0,
       revenueToday: 0,
     });

     useEffect(() => {
       // Subscribe to events table
       const eventsSubscription = supabase
         .channel('events-changes')
         .on(
           'postgres_changes',
           {
             event: 'INSERT',
             schema: 'public',
             table: 'events',
           },
           (payload) => {
             // Update stats based on event type
             const eventType = payload.new.event_type;

             if (eventType === 'workflow_download') {
               setStats(prev => ({
                 ...prev,
                 downloadsToday: prev.downloadsToday + 1,
               }));
             }

             if (eventType === 'checkout_completed') {
               const amount = payload.new.properties?.amount || 0;
               setStats(prev => ({
                 ...prev,
                 revenueToday: prev.revenueToday + amount,
               }));
             }
           }
         )
         .subscribe();

       return () => {
         eventsSubscription.unsubscribe();
       };
     }, []);

     return stats;
   }
   ```

3. **Use in Admin Dashboard:**

   ```typescript
   // app/admin/page.tsx
   import { useRealtimeStats } from '@/lib/realtime-supabase';

   export default function AdminDashboard() {
     const stats = useRealtimeStats();

     return (
       <div className="grid grid-cols-3 gap-4">
         <LiveCounter label="Live Users" value={stats.liveUsers} icon={<UsersIcon />} />
         <LiveCounter label="Downloads Today" value={stats.downloadsToday} icon={<DownloadIcon />} />
         <RevenueTicker revenue={stats.revenueToday} />
       </div>
     );
   }
   ```

### Option 2: Custom WebSocket Server

For more control, create a custom WebSocket server.

#### Setup Steps:

1. **Create WebSocket Server:**

   ```typescript
   // server/websocket-server.ts
   import { WebSocketServer, WebSocket } from 'ws';
   import http from 'http';

   const server = http.createServer();
   const wss = new WebSocketServer({ server });

   const clients = new Set<WebSocket>();

   wss.on('connection', (ws) => {
     clients.add(ws);

     // Send current stats on connection
     ws.send(JSON.stringify({
       type: 'stats',
       data: getCurrentStats(),
     }));

     ws.on('close', () => {
       clients.delete(ws);
     });
   });

   // Broadcast updates
   function broadcastStats() {
     const stats = getCurrentStats();
     const message = JSON.stringify({ type: 'stats', data: stats });

     clients.forEach((client) => {
       if (client.readyState === WebSocket.OPEN) {
         client.send(message);
       }
     });
   }

   // Call this when events occur
   export function onEvent(event: any) {
     updateStats(event);
     broadcastStats();
   }

   server.listen(3001);
   console.log('WebSocket server running on port 3001');
   ```

2. **Create WebSocket Hook:**

   ```typescript
   // lib/use-websocket.ts
   import { useEffect, useState } from 'react';

   export function useWebSocket(url: string) {
     const [connected, setConnected] = useState(false);
     const [stats, setStats] = useState<any>(null);

     useEffect(() => {
       const ws = new WebSocket(url);

       ws.onopen = () => {
         setConnected(true);
         console.log('WebSocket connected');
       };

       ws.onmessage = (event) => {
         const message = JSON.parse(event.data);

         if (message.type === 'stats') {
           setStats(message.data);
         }
       };

       ws.onclose = () => {
         setConnected(false);
         console.log('WebSocket disconnected');
       };

       ws.onerror = (error) => {
         console.error('WebSocket error:', error);
       };

       return () => {
         ws.close();
       };
     }, [url]);

     return { connected, stats };
   }
   ```

3. **Use in Component:**

   ```typescript
   import { useWebSocket } from '@/lib/use-websocket';

   export default function LiveStats() {
     const { connected, stats } = useWebSocket('ws://localhost:3001');

     return (
       <div>
         {connected ? (
           <>
             <div>Live Users: {stats?.liveUsers}</div>
             <div>Downloads: {stats?.downloadsToday}</div>
           </>
         ) : (
           <div>Connecting...</div>
         )}
       </div>
     );
   }
   ```

### Option 3: Server-Sent Events (SSE)

Simpler alternative to WebSockets for one-way updates.

#### Setup Steps:

1. **Create SSE Endpoint:**

   ```typescript
   // app/api/events/route.ts
   import { NextRequest } from 'next/server';

   export async function GET(request: NextRequest) {
     const headers = new Headers({
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive',
     });

     const encoder = new TextEncoder();

     const stream = new ReadableStream({
       async start(controller) {
         // Send current stats immediately
         const stats = await getCurrentStats();
         controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));

         // Set up interval for updates
         const interval = setInterval(async () => {
           const newStats = await getCurrentStats();
           controller.enqueue(encoder.encode(`data: ${JSON.stringify(newStats)}\n\n`));
         }, 5000); // Update every 5 seconds

         // Cleanup on disconnect
         request.signal.addEventListener('abort', () => {
           clearInterval(interval);
           controller.close();
         });
       },
     });

     return new Response(stream, { headers });
   }
   ```

2. **Create SSE Hook:**

   ```typescript
   // lib/use-sse.ts
   import { useEffect, useState } from 'react';

   export function useSSE(url: string) {
     const [connected, setConnected] = useState(false);
     const [stats, setStats] = useState<any>(null);

     useEffect(() => {
       const eventSource = new EventSource(url);

       eventSource.onopen = () => {
         setConnected(true);
         console.log('SSE connected');
       };

       eventSource.onmessage = (event) => {
         const data = JSON.parse(event.data);
         setStats(data);
       };

       eventSource.onerror = (error) => {
         setConnected(false);
         console.error('SSE error:', error);
       };

       return () => {
         eventSource.close();
       };
     }, [url]);

     return { connected, stats };
   }
   ```

3. **Use in Component:**

   ```typescript
   import { useSSE } from '@/lib/use-sse';

   export default function LiveStats() {
     const { connected, stats } = useSSE('/api/events');

     return (
       <div>
         {connected ? (
           <>
             <div>Live Users: {stats?.liveUsers}</div>
             <div>Downloads: {stats?.downloadsToday}</div>
           </>
         ) : (
           <div>Connecting...</div>
         )}
       </div>
     );
   }
   ```

## Metrics to Track in Real-Time

### User Metrics
- Live user count (active sessions in last 5 minutes)
- New signups today
- Active subscriptions

### Engagement Metrics
- Page views today
- Searches today
- Downloads today
- Unique visitors today

### Revenue Metrics
- Today's revenue
- This hour's revenue
- Last transaction time

### Workflow Metrics
- Trending workflows (last hour)
- Most downloaded today
- Highest rated today

## Performance Considerations

### Supabase Realtime
- ✅ Easy to implement
- ✅ Built-in authentication
- ✅ Auto-reconnects
- ⚠️ May have delay (1-3 seconds)
- ⚠️ Limited to database events

### Custom WebSockets
- ✅ Full control
- ✅ Instant updates
- ✅ Custom events
- ⚠️ Requires server setup
- ⚠️ Need to handle reconnections

### Server-Sent Events
- ✅ Simple to implement
- ✅ Works over HTTP
- ✅ Automatic reconnects
- ⚠️ One-way only (server → client)
- ⚠️ Limited to 6 connections per domain (HTTP/1.1)

## Testing

### Test Realtime Connection:
```typescript
// Test component
import { useRealtimeStats } from '@/lib/realtime-supabase';

export default function TestRealtime() {
  const stats = useRealtimeStats();

  return (
    <div>
      <h2>Real-time Stats Test</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
```

### Simulate Events:
```sql
-- Insert test events
INSERT INTO events (user_id, event_type, event_name, properties)
VALUES
  ('test-user-id', 'workflow_download', 'test-workflow', '{"workflow_id": "test-id"}'::jsonb);
```

## Best Practices

1. **Debounce Updates:** Don't update state on every event (use batching or debounce)
2. **Limit Refresh Rate:** Poll or refresh at reasonable intervals (5-30 seconds)
3. **Handle Disconnects:** Always implement reconnection logic
4. **Optimize Queries:** Use indexes and efficient queries for real-time data
5. **Cache Data:** Cache expensive calculations
6. **Monitor Performance:** Track WebSocket/SSE connection health

## Example: Complete Realtime Dashboard Component

```typescript
'use client';

import { useRealtimeStats } from '@/lib/realtime-supabase';
import { LiveCounter, RevenueTicker } from '@/lib/realtime-analytics';

export default function RealtimeDashboard() {
  const stats = useRealtimeStats();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <LiveCounter
          label="Live Users"
          value={stats.liveUsers}
          icon={<UsersIcon />}
        />
        <LiveCounter
          label="Downloads Today"
          value={stats.downloadsToday}
          icon={<DownloadIcon />}
        />
        <RevenueTicker revenue={stats.revenueToday} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Recent Activity</h3>
        <div className="space-y-2">
          {/* Recent events list */}
        </div>
      </div>
    </div>
  );
}
```

## Next Steps

1. Choose implementation option (Supabase Realtime recommended)
2. Enable Realtime in Supabase Dashboard
3. Implement realtime hook
4. Add to admin dashboard
5. Test with live data
6. Monitor performance
7. Add error handling and reconnection logic

---

*For questions or issues, refer to Supabase Realtime documentation.*
