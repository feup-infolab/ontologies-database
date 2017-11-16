#!/usr/bin/bash
filename="$1"

if [ ! -f "/usr/local/virtuoso-opensource/bin/isql" ]
then
    echo "Virtuoso is not installed? /usr/local/virtuoso-opensource/bin/isql is missing!"
    exit 1
fi


while read -r line
do
    ontology_and_file=$(line)
    uri=${line[0]}
    file=${line[1]}

    /usr/local/virtuoso-opensource/bin/isql << EOF1
DB.DBA.TTLP_MT (file_to_string_output ('$file'), '', '$uri',512);
EOF1

done < "$filename"
