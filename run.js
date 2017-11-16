var OntologiesDatabase = require("./index.js");


db = new OntologiesDatabase();

console.log("Reloading ontologies...");

db.reload(function(result){
    console.log("Ontologies reloaded.");
});
