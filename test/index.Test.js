process.env.NODE_ENV = "test";

const chai = require("chai");
const should = chai.should();

var rimraf = require("rimraf");
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var index = require("../index.js");
var libxmljs = require("libxmljs");

var testDownloadsFolder = "test/downloaded_tests";
var ontologiesListFilename = "test/ontologies_list.txt";

describe("Import projects", function (done)
{
    this.timeout(120000);

    before(function (done)
    {
        rimraf.sync(testDownloadsFolder);
        mkdirp.sync(testDownloadsFolder);
        done();
    });

    describe("Get all ontologies", function () {
        it("Should download all ontologies and they all have to be valid XML", function (done) {
            index.reload({
                downloadsFolderName : testDownloadsFolder,
                ontologiesListFilename : ontologiesListFilename
            }, function(err, downloadDirectory, fileMap){
                should.not.exist(err);
                fs.readdir(downloadDirectory, function(err, files) {
                    files.length.should.equal(5);
                    try{
                        for(var i = 0; i < files.length; i++)
                        {
                            var xmlDoc = libxmljs.parseXml(fs.readFileSync(path.join(testDownloadsFolder, files[i])));
                        }
                    }
                    catch(e)
                    {
                        done(e);
                    }

                    done();
                });
            });
        });
    });
});
