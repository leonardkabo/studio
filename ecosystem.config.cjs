// PM2 Configuration pour hébergement direct sur Hostinger VPS
module.exports = {
  apps: [
    {
      name: "studio_leonardkabo",
      script: "dist/server.cjs",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
      env_file: ".env",
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/studio-err.log",
      out_file: "/var/log/pm2/studio-out.log",
      time: true,
    },
  ],
};
