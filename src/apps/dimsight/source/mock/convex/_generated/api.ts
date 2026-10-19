const namespace = (name: string) => new Proxy({}, { get: (_, key) => `${name}.${String(key)}` });
export const api = {
  links: namespace('links'),
  projects: namespace('projects'),
  r2: namespace('r2'),
  users: namespace('users'),
};
