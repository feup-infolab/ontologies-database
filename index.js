var lineReader = require('line-reader');
var rp = require('request-promise');
var slug = require('slug');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var async = require('async');
var libxmljs = require("libxmljs");

var downloadsFolderName = "downloaded";
var ontologiesListFilename = "ontologies_list.txt";
var possibleMimeTypes = ["application/xml", "application/rdf+xml"];
var ontologiesAndFilesMap = {};

var OntologiesDatabase = function()
{}

OntologiesDatabase.reload = function(options, callback) {
    if (options.downloadsFolderName)
    {
        downloadsFolderName = options.downloadsFolderName;
    }

    if (options.ontologiesListFilename)
    {
        ontologiesListFilename = options.ontologiesListFilename;
    }

    mkdirp.sync(downloadsFolderName);

    lineReader.eachLine(ontologiesListFilename, function (line, last, cb) {

        var tryToDownloadOntology = function(cb) {
            var newFileName = path.join(downloadsFolderName, slug(line, '_'));
            if (!fs.existsSync(newFileName))
            {
                async.detect(possibleMimeTypes, function (mimetype, callback) {

                    console.log("Trying to download ontology " + line + " with mimetype " + mimetype + " ....");
                    var options = {
                        uri: line,
                        headers: {
                            'Accept': mimetype
                        },
                        timeout: 3000
                    };

                    rp(options)
                        .then(function (response) {
                            try
                            {
                                var xmlDoc = libxmljs.parseXml(response);
                                var fd = fs.openSync(newFileName, 'a');
                                fs.writeFileSync(newFileName, response);
                                fs.closeSync(fd);
                                ontologiesAndFilesMap[line] = newFileName;
                                console.log(line + " ontology downloaded successfully with type " + mimetype);
                                callback(null, true);
                            }
                            catch (e)
                            {
                                console.error("Error downloading ontology " + line  + "!");
                                console.error(e);
                                callback(null, false);
                            }
                        })
                        .catch(function (err) {
                            callback(null, false);
                        });
                }, function (err, result) {
                    if (err)
                    {
                        console.error("Error downloading " + line);
                        console.error(JSON.stringify(err));
                    }
                    else
                    {
                        if (!result)
                        {
                            console.log(line + " ontology not available!");
                        }
                    }

                    cb();
                });
            }
            else
            {
                cb();
            }
        };

        if (last)
        {
            tryToDownloadOntology(function(err, result){
                fs.writeFileSync("map.json", JSON.stringify(ontologiesAndFilesMap, null, 4));
                cb(false); // stop reading
                callback(null, path.join(__dirname, downloadsFolderName), ontologiesAndFilesMap);  //finish everything
            });
        }
        else
        {
            tryToDownloadOntology(function(err, result){
                cb();
            });
        }
    });
};

module.exports = OntologiesDatabase;

