// Initialize Firebase using your global config
firebase.initializeApp(window.firebaseConfig);

const auth = firebase.auth();

document.getElementById("reset-button").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value;

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    alert("A password reset email has been sent!");
  } catch (err) {
    console.error(err);
    alert("Error sending reset email: " + err.message);
  }
});
