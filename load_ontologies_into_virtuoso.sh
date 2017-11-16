#!/bin/bash
filename="$1"

if [ ! -f "/usr/local/virtuoso-opensource/bin/isql" ]
then
    echo "Virtuoso is not installed? /usr/local/virtuoso-opensource/bin/isql is missing!"
    exit 1
fi

cat $filename  | while IFS= read -r line ; do
        read -ra ontology_and_file -d '' <<<"$line"
        uri=${ontology_and_file[0]}
        file=$(pwd)/${ontology_and_file[1]}

        /usr/local/virtuoso-opensource/bin/isql << EOF1
SPARQL LOAD <file://$file> INTO GRAPH <$uri>;
EOF1
done
