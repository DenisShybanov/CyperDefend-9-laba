const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

// === STORAGE ===
let bookings = [];

// === HELPER: escape HTML (XSS protection) ===
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (char) => {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[char];
    });
}

// === GET FORM ===
app.get("/", (req, res) => {
    res.send(`
    <h2>Camp Booking</h2>
    <form method="POST" action="/submit">
        Name: <input name="name" required><br>
        Surname: <input name="surname" required><br>
        Email: <input name="email" type="email" required><br>
        Age: <input name="age" type="number" min="5" max="100" required><br>
        Date: <input name="date" type="date" required><br>
        <button type="submit">Book</button>
    </form>
    `);
});

// === POST (VALIDATION) ===
app.post("/submit", (req, res) => {
    const { name, surname, email, age, date } = req.body;

    // 1. REQUIRED
    if (!name || !surname || !email || !age || !date) {
        return res.status(400).send("All fields are required");
    }

    // 2. EMAIL REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send("Invalid email");
    }

    // 3. AGE VALIDATION
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
        return res.status(400).send("Invalid age");
    }

    // 4. DATE VALIDATION
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).send("Invalid date");
    }

    // 5. ESCAPE (XSS PROTECTION)
    const safeData = {
        name: escapeHTML(name),
        surname: escapeHTML(surname),
        email: escapeHTML(email),
        age: ageNum,
        date: escapeHTML(date)
    };

    bookings.push(safeData);

    res.send(`
        <h2>Booking Confirmed</h2>
        <p>Name: ${safeData.name}</p>
        <p>Surname: ${safeData.surname}</p>
        <p>Email: ${safeData.email}</p>
        <p>Age: ${safeData.age}</p>
        <p>Date: ${safeData.date}</p>
    `);
});

// === START ===
app.listen(9000, () => {
    console.log("Server running on http://localhost:9000");
});