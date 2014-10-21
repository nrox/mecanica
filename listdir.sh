#!/bin/bash
#create list.js, listing files in this folder recursively, prepared to be required as a module
echo [ >  list.js
ls -R ./ | awk '
/:$/&&f{s=$0;f=0}
/:$/&&!f{sub(/:$/,"");s=$0;f=1;next}
NF&&f{ print "\""s"/"$0"\"," }' >> list.js
echo ] >> list.js

