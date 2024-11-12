const db = firebase.database();
const heartsContainer = document.getElementById("hearts-container");
const wishesContainer = document.getElementById("wishes-container");
const wishButton = document.getElementById("wishButton");
const wishFormContainer = document.createElement("div");
wishFormContainer.className = "wish-form-container";
wishFormContainer.innerHTML = `
    <div class="wish-form">
        <h2>Send a Wish</h2>
        <input id="nameInput" type="text" placeholder="Your Name" required>
        <input id="wishInput" type="text" placeholder="Your Wish" required>
        <button id="submitWishButton">Submit</button>
        <button id="closeFormButton">Close</button>
    </div>
`;
document.body.appendChild(wishFormContainer);

wishButton.addEventListener("click", () => {
    wishFormContainer.style.display = "flex";
});

document.getElementById("closeFormButton").addEventListener("click", () => {
    wishFormContainer.style.display = "none";
});

document.getElementById("submitWishButton").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value;
    const wish = document.getElementById("wishInput").value;

    if (name && wish) {
        const wishData = {
            text: `${name}: ${wish}`,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
        };
        db.ref("wishes").push(wishData);
        displayWish(wishData);
        wishFormContainer.style.display = "none";
    } else {
        alert("Please enter both your name and your wish.");
    }
});

document.getElementById("poster").addEventListener("click", (event) => {
    const x = event.clientX;
    const y = event.clientY;
    addHeart(x, y);
    db.ref("hearts").push({ x, y });
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
        if (confirm("Delete this wish?")) db.ref("wishes").child(key).remove();
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
