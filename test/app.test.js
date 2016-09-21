﻿//var assert = require('assert');
var app = require('../app');
var request = require('superagent');
var expect = require('expect.js');
var cheerio = require('cheerio');
var util = require('util');
var timeoutValue = 30000;

var port = 3000;
var baseURL = "http://localhost:3000/";

describe('Testing webscrapping web software', function () {
    this.timeout(timeoutValue);
    before('Before initializing the test', function (done) {
        //This calles once as the begining of the call
        this.timeout(timeoutValue);
        port = port || 3000;
        if (app.server && !app.server.instance) {
            app.server.start(port, function (msg) {
                console.log('----- Application server started -----');
            });
        }

        if (done) done();
    });

    after('Now all the tests are executed', function (done) {
        //This calles once at the last of all the call
        this.timeout(timeoutValue);
        if (app.server && app.server.instance) {
            app.server.stop(function (msg) {
                console.log('----- Application server stopped -----');
            });
        }

        if (done) done();
    });

    //This is just to test whether http://localhost:3000/?url=http://www.merittree.com works or not
    describe('www.meritree.com web scrapping', function () {
        this.timeout(timeoutValue);
        beforeEach(function (done) {
            this.timeout(timeoutValue);
            //This calls everytime before each test/suite
            console.log("Before the request");
            if (done)
                done();
        });

        it('www.merittree.com request check', function (done) {
            this.timeout(timeoutValue);
            var callingUri = baseURL + '?url=http://www.merittree.com/';
            request.get(callingUri)
                .on('error', function (e) {
                    if (done)
                        done();
                })
                .end(function (e, res) {
                    console.log('Calling %s', callingUri);
                    console.log("Status :: " + res.status);
                    console.log("Body :: " + res.body);
                    expect(res).to.ok();
                    expect(res.status).to.equal(200);

                    if (done)
                        done();
                });
        })

        it('www.merittree.com title check', function (done) {
            //assert.ok(1 === 1, "This shouldn't fail");
            //assert.ok(false, "This should fail");
            this.timeout(timeoutValue);
            var callingUri = baseURL + '?url=http://www.merittree.com/';
            request.get(callingUri)
                .on('error', function (e) {
                    if (done)
                        done();
                })
                .end(function (e, res) {   //.timeout(30000)
                var $ = cheerio.load(res.text);

                if ($('title').length > 0)
                    console.log("Has Title");
                else 
                    console.log("Has no Title");

                var title = $('title').text();
                console.log('Calling %s', callingUri);
                console.log("Title :: " + title);
                expect(title).to.contain("MeritTree");

                if (done)
                    done();
            });
        });

        it('www.merittree.com logo check', function (done) {
            //http://merittree.com/wp-content/uploads/2015/10/merittree.png
            this.timeout(timeoutValue);
            var callingUri = baseURL + '?url=http://merittree.com/wp-content/uploads/2015/10/merittree.png';
            request.get(callingUri)
                .on('error', function (e) {
                    if (done)
                        done();
                })
                .end(function (e, res) {  //.timeout(30000)

                    //var title = $('title').text();
                    //console.log('Calling %s', callingUri);
                    //console.log("Title :: " + title);
                    expect(res.type).to.equal('image/png');
                    if (done)
                        done();
                });
        });
    });
});