var lineReader = require('line-reader');
var rp = require('request-promise');
var slug = require('slug');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');
var async = require('async');
var libxmljs = require("libxmljs");


var possibleMimeTypes = ["application/xml", "application/rdf+xml"];

var OntologiesDatabase = function(options)
{
    var self = this;

    self._downloadsFolderName = "downloaded";
    self._ontologiesListFilename = "ontologies_list.txt";
    self._ontologiesMapFilename = "ontologies_map.json";

    if (options.downloadsFolderName)
    {
        self.downloadsFolderName = options.downloadsFolderName;
    }

    if (options.ontologiesListFilename)
    {
        self.ontologiesListFilename = options.ontologiesListFilename;
    }

    if (options.ontologiesMapFilename)
    {
        self.ontologiesMapFilename = options.ontologiesMapFilename;
    }

    self._ontologiesAndFilesMap = {};
};

OntologiesDatabase.prototype.getMap = function()
{
    var self = this;
    self._ontologiesAndFilesMap = require(self.ontologiesMapFilename);

    return self._ontologiesAndFilesMap;
};

OntologiesDatabase.prototype.reload = function(callback) {
    var self = this;

    mkdirp.sync(self.downloadsFolderName);

    if(fs.existsSync(self.ontologiesListFilename))
    {
        lineReader.eachLine(self.ontologiesListFilename, function (line, last, cb) {

            var tryToDownloadOntology = function(cb) {
                var newFileName = path.join(self.downloadsFolderName, slug(line, '_'));

                rimraf.sync(newFileName);

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
                                self._ontologiesAndFilesMap[line] = newFileName;
                                console.log(line + " ontology downloaded successfully with type " + mimetype);
                                callback(null, true);
                            }
                            catch (e)
                            {
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
            };

            if (last)
            {
                tryToDownloadOntology(function(err, result){
                    fs.writeFileSync(self.ontologiesMapFilename, JSON.stringify(self._ontologiesAndFilesMap, null, 4));
                    cb(false); // stop reading
                    callback(null, path.resolve(self.downloadsFolderName), self._ontologiesAndFilesMap);  //finish everything
                });
            }
            else
            {
                tryToDownloadOntology(function(err, result){
                    cb();
                });
            }
        });
    }
    else
    {
        callback("File " + self.ontologiesListFilename + " does not exist!");
    }
};

module.exports = OntologiesDatabase;

