// module.exports = {
//   apps: [
//     {
//       name: 'dashboard',
//       script: './dist/server.js',
//       instances: 2,
//       exec_mode: 'cluster',
//       autorestart: true,
//       watch: false,
//       max_memory_restart: '300M',
//       env: {
//         NODE_ENV: 'production',
//         PORT: 3000,
//         // outras variáveis que quiser definir
//       },
//     },
//   ],
// };

module.exports = {
  apps: [
    {
      name: 'dashboard',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        
        // Database
        DATABASE_URL: 'postgresql://postgres:sol%40250066@192.168.234.3:5432/solutii',
        
        
        // Firebird - SERVIDOR
        FIREBIRD_HOST: '192.168.0.50',
        FIREBIRD_PORT: '3050',
        FIREBIRD_DATABASE: 'C:/GERPROJ/DROPBOX/GERPROJ_SOLUTII.GDB',
        FIREBIRD_USER: 'SYSDBA',
        FIREBIRD_PASSWORD: 'masterkey',
        
      },
    },
  ],
};

