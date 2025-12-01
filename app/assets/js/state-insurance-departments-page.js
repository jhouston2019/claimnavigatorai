// /app/assets/js/state-insurance-departments-page.js

(function () {
  const tableBody = document.getElementById("state-department-table-body");
  const emptyState = document.getElementById("state-department-empty");
  const searchInput = document.getElementById("department-search");

  if (!tableBody || !window.STATE_INSURANCE_DEPARTMENTS) return;

  function normalize(str) {
    return (str || "").toString().toLowerCase();
  }

  function renderRows(rows) {
    tableBody.innerHTML = "";

    if (!rows.length) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    rows.forEach((entry) => {
      const tr = document.createElement("tr");

      const stateTd = document.createElement("td");
      stateTd.textContent = entry.state || "";
      tr.appendChild(stateTd);

      const deptTd = document.createElement("td");
      deptTd.textContent = entry.departmentName || "";
      tr.appendChild(deptTd);

      const roleTd = document.createElement("td");
      roleTd.textContent = entry.primaryRole || "";
      tr.appendChild(roleTd);

      const websiteTd = document.createElement("td");
      if (entry.website) {
        const link = document.createElement("a");
        link.href = entry.website;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Visit site";
        websiteTd.appendChild(link);
      } else {
        websiteTd.textContent = "";
      }
      tr.appendChild(websiteTd);

      const phoneTd = document.createElement("td");
      phoneTd.textContent = entry.phone || "";
      tr.appendChild(phoneTd);

      tableBody.appendChild(tr);
    });
  }

  function applyFilter() {
    const query = normalize(searchInput ? searchInput.value : "");

    if (!query) {
      renderRows(window.STATE_INSURANCE_DEPARTMENTS);
      return;
    }

    const filtered = window.STATE_INSURANCE_DEPARTMENTS.filter((entry) => {
      const haystack = [
        entry.state,
        entry.departmentName,
        entry.primaryRole,
        entry.website,
        entry.phone
      ]
        .map(normalize)
        .join(" ");

      return haystack.includes(query);
    });

    renderRows(filtered);
  }

  // Initial render
  renderRows(window.STATE_INSURANCE_DEPARTMENTS);

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }
})();




