"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeRouter = void 0;
const express_1 = require("express");
const homeRouter = (0, express_1.Router)();
exports.homeRouter = homeRouter;
const buildHomeHtml = (baseUrl) => {
  const identifyUrl = `${baseUrl}/identify`;
  const healthUrl = `${baseUrl}/health`;
  const docsUrl = `${baseUrl}/docs`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bitespeed Identity Reconciliation</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; margin: 32px; line-height: 1.4; color: #111; }
      h1 { margin-bottom: 8px; }
      h2 { margin-top: 28px; }
      pre { background: #f5f5f5; padding: 14px; overflow-x: auto; border: 1px solid #ddd; }
      code { font-family: "Courier New", monospace; }
      .url { font-size: 18px; font-weight: 700; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <h1>Bitespeed Identity Reconciliation</h1>
    <p><strong>Service status:</strong> Running</p>
    <p>This service resolves identity clusters using shared <code>email</code> or <code>phoneNumber</code> and exposes the <code>/identify</code> API.</p>
    <p><strong>Base URL:</strong> <a href="${baseUrl}" class="url">${baseUrl}</a></p>

    <h2>How To Test <code>/identify</code></h2>
    <p><strong>Method:</strong> <code>POST</code></p>
    <p><strong>Endpoint:</strong> <a href="${identifyUrl}" class="url">${identifyUrl}</a></p>
    <p><strong>Content-Type:</strong> <code>application/json</code> (use JSON body, not form-data)</p>

    <h2>Request Example</h2>
    <pre><code>{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}</code></pre>

    <h2>cURL Example</h2>
    <pre><code>curl -X POST "${identifyUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'</code></pre>

    <h2>Useful Endpoints</h2>
    <ul>
      <li><a href="${healthUrl}"><code>${healthUrl}</code></a> - health status</li>
      <li><a href="${docsUrl}"><code>${docsUrl}</code></a> - Swagger documentation</li>
    </ul>

    <h2>Response Shape</h2>
    <pre><code>{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}</code></pre>
  </body>
</html>`;
};
homeRouter.get("/", (req, res) => {
  const host = req.get("host") ?? "localhost:3000";
  const baseUrl = `${req.protocol}://${host}`;
  res.status(200).type("html").send(buildHomeHtml(baseUrl));
});
