
module.exports = function utility()
{  var https = require('https');
    var http = require('http');
    var appConfig = require('./appdata.json');
    var loadDataConfig = require('./testData/acsLoadData.json');
    var APP_KEY_APPENDER= "?key=";
    var appInfo = appConfig.appdata;
    var loadDataObj = loadDataConfig.data;
    var options = {
        hostname: appInfo.host_name,
        port: appInfo.port,
        headers: {
            'Content-Type': appInfo.content_type
        }
    };
    var data = "";
    var cookieSession;
    var userId;
    this.createUser=function(uniqueName,reqStats,resFun){
        var self=this;
        var userObj = loadDataObj.createUser;
        data = JSON.stringify({
            'username': uniqueName,
            'role': userObj.fields.role,
            'first_name': userObj.fields.first_name,
            'last_name': userObj.fields.last_name,
            'password': userObj.fields.password,
            'password_confirmation': userObj.fields.password_confirmation
        })
        var currentTime=new  Date().getTime();
        self.makeHttpRequest(currentTime,userObj,reqStats, true, function (res) {
            resFun(res) ;
        })
    }

    this.queryPost= function (reqStats,resFun) {
        var self=this;
        var postObj = loadDataObj.queryPost;
        data = JSON.stringify({
            'page': postObj.fields.page,
            'per_page': postObj.fields.per_page,
            'where': JSON.stringify(postObj.fields.clause.where)
        });
        var currentTime=new  Date().getTime();
        self.makeHttpRequest(currentTime,postObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }

    this.createPost= function (reqStats,resFun) {
        var self=this;
        var postObj = loadDataObj.createPost;
        data = JSON.stringify({
            'content': postObj.fields.content,
            'title': postObj.fields.title
        });
        var currentTime=new  Date().getTime();
        if(cookieSession!=undefined)
        options.headers['Cookie'] = cookieSession[0];
        self.makeHttpRequest(currentTime,postObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }

    this.createCustomObject= function (reqStats,resFun) {
        var self=this;
        var customObj = loadDataObj.createCustomObject;
        data = JSON.stringify({
            fields: JSON.stringify(customObj.fields.custom_value)
        });
        if(cookieSession!=undefined)
        options.headers['Cookie'] = cookieSession[0];
        var currentTime=new  Date().getTime();
        self.makeHttpRequest(currentTime,customObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }

    this.queryCustomObject= function (reqStats,resFun) {
        var self=this;
        var customObj = loadDataObj.queryCustomData;
        data = JSON.stringify({
            'page': customObj.fields.page,
            'per_page': customObj.fields.per_page,
            'where': JSON.stringify(customObj.fields.clause.where),
            'order': customObj.fields.order
        });
        var currentTime=new Date().getTime();
        self.makeHttpRequest(currentTime,customObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }

    this.createPlacesObject= function (reqStats,resFun) {
        var self=this;
        var placesObj = loadDataObj.createPlacesObject;
        data = JSON.stringify({
            'name': placesObj.fields.name,
            'state': placesObj.fields.state,
            'address': placesObj.fields.address,
            'website': placesObj.fields.website
        });
        var currentTime=new  Date().getTime();
        if(cookieSession!=undefined)
        options.headers['Cookie'] = cookieSession[0];
        self.makeHttpRequest(currentTime,placesObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }
    this.logout= function (reqStats,resFun) {
        var self=this;
        var userObj = loadDataObj.logoutUser;
        var currentTime=new  Date().getTime();
        self.makeHttpRequest(currentTime,userObj,reqStats, false, function (res) {
            resFun(res) ;
        })
    }
    this.makeHttpRequest=function(reqStartTime,userObj,reqStats, cookieState, resFunc) {
        var self=this;
        var dataReceived=0;
        options.headers['Content-Length'] = data.length;
        options.path = (userObj.method_url + APP_KEY_APPENDER + appInfo.app_key);
        options.method = userObj.method_type;
        var req = https.request(options, function (res) {
            reqStats.inprocReq--;
            reqStats.clients++;
            res.setEncoding('utf8');
            res.on('data', function (responseData) {
               if (cookieState) {
                    cookieSession = res.headers['set-cookie'];
                    var someData = JSON.parse(responseData.toString());
                    userId = someData.response.users[0].id;
                    userState = someData.meta.code;
                }
            });
            res.on('end', function () {
                if(dataReceived==0){
                    dataReceived++;
                    reqStats.clients--;
                    reqStats.ended_req++;
                    reqStats.total_res_time_for_machine=reqStats.total_res_time_for_machine+(new Date().getTime()-reqStartTime);
                    reqStats.res_time_per_req= self.convertMS(new Date().getTime()-reqStartTime) ;
                    resFunc(reqStats);
                }
            });
            res.on('error', function () {
                if(dataReceived==0){
                    dataReceived++;
                    reqStats.total_error_res_time_for_machine=reqStats.total_error_res_time_for_machine+ (new Date().getTime()-reqStartTime);
                    reqStats.clients--;
                    reqStats.errors_resp++;
                     resFunc(reqStats);
                }
            });
        });
        req.on('error', function (e) {
            if(dataReceived==0){
                dataReceived++;
                reqStats.total_error_req_time_for_machine= reqStats.total_error_req_time_for_machine+(new Date().getTime()-reqStartTime);
                reqStats.inprocReq--;
                reqStats.errors_req++;
                resFunc(reqStats);
            }
        });
        req.write(data);
        req.end();
    }

    this.convertMS=function (millSecond){
        var d, h, m, s,ms;
        ms = (millSecond/1000).toString().split('.')[1];
        s = Math.floor(millSecond / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;
        return d+":"+h+":"+m+":"+s+":"+ms
    }
}
