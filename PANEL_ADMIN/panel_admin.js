const express = require('express');
const app = express();

const API_BASE_URL = 'http://localhost:3000';
const PORT = 3002;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
  <body>
    <h2>Admin Login</h2>
    <input id="username" type="text" placeholder="Username" />
    <input id="password" type="password" placeholder="Password" />
    <button onclick="login()">Login</button>
    <div id="error" style="color:red"></div>
    <div id="admin-status"></div>

    <div id="admin-section" style="display:none;">
      <h3>Search</h3>
      <input id="searchInput" type="text" placeholder="Search users, groups, messages" />
      <button id="searchBtn">Search</button>
      <div id="search-results"></div>

      <h3>Utilisateurs</h3>
      <ul id="users"></ul>
      <button id="load-more-users">Charger plus</button>

      <h3>Salons</h3>
      <ul id="groups"></ul>
      <button id="load-more-groups">Charger plus</button>

      <h3>Messages</h3>
      <ul id="messages"></ul>
      <button id="load-more-messages">Charger plus</button>
    </div>

    <script>
      const API_BASE_URL = "${API_BASE_URL}";
      let usersOffset = 0, groupsOffset = 0, messagesOffset = 0;
      const limit = 10;

      async function loadList(endpoint, listId, offset) {
        try {
          const res = await fetch(\`\${API_BASE_URL}/\${endpoint}?limit=\${limit}&offset=\${offset}\`);
          if (!res.ok) throw new Error("Erreur API");
          const json = await res.json();
          const items = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
          const ul = document.getElementById(listId);
          items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = JSON.stringify(item);
            const btn = document.createElement("button");
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
              await fetch(\`\${API_BASE_URL}/\${endpoint}/\${item.id}\`, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
        } catch (err) {
          console.error("Erreur loadList:", err);
        }
      }

      function clearLists() {
        document.getElementById("users").innerHTML = "";
        document.getElementById("groups").innerHTML = "";
        document.getElementById("messages").innerHTML = "";
      }

      function resetLists() {
        clearLists();
        usersOffset = 0;
        groupsOffset = 0;
        messagesOffset = 0;
      }

      document.getElementById("load-more-users").onclick = () => {
        loadList("users", "users", usersOffset);
        usersOffset += limit;
      };
      document.getElementById("load-more-groups").onclick = () => {
        loadList("groups", "groups", groupsOffset);
        groupsOffset += limit;
      };
      document.getElementById("load-more-messages").onclick = () => {
        loadList("messages", "messages", messagesOffset);
        messagesOffset += limit;
      };

      document.getElementById("searchBtn").onclick = async () => {
        const q = document.getElementById("searchInput").value.trim();
        const resultsDiv = document.getElementById("search-results");
        resultsDiv.innerHTML = "<h4>Résultats de recherche</h4>";
        if (!q) return;
        try {
          const res = await fetch(\`\${API_BASE_URL}/search/\${encodeURIComponent(q)}\`);
          if (!res.ok) throw new Error("Erreur API");
          const json = await res.json();
          const ul = document.createElement("ul");
          json.users.forEach(u => {
            const li = document.createElement("li");
            li.textContent = "USER: " + JSON.stringify(u);
            const btn = document.createElement("button");
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
              await fetch(\`\${API_BASE_URL}/users/\${u.id}\`, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
          json.groups.forEach(g => {
            const li = document.createElement("li");
            li.textContent = "GROUP: " + JSON.stringify(g);
            const btn = document.createElement("button");
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
              await fetch(\`\${API_BASE_URL}/groups/\${g.id}\`, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
          json.messages.forEach(m => {
            const li = document.createElement("li");
            li.textContent = "MSG: " + JSON.stringify(m);
            const btn = document.createElement("button");
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
              await fetch(\`\${API_BASE_URL}/messages/\${m.id}\`, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
          resultsDiv.appendChild(ul);
        } catch (err) {
          resultsDiv.innerHTML += "<p style='color:red;'>Erreur de recherche</p>";
        }
      };

      window.login = async function () {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error');
        const statusDiv = document.getElementById('admin-status');
        const section = document.getElementById('admin-section');
        try {
          const res = await fetch(\`\${API_BASE_URL}/users/login\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          if (!res.ok) throw new Error("Échec de la connexion : identifiants invalides");
          const loggedUser = await res.json();
          if (loggedUser.role !== "admin") {
            statusDiv.textContent = "NOT ADMIN";
            statusDiv.style.color = "red";
            section.style.display = "none";
            clearLists();
            throw new Error("Accès refusé : vous n'êtes pas admin");
          }
          statusDiv.textContent = "USER IS ADMIN";
          statusDiv.style.color = "green";
          errorDiv.textContent = "";
          section.style.display = "block";
          resetLists();
          document.getElementById("load-more-users").click();
          document.getElementById("load-more-groups").click();
          document.getElementById("load-more-messages").click();
        } catch (err) {
          errorDiv.textContent = err.message || "Erreur inconnue";
          if (statusDiv.textContent !== "USER IS ADMIN") {
            section.style.display = "none";
            clearLists();
          }
        }
      };
    </script>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Admin Panel is running at: http://localhost:\${PORT}`);
});
