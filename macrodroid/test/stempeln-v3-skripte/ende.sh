D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/lauf; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
t() { [ $DEBUG = 1 ] && echo "$(date +%T) $*" >> "$L"; }
jetzt
grep -v 'ticket=' > "$D/seite-nach.txt" <<'ENDE_SEITE'
{v=seite}
ENDE_SEITE
elemente "$D/seite-nach.txt" > "$D/elemente-nach.txt"
stand "$D/elemente-nach.txt"
t "Seite nachher: Status=$STATUS Praesenz=$PRES Letzte=$LETZTE Buchungen=$BUCH Pause=$PAUSE"
A_AKTION=keine; A_STATUS="?"; A_TYP=""; A_NAME=""; A_TEXT=""; A_KORR=""
[ -f "$D/aktion.txt" ] && . "$D/aktion.txt"
Z_DATUM=""; Z_ORT=""; Z_NAME=""; [ -f $B/zustand.txt ] && . $B/zustand.txt
[ "$Z_DATUM" = "$HEUTE" ] || { Z_ORT=""; Z_NAME=""; }
ort "{last_loc_lat}" "{last_loc_long}"
if [ -n "$PRES" ] && [ "$STATUS" != "?" ]; then
  # Knopf merken, mit dem eingestempelt wurde (fuers Ausstempeln)
  case "$A_AKTION" in
    tipp) Z_ORT=$A_TYP; Z_NAME=$A_NAME ;;
    manuell) Z_ORT=""; Z_NAME="" ;;
    *) if [ -z "$Z_ORT" ] && [ "$STATUS" = IN ]; then wahl EIN; Z_ORT=$KTYP; Z_NAME=$KNAME; fi ;;
  esac
  { echo "Z_DATUM=$HEUTE"; echo "Z_STATUS=$STATUS"; echo "Z_PRES=$PRES"; echo "Z_LESE=$EPOCH"; echo "Z_LETZTE=$LETZTE"; echo "Z_BUCH=$BUCH"
    echo "Z_ORT=$Z_ORT"; echo "Z_NAME='$Z_NAME'"; } > $B/zustand.txt
  ZL=""; [ -n "$Z_ORT" ] && ZL=" - $(label "$Z_ORT" "$Z_NAME")"
  REST=$(( SOLL - PRES ))
  if [ "$STATUS" = IN ]; then
    PZU=0; [ $PAUSE = 0 ] && [ $NOW -lt 870 ] && PZU=45
    if [ $REST -gt 0 ]; then INFO="heute $(hm $PRES) - noch $(hm $REST) -> fertig um $(hm $(( (NOW + REST + PZU) % 1440 )))"
      [ $PZU -gt 0 ] && INFO="$INFO (mit 45 min Pause)"
    else INFO="heute $(hm $PRES) - 8 h 25 schon voll"; fi
    KOPF="Eingestempelt${LETZTE:+ $LETZTE}$ZL"
  else
    if [ $REST -gt 0 ]; then INFO="heute $(hm $PRES) - noch $(hm $REST) offen"
      L2=$(minuten "${LETZTE:-0:00}")
      [ $L2 -ge 660 ] && [ $L2 -le 870 ] && INFO="$INFO
Pause 30 min bis $(hm $(( L2 + 30 ))), 45 min bis $(hm $(( L2 + 45 )))"
    else INFO="heute $(hm $PRES) - Feierabend"; fi
    KOPF="Ausgestempelt${LETZTE:+ $LETZTE}"
    [ "$A_AKTION" = tipp ] && KOPF="$KOPF - $(label "$A_TYP" "$A_NAME")"
  fi
  if [ "$A_AKTION" = tipp ] && [ "$STATUS" = "$A_STATUS" ]; then
    MELD="ACHTUNG: $A_TEXT getippt, aber der Stand hat sich nicht geaendert ($KOPF). Bitte pruefen!"
  elif [ "$A_AKTION" = manuell ] && [ "$STATUS" != "$A_STATUS" ]; then MELD="$KOPF (von Hand)
$INFO"
  elif [ -n "$A_TEXT" ] && [ "$A_AKTION" != tipp ]; then MELD="$A_TEXT
$KOPF - $INFO"
  else MELD="$KOPF
$INFO"; fi
else
  MELD="Stempelseite nicht gelesen - bitte selbst pruefen"
  [ "$A_AKTION" = keine ] && [ -n "$A_TEXT" ] && MELD=$A_TEXT
fi
# Erinnerung passte nicht (Stand oder Ort): nichts getippt, gleich die richtige Frage
if [ -n "$A_KORR" ] && [ "$STATUS" != "?" ]; then
  if [ "$STATUS" = OUT ]; then KZ=EIN; wahl EIN; KM="Du bist ausgestempelt${LETZTE:+ seit $LETZTE} - einstempeln? → $LABEL"
  else KZ=AUS; wahl AUS; KM="Du bist eingestempelt${LETZTE:+ seit $LETZTE} - ausstempeln? → $LABEL"; fi
  { echo "V_ZIEL=$KZ"; echo "V_ZEIT=$EPOCH"; echo "V_DATUM=$HEUTE"; echo "V_LABEL='$LABEL'"; echo "V_GRUND='Korrektur'"; } > $B/vorschlag-letzter.txt
  cp $B/vorschlag-letzter.txt $B/vorschlag.txt
  MELD="$A_TEXT. Neue Frage kommt."
  signal "$KM"
  t "Korrektur-Vorschlag: $KM"
fi
t "Meldung: $MELD"
note "$MELD" "Stempeln" stempeln
rm -f $B/lock.txt
