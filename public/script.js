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
            document.getElementById('current-time').innerText = moment().tz("Europe/Sofia").format('HH:mm:ss');

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

// Refresh button functionality to reload data immediately
document.getElementById("refresh-btn").addEventListener("click", updateData);

// Exclude List modal functionality
const excludeBtn = document.getElementById("exclude-btn");
const excludeModal = document.getElementById("exclude-modal");
const closeBtn = document.querySelector(".close");
const excludeContent = document.getElementById("exclude-content");

// Fetch and display the exclude list content in the modal
document.getElementById("exclude-btn").addEventListener("click", async () => {
    const excludeModal = document.getElementById("exclude-modal");
    excludeModal.style.display = "flex";
    
    try {
        const response = await fetch('/get-exclude');
        const text = await response.text();
        document.getElementById("exclude-content").textContent = text; // Display plain text in <pre> element
    } catch (error) {
        document.getElementById("exclude-content").textContent = "Error loading exclude list.";
    }
});

// Close modal functionality
document.querySelector(".close").onclick = function() {
    document.getElementById("exclude-modal").style.display = "none";
};

// Close modal when clicking outside the content
window.onclick = function(event) {
    const excludeModal = document.getElementById("exclude-modal");
    if (event.target === excludeModal) {
        excludeModal.style.display = "none";
    }
};

// Initial data fetch
updateData();
