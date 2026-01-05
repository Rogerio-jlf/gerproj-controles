// src/lib/firebird/firebird-client.ts
import { executeFirebird, queryFirebird } from './firebird';

const globalForFirebird = globalThis as unknown as {
    firebirdQuery?: typeof queryFirebird;
    firebirdExecute?: typeof executeFirebird;
};

export const firebirdQuery = globalForFirebird.firebirdQuery ?? queryFirebird;
export const firebirdExecute = globalForFirebird.firebirdExecute ?? executeFirebird;

if (process.env.NODE_ENV !== 'production') {
    globalForFirebird.firebirdQuery = firebirdQuery;
    globalForFirebird.firebirdExecute = firebirdExecute;
}
