// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBinhf3-PpbAeQaQKToNnLHBBBxVQeLbp4",
    authDomain: "yayy-93c45.firebaseapp.com",
    databaseURL: "https://yayy-93c45.firebaseio.com",
    projectId: "yayy-93c45",
    storageBucket: "yayy-93c45.appspot.com",
    messagingSenderId: "281901593072",
    appId: "1:281901593072:web:614dff92e64d25669c6d35",
    measurementId: "G-JB3PWXQ56M"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Event listener for showing the wish form popup
document.getElementById("wishButton").addEventListener("click", () => {
    console.log("Wish button clicked"); // Debug log
    document.getElementById("wishFormContainer").style.display = "flex";
});

// Event listener for closing the wish form popup
document.getElementById("closeFormButton").addEventListener("click", () => {
    console.log("Close button clicked"); // Debug log
    document.getElementById("wishFormContainer").style.display = "none";
});

// Event listener for submitting a wish
document.getElementById("submitWishButton").addEventListener("click", () => {
    console.log("Submit button clicked"); // Debug log
    const name = document.getElementById("nameInput").value;
    const wish = document.getElementById("wishInput").value;

    if (name && wish) {
        const wishData = {
            name,
            text: wish,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
        };

        // Save wish to Firebase
        db.ref("wishes").push(wishData)
            .then(() => {
                console.log("Wish submitted to Firebase"); // Debug log
                displayWish(wishData); // Display the wish on the screen
                document.getElementById("wishFormContainer").style.display = "none"; // Hide form
            })
            .catch(error => {
                console.error("Error submitting wish:", error);
            });
    } else {
        alert("Please enter both your name and your wish.");
    }
});

// Function to display the wish on the screen
function displayWish(wishData) {
    const wishContainer = document.getElementById("wishes-container");
    const wishElement = document.createElement("div");
    wishElement.className = "wish";
    wishElement.style.top = `${wishData.y}px`;
    wishElement.style.left = `${wishData.x}px`;
    wishElement.innerText = `${wishData.name}: ${wishData.text}`;
    wishContainer.appendChild(wishElement);
}
