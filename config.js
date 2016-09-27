var path = require('path');
var os = require('os');

module.exports = function () {
    switch (process.env.NODE_ENV) {
        case 'development':
            return { host: 'localhost', port: 3000 };

        case 'test': //docker service
            return { host: '192.168.99.100', port: 8989 };

        case 'production':
            return { host: 'localhost', port: 80 };

        default:
            return { host: 'localhost', port: 3000 };
    }
};