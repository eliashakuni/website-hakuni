#!/bin/bash

# grep -E "^.+.+$" svenska-ord.txt > filename
rm modifiedFinnishWordlist.txt
egrep "^[abcdefghijklmnopqrstuvwxyzåäö]{14,16}$" originalFinnishWordlist.txt > longModifiedFinnishWordlist.txt
# egrep "^.+$" filename

# grep "aasi" sanakirja.txt >> filename
# | >modifioitusanakirja
# [abdefghijklmnoprstuvy]{2,16}