import { DeleteRequests } from './delete-requests';
import { GetRequests } from './get-requests';
import { PostRequests } from './post-requests';
import { PutRequests } from './put-requests';

export type Requests = {
  GET: GetRequests;
  POST: PostRequests;
  PUT: PutRequests;
  DELETE: DeleteRequests;
};
