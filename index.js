var lineReader = require('line-reader');
var rp = require('request-promise');
var slug = require('slug');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');
var async = require('async');

var downloadsFolderName = "downloaded";
var possibleMimeTypes = ['text/turtle', "application/xml", "application/rdf+xml"];

mkdirp.sync(downloadsFolderName);

lineReader.eachLine('ontologies_list.txt', function(line, last, cb) {
    console.log(line);

    if (last) {
        cb(false); // stop reading
    } else {
        var newFileName = path.join(__dirname, downloadsFolderName, slug(line, '_'));
        if(!fs.existsSync(newFileName))
        {
            async.detect(possibleMimeTypes, function(mimetype, callback){

                console.log("Trying to download ontology " + line + " with mimetype " + mimetype + " ....");
                var options = {
                    uri: line,
                    headers: {
                        'Accept': mimetype
                    },
                    timeout : 3000
                };

                rp(options)
                    .then(function (response) {
                        console.log("Contents");
                        fs.writeFileSync(newFileName, response);
                        callback(null, true);
                    })
                    .catch(function (err) {
                        callback(null, false);
                    });
            }, function(err, result) {
                if(err)
                {
                    console.error("Error downloading " + line);
                    console.error(JSON.stringify(err));
                }
                else
                {
                    if(!result)
                    {
                        console.log(line + " ontology not available!");
                    }
                    else
                    {
                        console.log(line + " ontology downloaded successfully");
                    }
                }

                cb();
            });
        }
        else
        {
            cb();
        }

    }
});
