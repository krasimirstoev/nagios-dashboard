let alertsData = []; // Store fetched alerts for filtering

// Function to update live time in the header
const updateCurrentTime = () => {
    document.getElementById('current-time').innerText = moment().tz("Europe/Sofia").format('HH:mm:ss');
};

// Set up an interval to update the current time every second
setInterval(updateCurrentTime, 1000);

// Function to update the data in the dashboard
const updateData = () => {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            alertsData = [...data.criticals, ...data.warnings]; // Combine alerts
            populateHostFilter(); // Populate hosts dynamically
            applyFilters(); // Apply any active filters
            
            // Update header information
            const activeCount = data.warnings.length + data.criticals.length;
            const totalCriticals = data.criticals.length;
            const lastCheck = data.lastCheckTime;

            document.getElementById('active-count').innerText = `Active Warnings/Criticals: ${activeCount}`;
            document.getElementById('total-criticals').innerText = `Total Criticals in last 60 minutes: ${totalCriticals}`;
            document.getElementById('last-check').innerText = `Last check: ${lastCheck}`;
        })
        .catch(error => console.error('Error fetching status:', error));
};

// Populate host filter with unique hosts
const populateHostFilter = () => {
    const hostFilter = document.getElementById('host-filter');
    const uniqueHosts = [...new Set(alertsData.map(alert => alert.host))];
    hostFilter.innerHTML = `<option value="all">All</option>`;
    uniqueHosts.forEach(host => {
        const option = document.createElement('option');
        option.value = host;
        option.textContent = host;
        hostFilter.appendChild(option);
    });
};

// Apply filters based on selected severity and host
const applyFilters = () => {
    const severityFilter = document.getElementById('severity-filter').value;
    const hostFilter = document.getElementById('host-filter').value;

    let filteredAlerts = alertsData;
    if (severityFilter !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.statusClass === severityFilter);
    }
    if (hostFilter !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.host === hostFilter);
    }
    renderTable(filteredAlerts); // Display filtered alerts
};

// Render alerts table
const renderTable = (alerts) => {
    const alertsTableBody = document.getElementById('alerts-table').querySelector('tbody');
    alertsTableBody.innerHTML = ''; 
    alerts.forEach(alert => {
        const row = document.createElement('tr');
        row.className = alert.statusClass;
        row.innerHTML = `
            <td>${alert.host}</td>
            <td>${alert.service}</td>
            <td>${alert.state}</td>
            <td>${alert.date}</td>
            <td>${alert.duration}</td>
            <td>${alert.attempt}</td>
            <td>${alert.description}</td>
        `;
        alertsTableBody.appendChild(row);
    });
};

// Event listener for opening settings modal
document.getElementById("settings-btn").addEventListener("click", () => {
    document.getElementById("settings-modal").style.display = "flex";
});

// Event listener for closing the settings modal
document.querySelector(".close-settings").onclick = function() {
    document.getElementById("settings-modal").style.display = "none";
};

// Event listener for Apply button in Settings modal
document.getElementById("apply-settings-btn").addEventListener("click", () => {
    applyFilters(); // Apply the selected filters
    document.getElementById("settings-modal").style.display = "none"; // Close the modal
});

// Function to fetch and display exclude list content in modal
document.getElementById("exclude-btn").addEventListener("click", async () => {
    const excludeModal = document.getElementById("exclude-modal");
    excludeModal.style.display = "flex"; // Show the modal
    
    try {
        const response = await fetch('/get-exclude');
        const text = await response.text();
        document.getElementById("exclude-content").textContent = text;
    } catch (error) {
        document.getElementById("exclude-content").textContent = "Error loading exclude list.";
        console.error('Error fetching exclude list:', error);
    }
});

// Close modal when the close button for exclude list is clicked
document.querySelector(".close").onclick = function() {
    document.getElementById("exclude-modal").style.display = "none";
};

// Close modal when clicking outside the modal content
window.onclick = function(event) {
    const settingsModal = document.getElementById("settings-modal");
    const excludeModal = document.getElementById("exclude-modal");
    if (event.target === settingsModal || event.target === excludeModal) {
        settingsModal.style.display = "none";
        excludeModal.style.display = "none";
    }
};

// Set up an interval to refresh data every 5 seconds
setInterval(updateData, 5000);

// Initial data fetch and current time update
updateData();
updateCurrentTime();
