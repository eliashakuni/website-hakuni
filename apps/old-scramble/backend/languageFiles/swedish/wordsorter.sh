#!/bin/bash

# grep -E "^.+.+$" svenska-ord.txt > filename
rm modifiedSwedishWordlist.txt
egrep "^[abcdefghijklmnopqrstuvwxyzåäö]{3,16}$" originalSwedishWordlist.txt > modifiedSwedishWordlist.txt
# egrep "^.+$" filename

# grep "aasi" sanakirja.txt >> filename
# | >modifioitusanakirja
# [abdefghijklmnoprstuvy]{2,16}