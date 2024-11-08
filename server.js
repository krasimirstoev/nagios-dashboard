const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const fs = require('fs');
const config = require('./config');

const app = express();
const port = 3000;

app.use(express.static('public'));

let warnings = [];
let criticals = [];
let exclusions = [];
let ignoreStrings = [];
let lastCheckTime = null;

// Function to load exclusions from the exclude.txt file
const loadExclusions = () => {
    exclusions = [];
    ignoreStrings = [];
    const lines = fs.readFileSync(config.excludeFilePath, 'utf-8').split('\n');
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#') || line === '') {
            return; // Skip comments and empty lines
        }

        const [type, value] = line.split(':').map(item => item.trim());
        if (type === 'ignore') {
            ignoreStrings.push(value); // Add strings to ignore
        } else if (value) {
            exclusions.push({ service: type, host: value });
        }
    });
};

// Load exclusions when the server starts
loadExclusions();

// Watch the exclude.txt file for changes and reload exclusions if it changes
fs.watchFile(config.excludeFilePath, () => {
    console.log('Reloading exclusions');
    loadExclusions();
});

// Function to parse the duration and convert it to days
const parseDurationToDays = (duration) => {
    const durationMatch = duration.match(/(\d+)d\s+(\d+)h\s+(\d+)m/);
    let totalDays = 0;
    if (durationMatch) {
        const days = parseInt(durationMatch[1], 10);
        const hours = parseInt(durationMatch[2], 10);
        const minutes = parseInt(durationMatch[3], 10);
        totalDays = days + (hours / 24) + (minutes / 1440);
    }
    return totalDays;
};

// Function to parse the HTML data from Nagios and extract required fields
const parseNagiosData = (html) => {
    const $ = cheerio.load(html);
    const parsedData = {
        warnings: [],
        criticals: []
    };

    $('tr').each((index, element) => {
        // Check if any of the ignore strings are present in the HTML for this row
        const elementHtml = $(element).html();
        if (ignoreStrings.some(str => elementHtml.includes(str))) {
            return; // Skip this row if any ignore string is found
        }

        const statusCell = $(element).find('td.statusCRITICAL, td.statusWARNING');
        const hostAndServiceCell = $(element).find('td.statusBGCRITICAL a, td.statusBGWARNING a');
        const dateCell = $(element).find('td.statusBGCRITICAL[nowrap], td.statusBGWARNING[nowrap]').eq(0); // Last Check date
        const durationCell = $(element).find('td.statusBGCRITICAL[nowrap], td.statusBGWARNING[nowrap]').eq(1); // Duration
        
        // Attempt cell: we find the last td before the description that contains a "/"
        let attempt = '';
        $(element).find('td.statusBGCRITICAL, td.statusBGWARNING').each((i, cell) => {
            const cellText = $(cell).text().trim();
            if (cellText.includes('/') && !cellText.includes(' ')) { // check if cell has "/"
                attempt = cellText;
            }
        });

        const descriptionCell = $(element).find('td.statusBGCRITICAL[valign="center"], td.statusBGWARNING[valign="center"]').last();
        const description = descriptionCell.text().trim();

        if (statusCell.length > 0 && hostAndServiceCell.length > 0) {
            const state = statusCell.text().trim();
            const statusClass = statusCell.hasClass('statusCRITICAL') ? 'critical' : 'warning';
            const host = hostAndServiceCell.attr('href').match(/host=([^&]+)/)[1];
            const service = decodeURIComponent(hostAndServiceCell.attr('href').match(/service=([^&]+)/)[1]).replace(/\+/g, ' '); // Decode and replace "+" with spaces
            const date = dateCell.text().trim();
            const durationText = durationCell.text().trim();
            const durationDays = parseDurationToDays(durationText);

            // Filter based on max_duration from config in days
            if (durationDays > config.max_duration) {
                return; // Skip this row if duration exceeds max_duration in days
            }

            const serviceData = {
                host,
                service,
                state,
                date,
                duration: durationText,
                attempt,
                description,
                statusClass
            };

            if (statusClass === 'critical') {
                parsedData.criticals.push(serviceData);
            } else if (statusClass === 'warning') {
                parsedData.warnings.push(serviceData);
            }
        }
    });

    return parsedData;
};

// Function to apply exclusions from the loaded exclusion list
const applyExclusions = () => {
    warnings = warnings.filter(w => !exclusions.some(e => e.service === '*' && e.host === w.host || e.service === w.service && e.host === w.host));
    criticals = criticals.filter(c => !exclusions.some(e => e.service === '*' && e.host === c.host || e.service === c.service && e.host === c.host));
};

// Function to fetch data from the Nagios server
const fetchNagiosData = async () => {
    try {
        const response = await axios.get(config.nagiosUrl, {
            auth: {
                username: config.auth.username,
                password: config.auth.password
            }
        });
        const data = response.data;

        // Parse the HTML data to extract warnings and criticals
        const parsedData = parseNagiosData(data);
        warnings = parsedData.warnings;
        criticals = parsedData.criticals;

        // Apply exclusions to filter out unwanted services/hosts
        applyExclusions();

        // Update the last check time
        lastCheckTime = moment().tz("Europe/Sofia").format('HH:mm:ss');
    } catch (error) {
        console.error('Error fetching data from Nagios:', error);
    }
};

// Fetch data from Nagios at regular intervals specified in the config
setInterval(fetchNagiosData, config.refresh_interval * 1000);

// Endpoint to provide status data to the frontend
app.get('/status', (req, res) => {
    res.json({ warnings, criticals, lastCheckTime });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
