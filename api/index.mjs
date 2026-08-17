import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveStatic } from '@hono/node-server/serve-static';
import handle from 'hono-react-router-adapter/node';

import { getLoadContext } from '../apps/remix/build/server/hono/server/load-context.js';
import server from '../apps/remix/build/server/hono/server/router.js';
import * as build from '../apps/remix/build/server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientRoot = path.resolve(
  __dirname,
  '../apps/remix/build/client',
);

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

server.use(
  serveStatic({
    root: clientRoot,
    rewriteRequestPath: (requestPath) => {
      if (
        basePath &&
        (requestPath === basePath ||
          requestPath.startsWith(`${basePath}/`))
      ) {
        const stripped = requestPath.slice(basePath.length);
        return stripped === '' ? '/' : stripped;
      }

      return requestPath;
    },
    onFound: (filePath, c) => {
      if (filePath.includes('/assets/')) {
        c.header(
          'Cache-Control',
          'public, immutable, max-age=31536000',
        );
      } else {
        c.header(
          'Cache-Control',
          'public, max-age=0, stale-while-revalidate=86400',
        );
      }
    },
  }),
);

const handler = handle(build, server, { getLoadContext });

export default async function vercelHandler(request) {
  return handler.fetch(request);
}
