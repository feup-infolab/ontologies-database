var lineReader = require("line-reader");
var rp = require("request-promise");
var slug = require("slug");
var fs = require("fs");
var rimraf = require("rimraf");
var mkdirp = require("mkdirp");
var path = require("path");
var async = require("async");
var libxmljs = require("libxmljs");

var possibleMimeTypes = {
    "owl": "application/xml",
    "rdf" : "application/rdf+xml"
};

var OntologiesDatabase = function (options)
{
    var self = this;

    self.downloadsFolderName = "downloaded";
    self.ontologiesListFilename = "ontologies_list.txt";
    self.ontologiesMapFilename = "ontologies_map.json";
    self.ontologiesAndFilesMapInTXT = "ontologies_map.txt";

    if(options)
    {
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

        if (options.ontologiesAndFilesMapInTXT)
        {
            self._ontologiesAndFilesMapInTXT = options.ontologiesAndFilesMapInTXT;
        }
    }

    self._ontologiesAndFilesMap = {};
    self._ontologiesAndFilesListTXT = "";
};

OntologiesDatabase.prototype.getMap = function ()
{
    var self = this;
    self._ontologiesAndFilesMap = require(self.ontologiesMapFilename);

    return self._ontologiesAndFilesMap;
};

OntologiesDatabase.prototype.reload = function (callback)
{
    var self = this;

    mkdirp.sync(self.downloadsFolderName);

    if (fs.existsSync(self.ontologiesListFilename))
    {
        lineReader.eachLine(self.ontologiesListFilename, function (line, last, cb)
        {
            var tryToDownloadOntology = function (cb)
            {
                async.map(Object.keys(possibleMimeTypes), function (extension, callback)
                {
                    var newFileName = path.join(self.downloadsFolderName, slug(line, "_")) + "." + extension;
                    rimraf.sync(newFileName);

                    var mimetype = possibleMimeTypes[extension];

                    console.log("Trying to download ontology " + line + " with mimetype " + mimetype + " ....");
                    var options = {
                        uri: line,
                        headers: {
                            Accept: mimetype
                        },
                        timeout: 3000
                    };

                    rp(options)
                        .then(function (response)
                        {
                            try
                            {
                                var xmlDoc = libxmljs.parseXml(response);
                                var fd = fs.openSync(newFileName, "a");
                                fs.writeFileSync(newFileName, response);
                                fs.closeSync(fd);
                                self._ontologiesAndFilesMap[line] = newFileName;
                                self._ontologiesAndFilesListTXT += line + " " + newFileName + "\n";
                                console.log(line + " ontology downloaded successfully with type " + mimetype);
                                callback(null, true);
                            }
                            catch (e)
                            {
                                callback(null, false);
                            }
                        })
                        .catch(function (err)
                        {
                            callback(null, false);
                        });
                }, function (err, result)
                {
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
                tryToDownloadOntology(function (err, result)
                {
                    fs.writeFileSync(self.ontologiesMapFilename, JSON.stringify(self._ontologiesAndFilesMap, null, 4));
                    fs.writeFileSync(self.ontologiesAndFilesMapInTXT,self._ontologiesAndFilesMapInTXT);
                    cb(false); // stop reading
                    callback(null, path.resolve(self.downloadsFolderName), self._ontologiesAndFilesMap); // finish everything
                });
            }
            else
            {
                tryToDownloadOntology(function (err, result)
                {
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

