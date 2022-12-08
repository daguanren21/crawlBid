let cluster = require('cluster');
cluster.setupMaster({
    exec: `childProcess/child.js`
});
let worker = cluster.fork();
worker.on('message', function (m) {
    console.log('父进程接收到消息:', m);
    process.exit();
});
worker.send({
    name: 'zfpx'
});