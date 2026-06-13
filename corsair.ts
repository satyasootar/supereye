/**
 * Corsair SDK re-export for CLI compatibility.
 * The Corsair CLI (npx corsair setup/auth/list/schema) requires
 * a corsair.ts file in the project root. This thin wrapper
 * delegates to the actual initialization in lib/corsair.ts.
 *
 * DO NOT move or rename this file without updating CLI commands.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const { corsair } = require('./lib/corsair');
export { corsair };
