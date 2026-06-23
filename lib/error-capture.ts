let lastError: Error | undefined;

const origError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args[0] instanceof Error) lastError = args[0];
  origError(...args);
};

export function consumeLastCapturedError(): Error | undefined {
  const e = lastError;
  lastError = undefined;
  return e;
}
