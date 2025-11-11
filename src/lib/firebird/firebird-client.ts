import { queryFirebird } from './firebird';

const globalForFirebird = globalThis as unknown as {
  firebirdQuery?: typeof queryFirebird;
};

export const firebirdQuery = globalForFirebird.firebirdQuery ?? queryFirebird;

if (process.env.NODE_ENV !== 'production') {
  globalForFirebird.firebirdQuery = firebirdQuery;
}
