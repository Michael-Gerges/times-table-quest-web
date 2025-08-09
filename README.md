# Times Table Quest Web

Client-side rewrite of the Times Table Quest trainer using vanilla JavaScript and Vite.

## Development

```bash
npm install
npm run dev    # start dev server
npm run build  # produce production bundle
npm test       # run unit tests
npm run server # start logging server
```

## Usage logging

Run `npm run server` to start a minimal HTTP server that stores usage
entries in `usage-log.json`. The client posts each session start and
question result to `/log`. View the accumulated records by visiting
`http://localhost:3000/logs` or inspecting the `usage-log.json` file.
