jetzt
echo $EPOCH > $B/lock.txt
if [ $DEBUG = 1 ]; then D=$B/$(date +%Y-%m-%d_%H%M%S); else D=$B/lauf; rm -rf "$D"; fi
mkdir -p "$D"; echo "$D" > $B/aktuell.txt
L=$D/log.txt
echo "$(date +%T) Stempeln __V__ - Start" > "$L"
exec 2>>"$L"
t() { echo "$(date +%T) $*" >> "$L"; }
t "Shizuku ok: $(id 2>&1 | cut -c1-40)"
gesperrt() { dumpsys window </dev/null 2>&1 | grep -cE 'isKeyguardShowing=true|mShowingLockscreen=true|mDreamingLockscreen=true'; }
n=0
while [ "$(gesperrt)" != 0 ] && [ $n -lt 60 ]; do
  [ $n = 0 ] && { note "Bitte entsperren - dann wird gestempelt" "Stempeln" stempeln; t "gesperrt, warte"; }
  sleep 2; n=$(( n + 2 ))
done
cmd statusbar collapse </dev/null >/dev/null 2>&1; t "Leiste schliessen rc=$?"
t "Sperre: $(dumpsys window </dev/null 2>&1 | grep -oE 'isKeyguardShowing=[a-z]*|mShowingLockscreen=[a-z]*|mDreamingLockscreen=[a-z]*' | sort -u | tr '\n' ' ') (gewartet $n s)"
note "Stempeln laeuft ..." "Stempeln" stempeln
