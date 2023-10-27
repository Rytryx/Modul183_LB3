document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorText = document.getElementById("error");

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler bei der Anmeldung.");
      }

      const data = await response.json();

      if (data?.token) {
        localStorage.setItem("user", JSON.stringify(data));
        fetch("/api/protected-endpoint", {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });
        window.location.href = "/";
      } else {
        errorText.innerText = "Ungültige Anmeldeinformationen.";
      }
    } catch (error) {
      console.error("Fehler bei der Anmeldung:", error.message);
      errorText.innerText = "Ein unerwarteter Fehler ist aufgetreten.";
    }
  });
});
