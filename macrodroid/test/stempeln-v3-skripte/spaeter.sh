jetzt
echo $(( EPOCH + 900 )) > $B/spaeter.txt
rm -f $B/vorschlag.txt
note "Erinnerung in 15 min" "Stempeln" stempeln
