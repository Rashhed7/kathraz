// Cloudflare Workers entry point.
// Uses cloudflare:node's httpServerHandler to run the existing Express app
// (officially supported since Aug 2025 with the nodejs_compat flag).
import { httpServerHandler } from 'cloudflare:node';
import { app } from '../server/app.js';
import { configureDatabase } from '../server/database.js';

const PORT = 3000;
app.listen(PORT);
const serverHandler = httpServerHandler({ port: PORT });

let dbConfigured = false;

export default {
  async fetch(request, env, ctx) {
    // Point pg at Hyperdrive (Cloudflare's Postgres proxy/pooler) once.
    // Hyperdrive terminates the database protocol inside Cloudflare's network,
    // which both fixes pg's TLS handshake on Workers and pools connections
    // so we don't open a new Supabase connection per request.
    if (!dbConfigured && env.HYPERDRIVE && env.HYPERDRIVE.connectionString) {
      configureDatabase({ connectionString: env.HYPERDRIVE.connectionString });
      dbConfigured = true;
    }
    return serverHandler.fetch(request, env, ctx);
  },
};
