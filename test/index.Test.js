process.env.NODE_ENV = "test";

const chai = require("chai");
const should = chai.should();

var rimraf = require("rimraf");
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var OntologiesDatabase = require("../index.js");
var libxmljs = require("libxmljs");
var _ = require("underscore");

var testDownloadsFolder = path.resolve("test/downloaded_tests");
var ontologiesListFilename = path.resolve("test/ontologies_list.txt");
var ontologiesMapFilename = path.resolve("test/ontologies_map.json");

var database = new OntologiesDatabase({
    downloadsFolderName: testDownloadsFolder,
    ontologiesListFilename: ontologiesListFilename,
    ontologiesMapFilename: ontologiesMapFilename
});

var mockMap = {
    "http://www.w3.org/2002/07/owl": "httpwwww3org200207owl",
    "http://purl.org/dc/dcmitype/": "httppurlorgdcdcmitype",
    "http://purl.org/dc/elements/1.1/": "httppurlorgdcelements11",
    "http://purl.org/dc/terms/": "httppurlorgdcterms",
    "http://xmlns.com/foaf/0.1/": "httpxmlnscomfoaf01"
};

describe("Get all ontologies", function ()
{
    this.timeout(20000);

    before(function (done)
    {
        rimraf.sync(testDownloadsFolder);
        rimraf.sync(ontologiesMapFilename);
        mkdirp.sync(testDownloadsFolder);
        done();
    });

    it("Should download all ontologies and they all have to be valid XML", function (done)
    {
        database.reload(function (err, downloadDirectory, fileMap)
        {
            should.not.exist(err);
            fs.readdir(downloadDirectory, function (err, files)
            {
                files.length.should.equal(5);
                try
                {
                    for (var i = 0; i < files.length; i++)
                    {
                        var xmlDoc = libxmljs.parseXml(fs.readFileSync(path.join(testDownloadsFolder, files[i])));
                    }
                }
                catch (e)
                {
                    done(e);
                }

                done();
            });
        });
    });

    it("Should get a valid ontologies map", function (done)
    {
        var map = database.getMap();
        _.map(Object.keys(map), function (key)
        {
            map[key].should.contain(mockMap[key]);
        });

        done();
    });
});
