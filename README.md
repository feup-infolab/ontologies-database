[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d91a3e0705ac4dcdad426171a209cadc)](https://www.codacy.com/app/silvae86/ontologies-database?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=feup-infolab/ontologies-database&amp;utm_campaign=Badge_Grade)
[![Build Status](https://travis-ci.org/feup-infolab/ontologies-database.svg?branch=master)](https://travis-ci.org/feup-infolab/ontologies-database)

# An ontology repository for your OpenLink Virtuoso Instances

We all know how hard it is to find ontologies on the web to load into our triple store as separate graphs. 
The [Linked Open Vocabularies](http://lov.okfn.org/dataset/lov/) website helps a lot, but their dumps are in `.nq` format (n-Quads) and you will struggle quite a lot to try to translate them into `.n3` or any other format that Virtuoso accepts.   

`ontologies-database` is intended as 

 * A repository of ontologies on GitHub, in `.rdf` or `.owl` for easy loading into Virtuoso
 * A download script that, given a list of ontology URIs in a `.txt` file, will attempt to downlod all those ontologies
 * A script to load those ontologies into separate graphs in a Virtuoso Instance running on `localhost`, via Virtuoso's `isql` utility. 

## Quickstart guide

This script is intended as a way to automatically fetch ontologies and load them into an OpenLink Virtuoso instance.

First, clone the repo:

````bash
git clone https://github.com/feup-infolab/ontologies-database.git
cd ontologies-database
````

Then, run the loading script:

````bash
./load_ontologies.sh
````

Your Virtuoso instance will then be loaded with all the ontologies in the `downloaded/` folder, each in its own graph.

## Reloading the database

Ontologies can evolve, so we will periodically run the script and update this repository. If you want to refresh the ontologies in the `downloaded/` folder by yourself:

- Place the updated list of ontologies in the `ontologies_list.txt` file
- Install nvm
    ````bash
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
    ````
- Install NodeJS 8.9.0
    ````bash
    nvm install 8.9.0
    ````

- Activate NodeJS 8.9.0
    ````bash
    nvm use 8.9.0
    ````

- Run the updating script. This will attempt to re-download all ontologies in the list, if they are in `.owl` or `.rdf` format. 
    ````bash
    npm run start
    ````

## How we built the ontologies_map.txt file

The list of ontology URIs in `ontologies_list.txt` was produced by:

1. Downloading the LOV dump (in `.n3`) from [here](http://lov.okfn.org/dataset/lov/sparql).

2. Loading the file into Virtuoso via the Quad Store upload function (ironic name, as it support uploading nQuads, only triples... Just call it Triple Store upload, no? But I digress...) 
 
3. Running the following query in the Conductor:

````sparql
WITH <http://localhost:8890/DAV>
SELECT ?s
WHERE
{
    ?s rdf:type <http://purl.org/vocommons/voaf#Vocabulary>
}
```` 
