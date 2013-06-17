var colors = require('colors');
var https = require('https');
var http = require('http');
var utilitiesObj = require('./utility.js');
var requestNumber = 0;
var config = {
    n: 1,
    concurrency: 1
};
var stats = {
    clients: 0,
    inproc: 0
};
var requestStats = {
    clients: 0,
    inprocReq: 0,
    errors_req: 0,
    errors_resp: 0,
    ended_req: 0,
    req_name: '',
    res_time_per_req: 0,
    total_res_time_for_machine: 0,
    total_error_res_time_for_machine: 0,
    total_error_req_time_for_machine: 0,
    first_req_time:new Date().getTime()
};
function createLoadCyle(controller) {
    console.log("start----------------")
    stats.inproc++;
    var uniqueName = "User" + Math.random().toString(36).slice(2);
    var utilities = new utilitiesObj();

    beforeEachRequest("createUser");
    utilities.createUser(uniqueName, requestStats, function (_responseStats) {
        if (controller.requestNumber % 5 == 0 && controller.requestNumber != 0) {
            beforeEachRequest("createPost");
            utilities.createPost(requestStats, function () {
                beforeEachRequest("queryPost");
                utilities.queryPost(requestStats, function () {
                    if (controller.requestNumber % 25 == 0 && controller.requestNumber != 0) {
                        beforeEachRequest("createPlacesObject");
                        utilities.createPlacesObject(requestStats, function () {
                            beforeEachRequest("createCustomObject");
                            utilities.createCustomObject(requestStats, function () {
                                beforeEachRequest("queryCustomObject");
                                utilities.queryCustomObject(requestStats, function () {
                                    beforeEachRequest("logout");
                                    utilities.logout(requestStats, function () {
                                        stats.inproc--;
                                    });
                                });
                            });
                        });
                    } else {
                        beforeEachRequest("createCustomObject");
                        utilities.createCustomObject(requestStats, function () {
                            beforeEachRequest("queryCustomObject");
                            utilities.queryCustomObject(requestStats, function () {
                                beforeEachRequest("logout");
                                utilities.logout(requestStats, function () {       s
                                    stats.inproc--;
                                });
                            });
                        });
                    }
                });
            });
        } else {
            beforeEachRequest("queryPost");
            utilities.queryPost(requestStats, function () {
                beforeEachRequest("createCustomObject");
                utilities.createCustomObject(requestStats, function () {
                    beforeEachRequest("queryCustomObject");
                    utilities.queryCustomObject(requestStats, function () {
                        beforeEachRequest("logout");
                        utilities.logout(requestStats, function () {
                            stats.inproc--;
                        });
                    });
                });
           });
        }
    });
}
var loadTimer = setInterval(function () {
    while (config.n > stats.clients + stats.inproc && stats.inproc < config.concurrency) {
        requestNumber++;
        var controller = new Object();
        controller.requestNumber = requestNumber;
        createLoadCyle(controller);
    }
}, 500);

function beforeEachRequest(reqName) {
    requestStats.inprocReq++;
    requestStats.req_name = reqName;
}
http.createServer(function (req, res) {
    if (req.method === "GET") {
        var url = require('url').parse(req.url, true);
        if (url.pathname === '/') {
            // Return stats on '/'
            return res.end(JSON.stringify(requestStats) + "\n");

        }else if (url.pathname === '/set') {
            var queryUrl = url.query;
            if(queryUrl.n)
            config.n = queryUrl.n;
            config.concurrency = queryUrl.c;
            return res.end(JSON.stringify(config) + "\n");
        }
        else if (url.pathname === '/restart') {
            // Restart process on '/restart'
            require('child_process').exec("sudo restart client", function() {});
            return res.end("OK\n");
        }
    }
    res.writeHead(404);
    res.end();
}).listen(8080);
