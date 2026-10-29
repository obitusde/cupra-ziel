jetzt
W=$B/waechter.log
w() { [ $DEBUG = 1 ] && echo "$(date '+%d.%m. %H:%M') $*" >> $W; }
exec 2>>$B/fehler.log
# laeuft gerade Stempeln?
[ -f $B/lock.txt ] && [ $(( EPOCH - $(cat $B/lock.txt) )) -lt 240 ] && { w "Stempeln laeuft - nichts"; exit 0; }
# Arbeitstag? Mo-Fr, kein Waadtlaender Feiertag, nicht frei
tagnr() { y=$1; m=$2; d=$3; [ $m -le 2 ] && y=$(( y - 1 )); era=$(( y / 400 )); yoe=$(( y - era*400 ))
  if [ $m -gt 2 ]; then mp=$(( m - 3 )); else mp=$(( m + 9 )); fi
  doy=$(( (153*mp + 2)/5 + d - 1 )); doe=$(( yoe*365 + yoe/4 - yoe/100 + doy )); echo $(( era*146097 + doe - 719468 )); }
feiertag() { y=$1; n=$2
  a=$(( y % 19 )); b=$(( y / 100 )); c=$(( y % 100 )); d=$(( b / 4 )); e=$(( b % 4 )); f=$(( (b + 8) / 25 )); g=$(( (b - f + 1) / 3 ))
  h=$(( (19*a + b - d - g + 15) % 30 )); i=$(( c / 4 )); k=$(( c % 4 )); l=$(( (32 + 2*e + 2*i - h - k) % 7 )); m=$(( (a + 11*h + 22*l) / 451 ))
  om=$(( (h + l - 7*m + 114) / 31 )); od=$(( (h + l - 7*m + 114) % 31 + 1 )); os=$(tagnr $y $om $od)
  s1=$(tagnr $y 9 1); wd=$(( (s1 + 4) % 7 )); bettag=$(( s1 + (7 - wd) % 7 + 15 ))
  for f in $(tagnr $y 1 1) $(tagnr $y 1 2) $(( os - 2 )) $(( os + 1 )) $(( os + 39 )) $(( os + 50 )) $(tagnr $y 8 1) $bettag $(tagnr $y 12 25); do
    [ $f = $n ] && return 0; done; return 1; }
