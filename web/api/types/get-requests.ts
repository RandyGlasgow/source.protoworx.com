import { User } from './models/user.model';

export type GetRequests = {
  '/auth/me': {
    body: undefined | null;
    response: { data: User };
  };
  '/projects': {
    body: undefined | null;
    response: { data: unknown[] };
  };
  '/projects/:id': {
    body: undefined | null;
    params: { id: string };
    response: unknown;
  };
};
