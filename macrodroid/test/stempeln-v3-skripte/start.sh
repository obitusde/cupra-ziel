jetzt
echo $EPOCH > $B/lock.txt
D=$B/lauf; rm -rf "$D"; mkdir -p "$D"; echo "$D" > $B/aktuell.txt
L=$D/log.txt; exec 2>>"$L"
t() { [ $DEBUG = 1 ] && echo "$(date +%T) $*" >> "$L"; }
t "__TEXT__ __V__ - Start"
gesperrt() { dumpsys window </dev/null 2>&1 | grep -cE 'isKeyguardShowing=true|mShowingLockscreen=true|mDreamingLockscreen=true'; }
n=0
while [ "$(gesperrt)" != 0 ] && [ $n -lt 60 ]; do
  [ $n = 0 ] && note "Bitte entsperren - dann geht es weiter" "Stempeln" stempeln
  sleep 1; n=$(( n + 1 ))
done
cmd statusbar collapse </dev/null >/dev/null 2>&1
t "entsperrt nach $n s, Leiste zu"
note "__TEXT__ ..." "Stempeln" stempeln
