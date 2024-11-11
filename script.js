const db = firebase.database();
const heartsContainer = document.getElementById("hearts-container");
const wishesContainer = document.getElementById("wishes-container");
const wishButton = document.getElementById("wishButton");

document.getElementById("poster").addEventListener("click", () => {
    addHeart(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    db.ref("hearts").push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight });
});

wishButton.addEventListener("click", () => {
    const userWish = prompt("Enter your name and wish:");
    if (userWish) {
        const wish = { text: userWish, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
        db.ref("wishes").push(wish);
        displayWish(wish);
    }
});

db.ref("hearts").on("child_added", (data) => {
    const heart = data.val();
    addHeart(heart.x, heart.y);
});

db.ref("wishes").on("child_added", (data) => {
    displayWish(data.val(), data.key);
});

function addHeart(x, y) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.innerText = "❤️";
    heartsContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 3000);
}

function displayWish(wish, key) {
    const wishDiv = document.createElement("div");
    wishDiv.className = "wish";
    wishDiv.style.left = `${wish.x}px`;
    wishDiv.style.top = `${wish.y}px`;
    wishDiv.innerText = wish.text;
    wishDiv.addEventListener("click", () => {
        const confirmDelete = confirm("Delete this wish?");
        if (confirmDelete) db.ref("wishes").child(key).remove();
    });
    wishesContainer.appendChild(wishDiv);
    setTimeout(() => wishDiv.remove(), 5000);
}

db.ref("wishes").on("child_removed", (data) => {
    const wishElements = document.querySelectorAll(`.wish`);
    wishElements.forEach((el) => {
        if (el.innerText === data.val().text) el.remove();
    });
});
