// Using Firebase compat (firebase-app.js + firebase-auth.js)
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Load user info
auth.onAuthStateChanged((user) => {
  if (!user) return;

  document.getElementById("account-email").textContent = user.email;
  document.getElementById("account-name").value = user.displayName || "";

  // Google link status
  const googleLinked = user.providerData.some(p => p.providerId === "google.com");
  document.getElementById("google-status").textContent =
    googleLinked ? "Google account linked" : "No Google account linked";
});

// Save display name
document.getElementById("save-name").addEventListener("click", async () => {
  const user = auth.currentUser;
  const newName = document.getElementById("account-name").value;

  await user.updateProfile({ displayName: newName });
  alert("Name updated!");
});

// Link Google
document.getElementById("link-google").addEventListener("click", async () => {
  const user = auth.currentUser;
  try {
    await user.linkWithPopup(provider);
    alert("Google account linked!");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Could not link Google account.");
  }
});

// Unlink Google
document.getElementById("unlink-google").addEventListener("click", async () => {
  const user = auth.currentUser;
  try {
    await user.unlink("google.com");
    alert("Google account unlinked!");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Could not unlink Google account.");
  }
});

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
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(newPass);
    alert("Password changed successfully!");
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Incorrect current password";
  }
});

// Forgot password
document.getElementById("forgot-password").addEventListener("click", () => {
  window.location.href = "/account/reset.html";
});
