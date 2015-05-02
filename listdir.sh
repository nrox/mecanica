#!/bin/bash
#create list.js, listing files in this folder recursively, prepared to be required as a module

LIST="./dist/list.js"

echo availablePaths = \[ >  $LIST

ls -R ./ | awk '
/:$/&&f{s=$0;f=0}
/:$/&&!f{sub(/:$/,"");s=$0;f=1;next}
NF&&f{ print "\""s"/"$0"\"," }' >> $LIST

echo \] >> $LIST

#sed -i '/\.\/\//d' $LIST
sed -i '/\.\/src\//d' $LIST
sed -i '/\.\/node_modules\//d' $LIST

