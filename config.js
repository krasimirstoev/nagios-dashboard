const config = {
    nagiosUrl: 'https://your-nagios-host/nagios/cgi-bin/status.cgi?host=all&servicestatustypes=28',
    auth: {
        username: 'nagiosadmin',
        password: 'nagiospasswod'
    },
    excludeFilePath: './exclude.txt',
    refresh_interval: '5', // Refresh interval in seconds for fetching and displaying new data
    max_duration: '100'
};

module.exports = config;
