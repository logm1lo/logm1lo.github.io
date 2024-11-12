// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBinhf3-PpbAeQaQKToNnLHBBBxVQeLbp4",
    authDomain: "yayy-93c45.firebaseapp.com",
  databaseURL: "https://yayy-93c45-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "yayy-93c45",
    storageBucket: "yayy-93c45.appspot.com",
    messagingSenderId: "281901593072",
    appId: "1:281901593072:web:614dff92e64d25669c6d35",
    measurementId: "G-JB3PWXQ56M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get DOM elements
const heartsContainer = document.getElementById("hearts-container");
const poster = document.getElementById("poster");

// Function to create and display a heart
function createHeart(x, y) {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.innerText = "❤️";
    heartsContainer.appendChild(heart);
  return heart; // Return the heart element
}

// Function to add a heart locally on the screen and to Firebase
function addHeart(x, y) {
  const heart = createHeart(x, y); 

  // Remove the heart after 3 seconds
  setTimeout(() => heart.remove(), 3000);
    // Push the heart's coordinates to Firebase
    db.ref("hearts").push({ x, y })
        .then(() => console.log("Heart saved to Firebase"))
        .catch((error) => console.error("Error saving heart to Firebase:", error));
}

// Add event listener to the poster
poster.addEventListener("click", () => {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;

  console.log("Poster clicked. Adding heart and saving to Firebase.");
  addHeart(x, y); 
});

// Listen for hearts added in Firebase
db.ref("hearts").on("child_added", (data) => {
    const heart = data.val();
    console.log("Heart retrieved from Firebase:", heart);
  createHeart(heart.x, heart.y); // Use the createHeart function here too
});

// Remove the following code as it's not necessary
// // Check Firebase initialization
// console.log("Firebase initialized:", firebase.apps.length > 0);

// // Function to display a wish (this part seems unrelated)
// function displayWish(wishData) {
//     const wishContainer = document.getElementById("wishes-container");
//     const wishElement = document.createElement("div");
//     wishElement.className = "wish";
//     wishElement.style.top = `${wishData.y}px`;
//     wishElement.style.left = `${wishData.x}px`;
//     wishElement.innerText = `${wishData.name}: ${wishData.text}`;
//     wishContainer.appendChild(wishElement);
// }