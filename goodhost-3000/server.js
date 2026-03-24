const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
app.use(express.json());

// === USERS ===
const users = { john: "1234", anna: "5678" };

// === SESSION STORE ===
let activeSessionsTTL = [];
const SESSION_TTL = 2 * 60 * 1000;

// === CSRF STORE ===
let csrfTokens = {};

// === LOGIN ===
app.get("/login", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    if (users[username] && users[username] === password) {
        const sessionId = `${username}-session-${Date.now()}`;
        activeSessionsTTL.push({ id: sessionId, timestamp: Date.now() });

        const csrfToken = Math.random().toString(36).substring(2);
        csrfTokens[sessionId] = csrfToken;

        res.setHeader(
            "Set-Cookie",
            `SessionID=${sessionId}; Path=/api; HttpOnly; Secure; SameSite=Strict`
        );

        res.json({
            message: `Login successful. Logged in as ${username}`,
            csrfToken
        });
    } else {
        res.status(401).send("Invalid credentials");
    }
});

// === CONFIG ===
const version = fs.readFileSync(path.join(__dirname, "version.txt"), "utf8").trim();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

// === HSTS ===
app.use((req, res, next) => {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

// === EMAIL DATA ===
const emails = [
    { id: 1, sender: "Wolf@example.com", subject: "Welcome to SecureMail", body: "Hello John, welcome to SecureMail Pro." },
    { id: 2, sender: "Stash@example.com", subject: "Meeting Reminder", body: "John, don't forget our meeting at 3 PM today." }
];

// === AUTH MIDDLEWARE ===
app.use("/api", (req, res, next) => {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/SessionID=([^\s;]+)/);
    if (!match) return res.status(401).send("Unauthorized");

    const sessionId = match[1];

    const now = Date.now();
    activeSessionsTTL = activeSessionsTTL.filter(s => now - s.timestamp < SESSION_TTL);

    if (!activeSessionsTTL.find(s => s.id === sessionId))
        return res.status(401).send("Session expired");

    req.sessionId = sessionId;
    next();
});

// === EMAILS ===
app.get("/api/emails", (req, res) => {
    res.json(emails);
});

// === DELETE (POST + CSRF) ===
app.post("/api/emails/delete", (req, res) => {
    const { id, _csrf_token } = req.body;

    const sessionId = req.sessionId;

    if (csrfTokens[sessionId] !== _csrf_token) {
        return res.status(403).send("Invalid CSRF token");
    }

    const index = emails.findIndex(e => e.id === id);

    if (index !== -1) {
        emails.splice(index, 1);
        return res.send("Deleted");
    }

    res.status(404).send("Not found");
});

// === LOGOUT ===
app.post("/api/logout", (req, res) => {
    const sessionId = req.sessionId;

    activeSessionsTTL = activeSessionsTTL.filter(s => s.id !== sessionId);
    delete csrfTokens[sessionId];

    res.setHeader(
        "Set-Cookie",
        "SessionID=; Path=/api; HttpOnly; Secure; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    );

    res.send("Logged out");
});

// === STATIC ===
app.use(express.static(path.join(__dirname)));

// === MAIN PAGE ===
app.get("/", (req, res) => {
    res.send(`
    <html>
    <body>
        <h1>${config.appName}</h1>
        <p>Version: ${version}</p>

        <input id="username" placeholder="username">
        <input id="password" placeholder="password">
        <button onclick="login()">Login</button>
        <button id="logoutBtn">Logout</button>

        <div id="status"></div>
        <div id="sidebar"></div>
        <div id="main"></div>

        <script src="main.js"></script>
    </body>
    </html>
    `);
});

// === HTTPS ===
const options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem"))
};

https.createServer(options, app).listen(3443, () => {
    console.log("HTTPS running on https://localhost:3443");
});

// === HTTP REDIRECT ===
http.createServer((req, res) => {
    res.writeHead(301, {
        Location: `https://localhost:3443${req.url}`
    });
    res.end();
}).listen(3000, () => {
    console.log("HTTP redirect on http://localhost:3000");
});