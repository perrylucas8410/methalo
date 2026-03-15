import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const auth = getAuth();

document.getElementById("reset-button").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value;

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");
  } catch (err) {
    console.error(err);
    alert("Error sending reset email.");
  }
});
