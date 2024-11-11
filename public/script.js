// Function to update live time in the header
const updateCurrentTime = () => {
    document.getElementById('current-time').innerText = moment().tz("Europe/Sofia").format('HH:mm:ss');
};

// Set up an interval to update the current time every second
setInterval(updateCurrentTime, 1000);

// Function to update the data in the dashboard
const updateData = () => {
    fetch('/status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data:", data); // Log data to the browser console
            const activeCount = data.warnings.length + data.criticals.length;
            const totalCriticals = data.criticals.length;
            const lastCheck = data.lastCheckTime;

            // Update header info
            document.getElementById('active-count').innerText = `Active Warnings/Criticals: ${activeCount}`;
            document.getElementById('total-criticals').innerText = `Total Criticals in last 60 minutes: ${totalCriticals}`;
            document.getElementById('last-check').innerText = `Last check: ${lastCheck}`;

            const alertsTableBody = document.getElementById('alerts-table').querySelector('tbody');
            alertsTableBody.innerHTML = ''; 

            const renderRow = (item, statusClass) => {
                const row = document.createElement('tr');
                row.className = statusClass;
                row.innerHTML = ` 
                    <td>${item.host}</td>
                    <td>${item.service}</td>
                    <td>${item.state}</td>
                    <td>${item.date}</td>
                    <td>${item.duration}</td>
                    <td>${item.attempt}</td>
                    <td>${item.description}</td>
                `;
                alertsTableBody.appendChild(row);
            };

            data.criticals.forEach(critical => renderRow(critical, 'critical'));
            data.warnings.forEach(warning => renderRow(warning, 'warning'));
        })
        .catch(error => {
            console.error('Error fetching status:', error);
        });
};

// Set up an interval to refresh data every 5 seconds
setInterval(updateData, 5000);

// Initial data fetch and current time update
updateData();
updateCurrentTime();

// Function to fetch and display exclude list content in modal
document.getElementById("exclude-btn").addEventListener("click", async () => {
    console.log("Exclude button clicked"); // Debugging line
    const excludeModal = document.getElementById("exclude-modal");
    excludeModal.style.display = "flex"; // Show the modal
    
    try {
        const response = await fetch('/get-exclude');
        const text = await response.text();
        document.getElementById("exclude-content").textContent = text; // Display plain text in <pre>
    } catch (error) {
        document.getElementById("exclude-content").textContent = "Error loading exclude list.";
        console.error('Error fetching exclude list:', error);
    }
});

// Close modal when the close button is clicked
document.querySelector(".close").onclick = function() {
    console.log("Close button clicked"); // Debugging line
    document.getElementById("exclude-modal").style.display = "none";
};

// Close modal when clicking outside the modal content
window.onclick = function(event) {
    const excludeModal = document.getElementById("exclude-modal");
    if (event.target === excludeModal) {
        console.log("Clicked outside modal"); // Debugging line
        excludeModal.style.display = "none";
    }
};
