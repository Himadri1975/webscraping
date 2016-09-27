'use strict';

var express = require('express');
var session = require('cookie-session');
var urlLib = require('url');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var os = require('os');
var css = require('css');
var router = express.Router();
var sTitle = 'Express';
var domain = '';
var requestingDomain = '';
var config = require('../config');

//var cert = require('ssl-root-cas/latest');
var port = config().port || 3000;
var HOSTNAME = config().host || "localhost";
//var baseURL = "http://localhost:3000/";
var baseURL = HOSTNAME + ":" + port;

/* GET home page. */
var url = '';
router.get('/', function (req, res, next) {
    //debugger;
    url = req.query.url ? req.query.url : 'http://www.merittree.com/';
    //url = req.query.page ? req.query.page : url;

    if (url) {
        if ((url.indexOf("http:") > -1 || url.indexOf("https:") > -1)) {
            url = url;
        }
        else {
            if (url.indexOf("http:") > -1)
                url = "http://" + url;
            else if (url.indexOf("https:") > -1)
                url = "https://" + url;
        }
    }


    var URL = urlLib.parse(url);
    requestingDomain = URL.hostname;

    if (!req.session.hostURL || (URL.hostname && req.session.hostURL != URL.hostname)) {
        req.session.hostURL = domain = URL.hostname;
    }

    var fileExtn = url; //path.extname(url);

    if (fileExtn.indexOf('.jpg') > -1 ||
        fileExtn.indexOf('.png') > -1 ||
        fileExtn.indexOf('.bpm') > -1 ||
        fileExtn.indexOf('.jpeg') > -1 ||
        fileExtn.indexOf('.gif') > -1 ||
        fileExtn.indexOf('.ico') > -1) { //its an image

        try {
            request.get(url).on('error', function (err) {
                console.log('Error on request object: -' + url + " error:: ", err);  
            }).pipe(res);
        }
        catch (err) {
            res.render('index', { title: err.message });
        }
    }
    else {
        console.log("URL: " + url);
        request({
            url: url,
            method: req.method,
            timeout: 30000,
            followRedirect: true
        }, function (error, response, html) {
            //debugger;
            if (!error) {
                var $ = cheerio.load(html);

                var title, release, rating;
                var json = { title: "", release: "", rating: "" };
                var elementName = "title";

                if ($(elementName).length) {
                    $(elementName).filter(function (i, el) {
                        //debugger;
                        try {
                            var data = $(this);
                            title = data.text(); //data.children().first().text();

                            //var document = $.parseHTML();
                            // We will repeat the same process as above.  This time we notice that the release is located within the last element.
                            // Writing this code will move us to the exact location of the release year.
                            linkReplacer($, $("html"), domain);
                            /*$("html").find("head").children().each(function (idx, elmnt) {
                                if ($(this).attr("href") || $(this).attr("src")) {
                                    //var url = "http://www.google.co.in/url?url=" + ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));
                                    var redirectedUrl = ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));
                                    //"http://" + req.session.hostURL + 
                                    var url = "http://localhost:3000/?url=" + ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));
                                    if (redirectedUrl.indexOf("http:") == -1)
                                        url = "http://localhost:3000/?url=" + "http://" + domain + ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));

                                    if ($(this).attr("href")) {
                                        $(this).attr("href", url);
                                    }
                                    else if ($(this).attr("src")) {
                                        $(this).attr("src", url);
                                    }
                                }
                            });*/

                            release = data.children().last().children().text();
                            json.title = sTitle = title;

                            // Once again, once we have the data extract it we'll save it to our json object

                            json.release = release;
                            //res.render('index', { title: sTitle });

                            res.writeHead(200, {
                                'Content-Type': 'text/html'
                            });
                            res.write($("html").html());
                            //response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
                            res.end();
                        }
                        catch (err) {
                            res.render('index', { title: "Error" });
                        }
                    });
                }
                else if (response.headers["content-type"] == "text/css")
                {
                    var cssObj = null;
                    try {
                        //var targetUrl = "http://" + domain + URL.pathname.replace(path.basename(URL.pathname), "");
                        var targetUrl = "http://" + requestingDomain + URL.pathname.replace(path.basename(URL.pathname), "");
                        
                        cssObj = css.parse(html, { source: 'sample.css' });
                        if (cssObj && cssObj.stylesheet) { //css object is not null
                            for (var ruleidx in cssObj.stylesheet.rules) {
                                var rule = cssObj.stylesheet.rules[ruleidx];
                                for (var decidx in rule.declarations) {
                                    var declaration = rule.declarations[decidx];
                                    if (declaration.comment && declaration.comment.indexOf('url') > -1 && declaration.comment.indexOf('url("data') == -1) {
                                        declaration.comment = changeUrl(declaration.comment, baseURL, targetUrl);
                                    }
                                    else if (declaration.value && declaration.value.indexOf('url') > -1 && declaration.value.indexOf('url("data') == -1) {
                                        declaration.value = changeUrl(declaration.value, baseURL, targetUrl);
                                    }
                                }
                            }
                        }

                        var cssString = css.stringify(cssObj);

                        res.writeHead(200, {
                            'Content-Type': 'text/css'
                        });
                        res.write(cssString);
                        //response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
                        res.end();
                    }
                    catch (err) {
                        res.writeHead(response.statusCode, {
                            'Content-Length': response.body.length, // response.headers["content-length"],
                            'Content-Type': response.headers["content-type"]
                        });
                        res.end(response.body);
                    }
                }
                else {
                    //res.setHeader("content-length", response.headers["content-length"]);
                    res.writeHead(response.statusCode, {
                        'Content-Length': response.body.length, // response.headers["content-length"],
                        'Content-Type': response.headers["content-type"]
                    });

                    //res.write();
                    //response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
                    res.end(response.body);
                }
            }
            else {
                //res.render('index', { title: sTitle });
                res.status(404).send("Not found");
            }
        });
    }

  	//res.render('index', { title: 'Express' });
});

