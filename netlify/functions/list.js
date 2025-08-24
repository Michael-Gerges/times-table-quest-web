import { getStore } from "@netlify/blobs";

const STORE_NAME = "submissions";
const LOG_KEY = "logs/submissions.log";

export default async () => {
  const store = getStore(STORE_NAME);
  const text = await store.get(LOG_KEY);      // string or null
  const entries = text ? text.split("\n").filter(Boolean) : [];
  return Response.json({ entries });
};
