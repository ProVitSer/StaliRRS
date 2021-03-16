const Service = require('node-windows').Service;

// Create a new service object
let svc = new Service({
    name: '3CX Modify Status Windows Service',
    description: 'Модуль изменения статуса почты и добавочных на 3сх',
    script: 'C:\\Program Files\\nodejs\\StaliRRS\\Windows\\app.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
    svc.start();
});

svc.install();