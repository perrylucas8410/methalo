const auth = firebase.auth();

document.getElementById("reset-button").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value;

  try {
    await auth.sendPasswordResetEmail(email);
    alert("Password reset email sent!");
  } catch (err) {
    console.error(err);
    alert("Error sending reset email.");
  }
});
