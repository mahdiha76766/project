/**
 * Shim so tsx scripts can import modules that use `server-only`.
 */
import Module from 'node:module';

const originalLoad = Module._load;
Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'server-only') {
    return {};
  }
  // eslint-disable-next-line prefer-rest-params
  return originalLoad.apply(this, arguments as never);
};
