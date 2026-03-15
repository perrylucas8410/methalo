firebase.initializeApp(window.firebaseConfig);

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Helper to set inline messages
function setMessage(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = text ? "message " + type : "message";
}

// PROTECT PAGE
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  // Load user info
  document.getElementById("account-email").textContent = user.email;
  document.getElementById("account-name").value = user.displayName || "";

  const googleLinked = user.providerData.some(p => p.providerId === "google.com");
  document.getElementById("google-status").textContent =
    googleLinked ? "Google account linked" : "No Google account linked";
});

// Save display name
document.getElementById("save-name").addEventListener("click", async () => {
  const user = auth.currentUser;
  const newName = document.getElementById("account-name").value;

  setMessage("name-message", "", "");
  try {
    await user.updateProfile({ displayName: newName });
    setMessage("name-message", "Name updated!", "success");
  } catch (err) {
    console.error(err);
    setMessage("name-message", err.message, "error");
  }
});

// Link Google
document.getElementById("link-google").addEventListener("click", async () => {
  const user = auth.currentUser;

  setMessage("google-message", "", "");
  try {
    await user.linkWithPopup(provider);
    setMessage("google-message", "Google account linked!", "success");
    location.reload();
  } catch (err) {
    console.error(err);
    setMessage("google-message", err.message, "error");
  }
});

// Unlink Google
document.getElementById("unlink-google").addEventListener("click", async () => {
  const user = auth.currentUser;

  setMessage("google-message", "", "");
  try {
    await user.unlink("google.com");
    setMessage("google-message", "Google account unlinked!", "success");
    location.reload();
  } catch (err) {
    console.error(err);
    setMessage("google-message", err.message, "error");
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
  setMessage("password-message", "", "");

  if (newPass !== confirm) {
    errorBox.textContent = "Passwords don't match";
    return;
  }

  try {
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(newPass);

    setMessage("password-message", "Password changed successfully!", "success");
  } catch (err) {
    console.error(err);
    setMessage("password-message", err.message, "error");
  }
});

// Forgot password
document.getElementById("forgot-password").addEventListener("click", () => {
  window.location.href = "/account/reset.html";
});

// Sign Out
document.getElementById("signout-button").addEventListener("click", async () => {
  setMessage("signout-message", "", "");
  try {
    await auth.signOut();
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
    setMessage("signout-message", err.message, "error");
  }
});
