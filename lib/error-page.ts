export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Server Error</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f17;color:#e5e5ef}
    .wrap{text-align:center;padding:2rem}
    h1{font-size:1.75rem;font-weight:700;margin-bottom:.75rem}
    p{color:#666;margin-bottom:1.5rem}
    a{color:#6366f1;text-decoration:none}a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Something went wrong</h1>
    <p>An unexpected error occurred. Please try again.</p>
    <a href="/">Return home</a>
  </div>
</body>
</html>`;
}
