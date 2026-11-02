# Stempeln: Stand lesen, Knopf waehlen, tippen (oder bewusst nicht)
lauf
jetzt
cp $B/seite-roh.txt "$D/seite-vor.txt" 2>/dev/null
elemente "$D/seite-vor.txt" > "$D/elemente-vor.txt"
stand "$D/elemente-vor.txt"
t "Seite vorher: Status=$STATUS Praesenz=$PRES Letzte=$LETZTE Buchungen=$BUCH Agenda=$AGENDA"
ort "$LAT" "$LON"
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
if [ "$HALB" = 1 ]; then
  ERGT="Stempelseite nicht fertig geladen (30 s gewartet) - nichts getippt, bitte selbst pruefen"
elif [ "$STATUS" = "?" ]; then
  ERGT="Stempelseite nicht gelesen - nichts getippt, bitte selbst pruefen"
elif [ "$WUNSCH" = EIN ] && [ "$STATUS" = IN ]; then
  ERGT="Du warst schon eingestempelt - nichts getippt"; KORR=1
elif [ "$WUNSCH" = AUS ] && [ "$STATUS" = OUT ]; then
  ERGT="Du warst schon ausgestempelt - nichts getippt"; KORR=1
elif [ -n "$V_LABEL" ] && [ "$V_LABEL" != "$LABEL" ]; then
  ERGT="Ort passt nicht mehr zur Erinnerung ($V_LABEL, jetzt $LABEL) - nichts getippt. Stimmt $LABEL, starte Stempeln nochmal"; KORR=1
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
