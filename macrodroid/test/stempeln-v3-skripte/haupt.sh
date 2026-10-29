D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/lauf; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
t() { [ $DEBUG = 1 ] && echo "$(date +%T) $*" >> "$L"; }
jetzt
grep -v 'ticket=' > "$D/seite-vor.txt" <<'ENDE_SEITE'
{v=seite}
ENDE_SEITE
elemente "$D/seite-vor.txt" > "$D/elemente-vor.txt"
stand "$D/elemente-vor.txt"
t "Seite vorher: Status=$STATUS Praesenz=$PRES Letzte=$LETZTE Buchungen=$BUCH"
ort "{last_loc_lat}" "{last_loc_long}"
t "Standort -> $TYP $NAME $DIST m (Radius $RAD)"
# Vorschlag (Knopf in der Erinnerung), gilt 30 min
WUNSCH=""; V_ZIEL=""; V_ZEIT=0; V_LABEL=""
[ -f $B/vorschlag.txt ] && . $B/vorschlag.txt && [ $(( EPOCH - ${V_ZEIT:-0} )) -lt 1800 ] && WUNSCH=$V_ZIEL
[ -n "$WUNSCH" ] || V_LABEL=""
rm -f $B/vorschlag.txt
Z_DATUM=""; Z_ORT=""; Z_NAME=""; [ -f $B/zustand.txt ] && . $B/zustand.txt
[ "$Z_DATUM" = "$HEUTE" ] || { Z_ORT=""; Z_NAME=""; }
# Ausstempeln mit dem Knopf vom Einstempeln, Einstempeln nach Standort
if [ "$STATUS" = IN ]; then wahl AUS; else wahl EIN; fi
t "Wunsch '${WUNSCH:-keiner}' ($V_LABEL), jetzt: $LABEL"
AKTION=keine; KORR=""
if [ -z "$PRES" ] && [ "$STATUS" = "?" ]; then
  ERGT="Stempelseite nicht gelesen - nichts gestempelt, bitte selbst pruefen"
elif [ "$WUNSCH" = EIN ] && [ "$STATUS" = IN ]; then
  ERGT="Du bist schon eingestempelt - nichts getippt"; KORR=AUS
elif [ "$WUNSCH" = AUS ] && [ "$STATUS" = OUT ]; then
  ERGT="Du bist schon ausgestempelt - nichts getippt"; KORR=EIN
elif [ -n "$V_LABEL" ] && [ "$V_LABEL" != "$LABEL" ]; then
  ERGT="Ort passt nicht mehr zur Erinnerung ($V_LABEL, jetzt $LABEL) - nichts getippt"; KORR=$WUNSCH
elif [ -z "$KTYP" ]; then
  AKTION=manuell
  ERGT="Unbekannter Ort"
  note "Unbekannter Ort - tippe selbst auf der Seite den passenden Knopf. Ich lese in 60 s nach." "Stempeln" stempeln
  sleep 60
else
  case "$KTYP" in
    HO)  X=$HOX; Y=$HOY ;;
    SS)  X=$SSX; Y=$SSY ;;
    HUB) X=$HUX; Y=$HUY ;;
  esac
  input tap $X $Y </dev/null >/dev/null 2>&1
  t "Tipp $LABEL bei $X,$Y rc=$?"
  AKTION=tipp; ERGT=$LABEL
fi
{ echo "A_AKTION=$AKTION"; echo "A_STATUS=$STATUS"; echo "A_TYP=$KTYP"; echo "A_NAME='$KNAME'"; echo "A_TEXT='$ERGT'"; echo "A_KORR=$KORR"; } > "$D/aktion.txt"
t "Aktion: $AKTION - $ERGT"
