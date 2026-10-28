D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/ohne-start; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
t() { echo "$(date +%T) $*" >> "$L"; }
jetzt
grep -v 'ticket=' > "$D/seite-vor.txt" <<'ENDE_SEITE'
{v=seite}
ENDE_SEITE
elemente "$D/seite-vor.txt" > "$D/elemente-vor.txt"
stand "$D/elemente-vor.txt"
t "Seite vorher: Status=$STATUS Knopf='$HOT' Praesenz=$PRES Letzte=$LETZTE Buchungen=$BUCH"
LAT="{last_loc_lat}"; LON="{last_loc_long}"
ort "$LAT" "$LON"
t "Standort $LAT,$LON -> $TYP $NAME $DIST m (Radius $RAD)"
WUNSCH=""; [ -f $B/vorschlag.txt ] && . $B/vorschlag.txt && [ $(( EPOCH - ${V_ZEIT:-0} )) -lt 1800 ] && WUNSCH=$V_ZIEL
rm -f $B/vorschlag.txt
t "Wunsch aus Vorschlag: '${WUNSCH:-keiner}'"
[ $DEBUG = 1 ] && screencap -p "$D/1-vor-tipp.png" </dev/null >/dev/null 2>&1
AKTION=keine; KNOPF=""
if [ -z "$PRES" ] && [ "$STATUS" = "?" ]; then
  ERGT="Stempelseite nicht gelesen - nichts gestempelt, bitte selbst pruefen"
elif [ "$WUNSCH" = EIN ] && [ "$STATUS" = IN ]; then
  ERGT="Du bist schon eingestempelt - nichts getippt"
elif [ "$WUNSCH" = AUS ] && [ "$STATUS" = OUT ]; then
  ERGT="Du bist schon ausgestempelt - nichts getippt"
elif [ -z "$TYP" ] || [ "$DIST" -gt "$RAD" ]; then
  AKTION=manuell
  if [ -z "$TYP" ]; then W="kein Standort"; else W="naechster Ort $NAME, $DIST m"; fi
  ERGT="Unbekannter Ort ($W)"
  note "Unbekannter Ort ($W) - tippe selbst auf der Seite den passenden Knopf. Ich lese in 60 s nach." "Stempeln" stempeln
  t "manuell: warte 60 s"; sleep 60
else
  case "$TYP" in
    HO)  X=$HOX; Y=$HOY; KNOPF="Home Office" ;;
    SS)  X=$SSX; Y=$SSY; KNOPF="Sur Site" ;;
    HUB) X=$HUX; Y=$HUY; KNOPF="Hub" ;;
  esac
  t "Tippe $KNOPF bei $X,$Y ($NAME, $DIST m)"
  input tap $X $Y </dev/null >/dev/null 2>&1
  t "Tipp rc=$?"
  AKTION=tipp; ERGT="$KNOPF ($NAME)"
  [ $DEBUG = 1 ] && { sleep 2; screencap -p "$D/2-nach-tipp.png" </dev/null >/dev/null 2>&1; }
fi
{ echo "A_AKTION=$AKTION"; echo "A_STATUS=$STATUS"; echo "A_TYP=$TYP"; echo "A_KNOPF='$KNOPF'"; echo "A_TEXT='$ERGT'"; } > "$D/aktion.txt"
t "Aktion: $AKTION - $ERGT"
