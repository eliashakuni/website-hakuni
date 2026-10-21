#!/bin/bash
randmax=2147483647
rm letterFrequency.txt
rm swedishLetters.txt
for letter in a b c d e f g h i j k l m n o p q r s t u v w x y z å ä ö
do 
grep -o -i $letter modifiedSwedishWordlist.txt | wc -l >> letterFrequency.txt
done
TOTAL=$(paste -s -d + letterFrequency.txt | bc)
cumulativeNumber=0
letternumber=1
for letter in a b c d e f g h i j k l m n o p q r s t u v w x y z å ä ö
do
number=$(head -n $letternumber letterFrequency.txt | tail -n 1) 
cumulativeNumber=$(echo "$cumulativeNumber+(($number*$randmax)/$TOTAL)" | bc)
echo ${letter^^} >> swedishLetters.txt
echo $cumulativeNumber >> swedishLetters.txt
letternumber=$(($letternumber+1))
done