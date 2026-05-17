export const logInfo = (event: string, payload: Record<string, unknown>) => {
  console.log(JSON.stringify({ level: 'info', event, payload, at: new Date().toISOString() }));
};

export const logError = (event: string, payload: Record<string, unknown>) => {
  console.error(JSON.stringify({ level: 'error', event, payload, at: new Date().toISOString() }));
};
