B=/sdcard/Download/stempeln
mkdir -p $B
DEBUG=1
SOLL=505
ORTE="__ORTE__"
note() { cmd notification post -S bigtext -t "$2" "$3" "$1" </dev/null >/dev/null 2>&1; }
jetzt() { if [ -n "$T_JETZT" ]; then set -- $T_JETZT; else set -- $(date '+%Y %m %d %H %M %u %s'); fi
  JJ=$1; MM=${2#0}; TT=${3#0}; HH=${4#0}; MI=${5#0}; WT=$6; EPOCH=$7; HEUTE=$1-$2-$3; NOW=$(( ${HH:-0}*60 + ${MI:-0} )); }
hm() { echo "$(( $1 / 60 )):$(( $1 % 60 / 10 ))$(( $1 % 10 ))"; }
minuten() { h=${1%%:*}; m=${1#*:}; h=${h#0}; m=${m#0}; echo $(( ${h:-0}*60 + ${m:-0} )); }
mikro() { g=${1%%.*}; f=${1#*.}; [ "$f" = "$1" ] && f=0; f=${f}000000; f=${f%"${f#??????}"}; echo $(( g*1000000 + 1$f - 1000000 )); }
wurzel() { n=$1; x=$n; [ $x -le 1 ] && { echo $x; return; }; y=$(( (x+1)/2 )); while [ $y -lt $x ]; do x=$y; y=$(( (x + n/x)/2 )); done; echo $x; }
abst() { a=$(( $1 - $3 )); b=$(( $2 - $4 )); [ $a -lt 0 ] && a=$(( -a )); [ $b -lt 0 ] && b=$(( -b ))
  if [ $a -gt 200000 ] || [ $b -gt 200000 ]; then echo 99999; return; fi
  a=$(( a*1112/10000 )); b=$(( b*766/10000 )); wurzel $(( a*a + b*b )); }
# naechster Ort -> TYP DIST RAD NAME (TYP leer = kein gueltiger Standort)
ort() { TYP=""; DIST=""; RAD=""; NAME=""; ORTLISTE=""
  case "$1$2" in *[0-9].[0-9]*[0-9].[0-9]*) ;; *) return ;; esac
  la=$(mikro "$1"); lo=$(mikro "$2")
  set -f; alt=$IFS; IFS='|'
  for o in $ORTE; do
    IFS=';'; set -- $o; IFS='|'
    [ $# -ge 4 ] || continue
    e=$(abst $la $lo $(mikro "$2") $(mikro "$3")); r=${5:-800}
    if [ "$e" = 99999 ]; then ORTLISTE="$ORTLISTE
$4: ueber 20 km"; else ORTLISTE="$ORTLISTE
$4: $e m"; fi
    if [ -z "$DIST" ] || [ "$e" -lt "$DIST" ]; then TYP=$1; DIST=$e; RAD=$r; NAME=$4; fi
  done
  IFS=$alt; set +f; }