function linkReplacer($, rootElement, domain) {
    if (rootElement.children().length > 0) {
        rootElement.children().each(function (idx, elmnt) {
            if ($(this).attr("href") || $(this).attr("src")) {
                //var url = "http://www.google.co.in/url?url=" + ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));
                var redirectedUrl = ($(this).attr("href") ? $(this).attr("href") : $(this).attr("src"));

                while (redirectedUrl.indexOf("../") > -1) {
                    redirectedUrl = redirectedUrl.replace("../", "");
                }
                
                redirectedUrl = (redirectedUrl.startsWith("/") || redirectedUrl.startsWith("http")) ? redirectedUrl : "/" + redirectedUrl;

                //"http://" + req.session.hostURL + 
                var url = "http://" + baseURL + "/?url=" + redirectedUrl;
                //"http://localhost:3000/?url=" + redirectedUrl;
                if (redirectedUrl.indexOf("http") == -1) {
                    //url = "http://localhost:3000/?url=" + "http://" + domain + redirectedUrl;
                    url = "http://" + baseURL + "/?url=" + "http://" + domain + redirectedUrl;
                }

                if ($(this).attr("href")) {
                    $(this).attr("href", url);
                }
                else if ($(this).attr("src")) {
                    $(this).attr("src", url);
                }
                else if ($(this).attr("style") && $(this).attr("style").indexOf('url(')>-1) {
                    var cssObj = css.parse($(this).attr("style"), { source: 'sample.css' });
                    if (cssObj) {

                    }
                }
            }
            if ($(this).children().length > 0) {
                linkReplacer($, $(this), domain);
            }
        });
    }
}

String.prototype.replaceAll = function (strValue, changedValue) {
    var strReturnValue = this;
    while (strReturnValue.indexOf(strValue) > -1) {
        strReturnValue = strReturnValue.replace(strValue, changedValue);
    }

    return strReturnValue;
}

function changeUrl(value, baseURI, targetDoamin) {
    var url = "http://" + baseURI + "/?url=" + targetDoamin;
    var suburl = '';
    var i = 0;
    var urls = [];

    var URL = urlLib.parse(targetDoamin);
    var domain = URL.hostname;

    var word = '';
    var sentance = '';
    var endIndex = -1, startIndex = -1;
    var index = 0;
    while (i < value.length) {
        if (word == '' && value[i] == 'u' && (i == 0 || value[i - 1] == ' ' || value[i - 1] == ',')) {
            //not started with url or some word starts with u
            word += value[i];
            sentance += value[i];
        }
        else if (startIndex > -1 && endIndex <= 0) {
            if (value[i] == ")") {
                sentance += value[i];
                endIndex = i - 1;
                word = '';
                startIndex = -1;
                endIndex = -1;
                urls.push(suburl.replaceAll("'", "").replaceAll('"',""));
                suburl = '';
            }
            else {
                suburl += value[i];
            }
        }
        else if (startIndex == -1 && word != '' && (value[i] != ' ' || i == (value.length - 1))) {
            sentance += value[i];
            word += value[i];
            if (word.startsWith('url(')) {
                startIndex = i;
                sentance += "{" + index++ + "}";
            }
        }
        else {
            sentance += value[i];
        }

        i++;
    }

    for (var idx = 0; idx < urls.length; idx++) {
        suburl = urls[idx];
        suburl = suburl.replaceAll('"', "").replaceAll("'", "");

        if (suburl.startsWith("/")) {
            url = "http://" + baseURI + "/?url=" + URL.protocol + "//" + domain;
        }

        if (url.endsWith('/'))
            url = url.substring(0, (url.length - 2)) + suburl;
        else
            url += suburl;

        url = url.replaceAll('"', "");
        sentance = sentance.replace("{" + idx + "}", url);
    }

    return sentance;
}

module.exports = router;
