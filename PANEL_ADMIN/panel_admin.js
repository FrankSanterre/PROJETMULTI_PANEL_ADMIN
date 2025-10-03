const express = require('express');
const path = require('path');
const app = express();

const API_BASE_URL = 'http://localhost:3000'; 
const PORT = 3002;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
     <body>
  <h2>Admin Login</h2>
  <input id="username" type="text" placeholder="Username" />
  <input id="password" type="password" placeholder="Password" />
  <button onclick="login()">Login</button>
  <div id="error" style="color:red"></div>
  <div id="admin-status"></div>

<script>
  async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('${API_BASE_URL}/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error("Échec de la connexion : identifiants invalides");
      }

      const loggedUser = await res.json();

      if (loggedUser.role !== "admin") {
        document.getElementById('admin-status').innerHTML = '<span style="color: red;"> NOT ADMIN</span>';
        throw new Error("Accès refusé : Vous n'êtes pas admin");
      }

      document.getElementById('admin-status').innerHTML = '<span style="color: green;">USER IS ADMIN</span>';
      localStorage.setItem('adminToken', JSON.stringify(loggedUser));
      window.location.reload();

    } catch (err) {
      // Show clear error message and reset admin status
      document.getElementById('error').innerText = err.message || "Erreur inconnue";
      document.getElementById('admin-status').innerHTML = '<span style="color: red;">NOT ADMIN</span>';
    }
  }

  window.onload = () => {
    const user = JSON.parse(localStorage.getItem('adminToken') || 'null');
    if (user && user.role === "admin") {
      document.getElementById('admin-status').innerHTML = '<span style="color: green;"> USER IS ADMIN</span>';
      load(); // optional, only if you have defined load()
    } else {
      document.getElementById('admin-status').innerHTML = '<span style="color: red;"> NOT ADMIN</span>';
    }
  };
</script>

</body>

    </html>
  `);
});

app.listen(PORT, () => {
  console.log(` Admin Panel is running at: http://localhost:${PORT}`);
});
