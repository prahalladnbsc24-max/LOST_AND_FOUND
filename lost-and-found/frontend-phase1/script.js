
// ==========================================
// LOST AND FOUND - FRONTEND BACKEND CONNECTION
// ==========================================

const API_URL = "http://localhost:5000/api/items";

// HTML Elements
const itemForm = document.getElementById("itemForm");
const formMessage = document.getElementById("formMessage");
const itemsContainer = document.getElementById("itemsContainer");
const searchBox = document.getElementById("searchBox");
const filterType = document.getElementById("filterType");

// ==========================================
// LOAD ITEMS WHEN PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  if (itemForm) {
    itemForm.addEventListener("submit", handleSubmit);
  }

  if (searchBox) {
    searchBox.addEventListener("input", loadItems);
  }

  if (filterType) {
    filterType.addEventListener("change", loadItems);
  }

  if (itemsContainer) {
    itemsContainer.addEventListener("click", handleItemActions);
  }

  loadItems();
});

// ==========================================
// SUBMIT LOST OR FOUND ITEM
// ==========================================

async function handleSubmit(e) {
  e.preventDefault();

  const newItem = {
    type: document.getElementById("type").value,
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    location: document.getElementById("location").value.trim(),
    contact: document.getElementById("contact").value.trim()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newItem)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to submit report");
    }

    showMessage("Report submitted successfully!", "green");

    itemForm.reset();

    await loadItems();

  } catch (error) {
    console.error("Submit error:", error);
    showMessage(error.message || "Something went wrong.", "red");
  }
}

// ==========================================
// DISPLAY FORM MESSAGE
// ==========================================

function showMessage(message, color) {
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.style.color = color;
}

// ==========================================
// FETCH ITEMS FROM BACKEND
// ==========================================

async function loadItems() {
  if (!itemsContainer) return;

  const search = searchBox?.value.trim() || "";
  const type = filterType?.value || "all";

  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (type && type !== "all") params.append("type", type);

  try {
    const res = await fetch(`${API_URL}?${params.toString()}`);

    if (!res.ok) {
      throw new Error("Unable to fetch items");
    }

    const items = await res.json();

    renderItems(items);

  } catch (error) {
    console.error("Loading error:", error);

    itemsContainer.innerHTML =
      "<p>Could not load items. Please check your backend server.</p>";
  }
}

// ==========================================
// DISPLAY ITEM CARDS
// ==========================================

function renderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    itemsContainer.innerHTML = "<p>No items found.</p>";
    return;
  }

  itemsContainer.innerHTML = items.map(item => {
    const dateStr = new Date(item.date).toLocaleDateString();

    return `
      <div class="item-card ${escapeHTML(item.type)} ${item.resolved ? "resolved" : ""}">

        <span class="badge">${escapeHTML(item.type)}</span>

        <h3>${escapeHTML(item.title)}</h3>

        <p>${escapeHTML(item.description)}</p>

        <p><strong>Location:</strong> ${escapeHTML(item.location)}</p>

        <p><strong>Contact:</strong> ${escapeHTML(item.contact)}</p>

        <div class="meta">
          Posted on ${escapeHTML(dateStr)}
        </div>

        <div class="actions">

          ${
            !item.resolved
              ? `<button class="resolve-btn" data-action="resolve" data-id="${escapeHTML(item.id)}">
                   Mark Resolved
                 </button>`
              : "<span>Resolved</span>"
          }

          <button class="delete-btn" data-action="delete" data-id="${escapeHTML(item.id)}">
            Delete
          </button>

        </div>

      </div>
    `;
  }).join("");
}

// ==========================================
// HANDLE RESOLVE AND DELETE BUTTONS
// ==========================================

async function handleItemActions(e) {
  const button = e.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "resolve") {
    await resolveItem(id);
  }

  if (action === "delete") {
    await deleteItem(id);
  }
}

// ==========================================
// MARK ITEM AS RESOLVED
// ==========================================

async function resolveItem(id) {
  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(id)}/resolve`, {
      method: "PATCH"
    });

    if (!res.ok) {
      throw new Error("Could not resolve item");
    }

    alert("Item marked as resolved!");

    await loadItems();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ==========================================
// DELETE ITEM
// ==========================================

async function deleteItem(id) {
  const confirmDelete = confirm("Are you sure you want to delete this report?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Could not delete item");
    }

    alert("Report deleted successfully!");

    await loadItems();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ==========================================
// ESCAPE HTML TO PREVENT HTML INJECTION
// ==========================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
