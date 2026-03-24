const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
let csrfTokens = {}; // sessionId -> token
const app = express();
app.use(express.json());

// === USERS ===
const users = { john: "1234", anna: "5678" };

// === SESSION STORE WITH TTL ===
let activeSessionsTTL = []; // { id: "SessionID", timestamp: Date.now() }
const SESSION_TTL = 2 * 60 * 1000; // 2 хвилини

// === LOGIN ===
const csrfToken = Math.random().toString(36).substring(2);
csrfTokens[sessionId] = csrfToken;

res.json({
    message: `Login successful. Logged in as ${username}`,
    csrfToken
});

// === READ CONFIG ===
const version = fs.readFileSync(path.join(__dirname, "version.txt"), "utf8").trim();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

// === CORS & CSP ===
if (config.mode === "mode1") app.use(cors());
if (config.mode === "csp-strict") {
    app.use((req, res, next) => {
        res.setHeader("Content-Security-Policy", "default-src 'self';");
        next();
    });
}
if (config.mode === "csp-balanced") {
    app.use((req, res, next) => {
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; img-src *; style-src *; script-src 'self' http://localhost:4000 http://localhost:7000;"
        );
        next();
    });
}

// === EMAIL DATA ===
const emails = [
    { id: 1, sender: "Wolf@example.com", subject: "Welcome to SecureMail", body: "Hello John, welcome to SecureMail Pro." },
    { id: 2, sender: "Stash@example.com", subject: "Meeting Reminder", body: "John, don't forget our meeting at 3 PM today." }
];

// === TTL MIDDLEWARE ===
app.use("/api", (req, res, next) => {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/SessionID=([^\s;]+)/);
    if (!match) return res.status(401).send("Unauthorized: No session");

    const sessionId = match[1];

    // Видаляємо прострочені сесії
    const now = Date.now();
    activeSessionsTTL = activeSessionsTTL.filter(s => now - s.timestamp < SESSION_TTL);

    if (!activeSessionsTTL.find(s => s.id === sessionId))
        return res.status(401).send("Unauthorized: Session expired");

    next();
});

// === PROTECTED API ===
app.get("/api/emails", (req, res) => {
    res.json(emails);
});

// === DELETE EMAIL (SECURE - POST + CSRF) ===
delBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    fetch(`/api/emails/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: email.id,
            _csrf_token: csrfToken
        })
    }).then(() => location.reload());
});
// === LOGOUT ===
app.post("/api/logout", (req, res) => {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/SessionID=([^\s;]+)/);
    if (match) {
        const sessionId = match[1];
        activeSessionsTTL = activeSessionsTTL.filter(s => s.id !== sessionId);
    }

    // Очистка cookie
    res.setHeader(
        "Set-Cookie",
        "SessionID=; Path=/api; HttpOnly; Secure; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    );
    res.send("Logged out successfully");
});

// === STATIC ===
app.use(express.static(path.join(__dirname)));

// === MAIN PAGE ===
app.get("/", (req, res) => {
    res.send(`
    <html>
    <head>
        <title>${config.appName}</title>
        <link rel="stylesheet" href="http://localhost:7000/styles.css">
    </head>
    <body>
        <div class="logo-container">
            <img src="http://localhost:7000/logo.png">
        </div>
        <h1>${config.appName}</h1>
        <p>Version: ${version}</p>
        <h2>Login</h2>
        <input id="username" placeholder="username">
        <input id="password" placeholder="password">
        <button onclick="login()">Login</button>
        <button id="logoutBtn">Logout</button>
        <div id="status"></div>
        <div id="sidebar"></div>
        <div id="main">
            <p>Select an email to view its content</p>
        </div>
        <script src="http://localhost:7000/react-mock.js"></script>
        <script src="http://localhost:4000/support.js"></script>
        <script src="http://localhost:5000/weather-widget.js"></script>
        <script src="main.js"></script>
    </body>
    </html>
    `);
});

// === START SERVER ===
app.listen(3000, () => {
    console.log(`[System] Starting ${config.appName} v${version}...`);
    console.log(`Mode: ${config.mode}`);
    console.log("GoodHost running on http://localhost:3000");
});