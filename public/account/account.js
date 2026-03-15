import {
  getAuth,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
  linkWithPopup,
  GoogleAuthProvider,
  unlink
} from "firebase/auth";

const auth = getAuth();

// Change password
document.getElementById("change-password").addEventListener("click", async () => {
  const user = auth.currentUser;

  const current = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;
  const errorBox = document.getElementById("password-error");

  errorBox.textContent = "";

  if (newPass !== confirm) {
    errorBox.textContent = "Passwords don't match";
    return;
  }

  try {
    // Re-authenticate
    const credential = EmailAuthProvider.credential(user.email, current);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPass);

    alert("Password changed successfully!");
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Incorrect current password";
  }
});
