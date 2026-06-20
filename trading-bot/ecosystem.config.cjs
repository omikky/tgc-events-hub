// pm2 process file — keeps the bot running and restarts it on crash/reboot.
// Usage:
//   npm install -g pm2
//   pm2 start ecosystem.config.cjs
//   pm2 logs tgc-trading-bot      # view live logs (also works from a phone over SSH)
//   pm2 save && pm2 startup        # survive server reboots
module.exports = {
  apps: [
    {
      name: "tgc-trading-bot",
      script: "npm",
      args: "run bot",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
