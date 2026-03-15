export default {
  apps: [
    {
      name: "methalo-ultraviolet",
      script: "index.js",
      cwd: "./",
      watch: false,
      autorestart: true,
      max_restarts: 10
    }
  ]
};
