module.exports = {
  apps: [
    {
      name:               'moov-events-scan-backend',
      script:             'src/index.js',
      cwd:                '/data/www/mini-apps/servlets/moov-events-scan/backend',
      instances:          1,
      exec_mode:          'fork',
      autorestart:        true,
      watch:              false,
      max_memory_restart: '150M',
      env_production: {
        NODE_ENV: 'production',
        PORT:     3211,
      },
    },
    {
      name:               'moov-events-scan-test',
      script:             'src/index.js',
      cwd:                '/data/www/mini-apps/servlets/moov-events-scan/backend',
      instances:          1,
      exec_mode:          'fork',
      autorestart:        true,
      watch:              false,
      max_memory_restart: '150M',
      env_production: {
        NODE_ENV: 'test',
        PORT:     3311,
      },
    },
  ],
}
