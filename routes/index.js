'use strict';

var express = require('express');
var session = require('cookie-session');
var urlLib = require('url');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var router = express.Router();
var sTitle = 'Express';
var domain = '';

//var cert = require('ssl-root-cas/latest');

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
    if (!req.session.hostURL || (URL.hostname && req.session.hostURL != URL.hostname)) {
        req.session.hostURL = domain = URL.hostname;
    }

    var fileExtn = url; //path.extname(url);

    if (fileExtn.indexOf('.jpg') > -1 ||
        fileExtn.indexOf('.png') > -1 ||
        fileExtn.indexOf('.bpm') > -1 ||
        fileExtn.indexOf('.jpeg') > -1 ||
        fileExtn.indexOf('.ico') > -1) { //its an image
        request.get(url).pipe(res);
    }
    else {
        console.log("URL: " + url);
        request({
            url: url,
            method: req.method,
            timeout: 10000,
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
                res.render('index', { title: sTitle });
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
                var url = "http://localhost:3000/?url=" + redirectedUrl;
                if (redirectedUrl.indexOf("http:") == -1)
                    url = "http://localhost:3000/?url=" + "http://" + domain + redirectedUrl;

                if ($(this).attr("href")) {
                    $(this).attr("href", url);
                }
                else if ($(this).attr("src")) {
                    $(this).attr("src", url);
                }
            }
            if ($(this).children().length > 0) {
                linkReplacer($, $(this), domain);
            }
        });
    }
}

module.exports = router;
