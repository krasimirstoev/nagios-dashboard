setInterval(() => {
    fetch('/status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data:", data);
            const activeCount = data.warnings.length + data.criticals.length;
            const totalCriticals = data.criticals.length;
            const lastCheck = data.lastCheckTime;

            document.getElementById('active-count').innerText = `Active Warnings/Criticals: ${activeCount}`;
            document.getElementById('total-criticals').innerText = `Total Criticals in last 60 minutes: ${totalCriticals}`;
            document.getElementById('last-check').innerText = `Last check: ${lastCheck}`;
            document.getElementById('time').innerText = moment().tz("Europe/Sofia").format('HH:mm:ss');

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
}, 5000);
