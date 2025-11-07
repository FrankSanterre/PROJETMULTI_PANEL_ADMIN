const express = require('express');
const app = express();

const API_BASE_URL = 'https://bobberchat.com';
const PORT = 3002;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      input {
        padding: 8px;
        margin: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      button {
        padding: 8px 16px;
        margin: 5px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background-color: #0056b3;
      }
      ul {
        list-style: none;
        padding: 0;
      }
      li {
        padding: 10px;
        margin: 5px 0;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      li button {
        background-color: #dc3545;
        padding: 4px 12px;
        font-size: 12px;
      }
      li button:hover {
        background-color: #c82333;
      }
      .section-title {
        margin-top: 20px;
        color: #333;
      }
    </style>
  </head>
  <body>
    <h2>Admin Login</h2>
    <input id="username" type="text" placeholder="Username" />
    <input id="password" type="password" placeholder="Password" />
    <button onclick="login()">Login</button>
    <div id="error" style="color:red"></div>
    <div id="admin-status"></div>

    <div id="admin-section" style="display:none;">
      <button onclick="logout()">Logout</button>
      
      <h3>Search</h3>
      <input id="searchInput" type="text" placeholder="Search users, groups, messages" />
      <button id="searchBtn">Search</button>
      <div id="search-results"></div>

      <h3>Utilisateurs</h3>
      <ul id="users"></ul>
      <button id="load-more-users">Charger plus</button>

      <h3 class="section-title">Salons Privés</h3>
      <ul id="private-groups"></ul>
      <button id="load-more-private-groups">Charger plus</button>

      <h3 class="section-title">Salons Publics</h3>
      <ul id="public-groups"></ul>
      <button id="load-more-public-groups">Charger plus</button>

      <h3>Messages</h3>
      <ul id="messages"></ul>
      <button id="load-more-messages">Charger plus</button>
    </div>

    <script>
      const API_BASE_URL = "${API_BASE_URL}";
      let usersOffset = 0, messagesOffset = 0;
      let lastPrivateGroupId = null, lastPublicGroupId = null;
      const limit = 10;
      let accessToken = null;
      
      function getAuthHeaders() {
        return {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? 'Bearer ' + accessToken : ''
        };
      }

      async function refreshAccessToken() {
        try {
          const res = await fetch(API_BASE_URL + '/auth/refresh', {
            method: 'POST',
            credentials: 'include' 
          });
          if (!res.ok) throw new Error("Token refresh failed");
          const data = await res.json();
          accessToken = data.accessToken;
          return true;
        } catch (err) {
          console.error("Erreur refresh token:", err);
          handleLogout();
          return false;
        }
      }
      
      async function authenticatedFetch(url, options = {}) {
        options.headers = getAuthHeaders();
        options.credentials = 'include';
        
        let res = await fetch(url, options);
        if (res.status === 401 || res.status === 403) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            options.headers = getAuthHeaders();
            res = await fetch(url, options);
          }
        }
        
        return res;
      }

      async function loadList(endpoint, listId, offset) {
        try {
          const res = await authenticatedFetch(API_BASE_URL + '/api/' + endpoint + '?limit=' + limit + '&offset=' + offset);
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
              await authenticatedFetch(API_BASE_URL + '/' + endpoint + '/' + item.id, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
        } catch (err) {
          console.error("Erreur loadList:", err);
        }
      }

      async function loadGroupsByType(type, listId, lastId) {
        try {
          const url = lastId 
            ? API_BASE_URL + '/api/groups/next/' + type + '/' + lastId
            : API_BASE_URL + '/api/groups/next/' + type + '/0';
          
          const res = await authenticatedFetch(url);
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
              await authenticatedFetch(API_BASE_URL + '/api/groups/' + item.id, { method: "DELETE" });
              li.remove();
            };
            li.appendChild(btn);
            ul.appendChild(li);
          });
          
          // Mettre à jour le dernier ID
          if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (type === 'private') {
              lastPrivateGroupId = lastItem.id;
            } else {
              lastPublicGroupId = lastItem.id;
            }
          }
        } catch (err) {
          console.error("Erreur loadGroupsByType:", err);
        }
      }

      function clearLists() {
        document.getElementById("users").innerHTML = "";
        document.getElementById("private-groups").innerHTML = "";
        document.getElementById("public-groups").innerHTML = "";
        document.getElementById("messages").innerHTML = "";
      }

      function resetLists() {
        clearLists();
        usersOffset = 0;
        messagesOffset = 0;
        lastPrivateGroupId = null;
        lastPublicGroupId = null;
      }

      function handleLogout() {
        accessToken = null;
        document.getElementById('admin-section').style.display = 'none';
        document.getElementById('admin-status').textContent = '';
        clearLists();
        alert("Session expirée. Veuillez vous reconnecter.");
      }

      document.getElementById("load-more-users").onclick = () => {
        loadList("users", "users", usersOffset);
        usersOffset += limit;
      };
      
      document.getElementById("load-more-private-groups").onclick = () => {
        loadGroupsByType("private", "private-groups", lastPrivateGroupId);
      };
      
      document.getElementById("load-more-public-groups").onclick = () => {
        loadGroupsByType("public", "public-groups", lastPublicGroupId);
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
          const res = await authenticatedFetch(API_BASE_URL + '/api/search/' + encodeURIComponent(q));
          if (!res.ok) throw new Error("Erreur API");
          const json = await res.json();
          const ul = document.createElement("ul");
          json.users.forEach(u => {
            const li = document.createElement("li");
            li.textContent = "USER: " + JSON.stringify(u);
            const btn = document.createElement("button");
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
              await authenticatedFetch(API_BASE_URL + '/api/users/' + u.id, { method: "DELETE" });
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
              await authenticatedFetch(API_BASE_URL + '/api/groups/' + g.id, { method: "DELETE" });
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
              await authenticatedFetch(API_BASE_URL + '/api/messages/' + m.id, { method: "DELETE" });
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
          const res = await fetch(API_BASE_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
          });
          if (!res.ok) throw new Error("Échec de la connexion : identifiants invalides");
          const data = await res.json();
          
          accessToken = data.accessToken;
          
          if (data.user.role !== "admin") {
            statusDiv.textContent = "NOT ADMIN";
            statusDiv.style.color = "red";
            section.style.display = "none";
            clearLists();
            accessToken = null;
            throw new Error("Accès refusé : vous n'êtes pas admin");
          }
          
          statusDiv.textContent = "USER IS ADMIN";
          statusDiv.style.color = "green";
          errorDiv.textContent = "";
          section.style.display = "block";
          resetLists();
          document.getElementById("load-more-users").click();
          document.getElementById("load-more-private-groups").click();
          document.getElementById("load-more-public-groups").click();
          document.getElementById("load-more-messages").click();
        } catch (err) {
          errorDiv.textContent = err.message || "Erreur inconnue";
          if (statusDiv.textContent !== "USER IS ADMIN") {
            section.style.display = "none";
            clearLists();
          }
        }
      };

      window.logout = async function () {
        try {
          await fetch(API_BASE_URL + '/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (err) {
          console.error("Erreur logout:", err);
        }
        handleLogout();
      };
    </script>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Admin Panel is running at: http://localhost:${PORT}`);
});