HN=$(tagnr $JJ $MM $TT)
FREI="{v=frei_bis}"; FN=0
case "$FREI" in *[0-9].*[0-9].*[0-9]*) fd=${FREI%%.*}; r=${FREI#*.}; fm=${r%%.*}; fy=${r#*.}; fd=${fd#0}; fm=${fm#0}; [ ${#fy} = 2 ] && fy=20$fy; FN=$(tagnr $fy $fm $fd) ;; esac
GRUND=""
[ $WT -gt 5 ] && GRUND="Wochenende"
feiertag $JJ $HN && GRUND="Feiertag"
[ $HN -lt $FN ] && GRUND="frei bis $FREI"
ruhe() { [ "$(cat $B/ruhe.txt 2>/dev/null)" = "$HEUTE" ] && exit 0
  echo "$HEUTE" > $B/ruhe.txt; w "Ruhe: $1"; note "Stempel-Ruhe · $1" "Stempel-Ruhe" ruhe; exit 0; }
[ -n "$GRUND" ] && ruhe "$GRUND"
# Stand vom letzten Stempeln
Z_DATUM=""; Z_STATUS=OUT; Z_PRES=0; Z_LESE=$EPOCH; Z_LETZTE=""; Z_BUCH=0; Z_ORT=""; Z_NAME=""
[ -f $B/zustand.txt ] && . $B/zustand.txt
[ "$Z_DATUM" != "$HEUTE" ] && { Z_STATUS=OUT; Z_PRES=0; Z_LESE=$EPOCH; Z_LETZTE=""; Z_BUCH=0; Z_ORT=""; Z_NAME=""; }
P=$Z_PRES; [ "$Z_STATUS" = IN ] && P=$(( Z_PRES + (EPOCH - Z_LESE) / 60 ))
[ "$Z_STATUS" = OUT ] && [ $P -ge $SOLL ] && ruhe "Feierabend ($(hm $P))"
# spaeter?
[ -f $B/spaeter.txt ] && [ $EPOCH -lt $(cat $B/spaeter.txt) ] && { w "spaeter - nichts"; exit 0; }
ort "{last_loc_lat}" "{last_loc_long}"
DA=""; [ -n "$TYP" ] && [ "$DIST" -le "$RAD" ] && DA=$TYP
ZIEL=""; MSG=""; GRUND=""; WDH=15
if [ "$Z_STATUS" = IN ]; then
  if [ $P -ge $SOLL ]; then ZIEL=AUS; GRUND="8 h 25 voll"; UE=$(( P - SOLL ))
    MSG="8 h 25 voll seit $(hm $(( (NOW - UE + 1440) % 1440 )))"; [ $UE -ge 5 ] && MSG="$MSG (+$UE min)"; MSG="$MSG - ausstempeln?"
  elif [ $NOW -ge 705 ] && [ $NOW -lt 870 ] && [ $(minuten "${Z_LETZTE:-0:00}") -lt 660 ]; then
    ZIEL=AUS; GRUND="Mittagspause"; MSG="Mittagspause (heute $(hm $P)) - ausstempeln?"
  elif [ "$Z_ORT" = SS ] || [ "$Z_ORT" = HUB ]; then
    if [ -n "$TYP" ] && { [ "$TYP" != SS ] && [ "$TYP" != HUB ] || [ "$DIST" -gt $(( RAD + 200 )) ]; }; then
      ZIEL=AUS; GRUND="Buero verlassen"; MSG="Buero verlassen (heute $(hm $P)) - ausstempeln?"; fi
  fi
elif [ "$Z_BUCH" = 0 ]; then
  case "$DA" in
    SS|HUB) ZIEL=EIN; GRUND="Ankunft"; MSG="Angekommen - einstempeln?"; [ $NOW -lt 480 ] && WDH=9999 ;;
    HO) if { [ $WT = 2 ] || [ $WT = 5 ]; } && [ $NOW -ge 450 ] && [ $NOW -lt 660 ]; then ZIEL=EIN; GRUND="Home Office"; MSG="Zu Hause - einstempeln?"
        elif [ $NOW -ge 495 ] && [ $NOW -lt 660 ]; then ZIEL=EIN; GRUND="Home Office"; MSG="Noch zu Hause - heute Home Office? Einstempeln?"; fi ;;
  esac
else
  LZ=$(minuten "${Z_LETZTE:-0:00}")
  if [ $LZ -ge 660 ] && [ $LZ -le 870 ] && [ $NOW -ge $(( LZ + 35 )) ] && [ $NOW -le $(( LZ + 180 )) ]; then
    ZIEL=EIN; GRUND="Pause vorbei"; MSG="Pause seit $(( NOW - LZ )) min (heute $(hm $P)) - wieder einstempeln?"; fi
fi
w "Stand=$Z_STATUS heute=$(hm $P) Ort=${TYP:-?} ${DIST:-} m da=${DA:-nein} -> ${ZIEL:-nichts}"
[ -z "$ZIEL" ] && exit 0
wahl $ZIEL
MSG="$MSG → $LABEL"
V_ZIEL=""; V_ZEIT=0; V_DATUM=""; V_LABEL=""
[ -f $B/vorschlag-letzter.txt ] && . $B/vorschlag-letzter.txt
# gleiche Frage (Richtung und Knopf) erst nach WDH Minuten wiederholen
if [ "$V_ZIEL" = "$ZIEL" ] && [ "$V_LABEL" = "$LABEL" ] && [ "$V_DATUM" = "$HEUTE" ] && [ $(( (EPOCH - V_ZEIT) / 60 )) -lt $WDH ]; then exit 0; fi
{ echo "V_ZIEL=$ZIEL"; echo "V_ZEIT=$EPOCH"; echo "V_DATUM=$HEUTE"; echo "V_LABEL='$LABEL'"; echo "V_GRUND='$GRUND'"; } > $B/vorschlag-letzter.txt
cp $B/vorschlag-letzter.txt $B/vorschlag.txt
w "Vorschlag: $MSG"
signal "$MSG"
