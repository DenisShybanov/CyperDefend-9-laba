// LOGIN
let csrfToken = "";

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch(`/login?username=${username}&password=${password}`)
        .then(res => res.json())
        .then(data => {
            csrfToken = data.csrfToken;
            document.getElementById("status").innerText = data.message;
            location.reload();
        });
}
// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    document.cookie = "SessionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    location.reload();
});

// EMAILS
emails.forEach(email => {
    const item = document.createElement("div");
    item.className = "email-item";

    const text = document.createElement("span");
    text.textContent = `${email.sender}: ${email.subject}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";

    delBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        fetch(`/api/emails/delete/${email.id}`)
            .then(() => location.reload());
    });

    item.appendChild(text);
    item.appendChild(delBtn);

    item.addEventListener("click", () => {
        main.innerHTML = `<h3>${email.subject}</h3><p>${email.body}</p>`;
    });

    sidebar.appendChild(item);
});

