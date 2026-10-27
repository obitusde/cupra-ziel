D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/ohne-start; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
t() { echo "$(date +%T) $*" >> "$L"; }
jetzt
grep -v 'ticket=' > "$D/seite-nach.txt" <<'ENDE_SEITE'
{v=seite}
ENDE_SEITE
elemente "$D/seite-nach.txt" > "$D/elemente-nach.txt"
stand "$D/elemente-nach.txt"
t "Seite nachher: Status=$STATUS Knopf='$HOT' Praesenz=$PRES Letzte=$LETZTE Buchungen=$BUCH"
[ $DEBUG = 1 ] && screencap -p "$D/3-nach-neuladen.png" </dev/null >/dev/null 2>&1
A_AKTION=keine; A_STATUS="?"; A_TYP=""; A_KNOPF=""; A_TEXT=""
[ -f "$D/aktion.txt" ] && . "$D/aktion.txt"
if [ -n "$PRES" ] && [ "$STATUS" != "?" ]; then
  case "$A_AKTION" in tipp) ZORT=$A_TYP ;; manuell) ZORT="" ;; *) ZORT=$( [ -f $B/zustand.txt ] && . $B/zustand.txt && [ "$Z_DATUM" = "$HEUTE" ] && echo $Z_ORT )
      if [ -z "$ZORT" ] && [ "$STATUS" = IN ]; then ort "{last_loc_lat}" "{last_loc_long}"; [ -n "$TYP" ] && [ "$DIST" -le "$RAD" ] && ZORT=$TYP; fi ;;
  esac
  { echo "Z_DATUM=$HEUTE"; echo "Z_STATUS=$STATUS"; echo "Z_PRES=$PRES"; echo "Z_LESE=$EPOCH"; echo "Z_LETZTE=$LETZTE"; echo "Z_BUCH=$BUCH"; echo "Z_ORT=$ZORT"; } > $B/zustand.txt
  REST=$(( SOLL - PRES ))
  if [ "$STATUS" = IN ]; then
    if [ $REST -gt 0 ]; then INFO="heute $(hm $PRES) - noch $(hm $REST) -> fertig um $(hm $(( (NOW + REST) % 1440 )))"
    else INFO="heute $(hm $PRES) - 8 h 25 schon voll"; fi
    KOPF="Eingestempelt${LETZTE:+ $LETZTE}"
  else
    if [ $REST -gt 0 ]; then INFO="heute $(hm $PRES) - noch $(hm $REST) offen"
      L2=$(minuten "${LETZTE:-0:00}"); [ $L2 -ge 660 ] && [ $L2 -le 870 ] && INFO="$INFO - Pause-Erinnerung um $(hm $(( L2 + 35 )))"
    else INFO="heute $(hm $PRES) - Feierabend"; fi
    KOPF="Ausgestempelt${LETZTE:+ $LETZTE}"
  fi
  if [ "$A_AKTION" = tipp ] && [ "$STATUS" = "$A_STATUS" ]; then
    MELD="ACHTUNG: $A_TEXT getippt, aber der Stand hat sich nicht geaendert ($KOPF). Bitte pruefen!"
  elif [ "$A_AKTION" = tipp ]; then MELD="$KOPF - $A_TEXT
$INFO"
  elif [ "$A_AKTION" = manuell ] && [ "$STATUS" != "$A_STATUS" ]; then MELD="$KOPF (von Hand)
$INFO"
  elif [ -z "$A_TEXT" ]; then MELD="$KOPF
$INFO"
  else MELD="$A_TEXT
Stand: $KOPF - $INFO"; fi
else
  MELD="Stempelseite nicht gelesen - bitte selbst pruefen"
  [ "$A_AKTION" = keine ] && [ -n "$A_TEXT" ] && MELD=$A_TEXT
fi
t "Meldung: $MELD"
note "$MELD" "Stempeln" stempeln
echo "$(date '+%d.%m.%Y %H:%M') $(echo "$MELD" | tr '\n' ' ') [${D##*/}]" >> /sdcard/Download/stempeln.txt
rm -f $B/lock.txt
t "Ende"
