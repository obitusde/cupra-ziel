# Stempelseite nicht erkannt (Accueil oder noch am Laden): nochmal oeffnen, 7 s warten
D=$(cat $B/aktuell.txt 2>/dev/null); [ -d "$D" ] || { D=$B/lauf; mkdir -p "$D"; }
L=$D/log.txt; exec 2>>"$L"
am start -a android.intent.action.VIEW -d "https://aptime.cloud-horoquartz.fr/webquartz/ux/clock" -p com.android.chrome --es com.android.browser.application_id macrodroid.stempeln </dev/null >/dev/null 2>&1
sleep 7
