import 'dotenv/config';

import { createServer } from 'http';
import app from './app';
import { testConnection } from './db';
import { attachSignaling } from './signaling';

const PORT = process.env.PORT || 4000;

// Create the raw HTTP server explicitly (instead of app.listen) so the
// WebSocket signaling layer can hook the same server's `upgrade` event. Express
// handles normal HTTP requests; `ws` handles upgrades on the /ws path.
const server = createServer(app);
attachSignaling(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testConnection();
});
