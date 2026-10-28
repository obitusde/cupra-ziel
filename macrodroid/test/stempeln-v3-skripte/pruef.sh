D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/ohne-start; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
t() { echo "$(date +%T) $*" >> "$L"; }
grep -v 'ticket=' > "$D/pruef.txt" <<'ENDE_SEITE'
{v=seite}
ENDE_SEITE
elemente "$D/pruef.txt" > "$D/pruef-el.txt"
stand "$D/pruef-el.txt"
if [ -z "$PRES" ] && [ "$STATUS" = "?" ]; then
  t "Pruefung: Stempelseite nicht erkannt (Accueil?) - nochmal oeffnen"
  am start -a android.intent.action.VIEW -d "https://aptime.cloud-horoquartz.fr/webquartz/ux/clock" -p com.android.chrome --es com.android.browser.application_id macrodroid.stempeln </dev/null >/dev/null 2>&1
  t "am start rc=$?"
  sleep 7
else
  t "Pruefung: Stempelseite ok (Status=$STATUS, Praesenz=$PRES)"
fi
