module.exports = {
    apps: [{
        name: 'qcc-staking-frontend',
        script: 'npm',
        args: 'start',
        cwd: './', // Will use the current directory when starting
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000 // Default Next.js port, change if needed
        }
    }]
};

