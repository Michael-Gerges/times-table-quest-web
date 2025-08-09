# Times Table Quest Web

Client-side rewrite of the Times Table Quest trainer using vanilla JavaScript and Vite.

## Development

```bash
npm install
npm run dev    # start dev server
npm run build  # produce production bundle
npm test       # run unit tests
```

## Usage Logging

Usage is recorded to [Netlify Blobs](https://docs.netlify.com/blobs/)
via serverless functions. For local development, run `netlify dev` and
visit [`/logs.html`](http://localhost:8888/logs.html) to view the latest
entries. In production deployments the same page requires the password
**albert**.

Endpoints:

* **Write**: `POST /.netlify/functions/log`
* **Read**: `GET /.netlify/functions/logs-read?password=albert`
