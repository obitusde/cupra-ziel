# Wörterbuch aus "Bildschirminhalt lesen" -> Zeilen "x|y|Text"
elemente() { x=""; y=""
  while IFS= read -r z; do
    case "$z" in
      "-- [centerX]: "*) x=${z#*: } ;;
      "-- [centerY]: "*) y=${z#*: } ;;
      "-- [text]: "*) s=${z#*\]: }; [ -n "$s" ] && echo "$x|$y|$s" ;;
    esac
  done < "$1"; }
# Stand aus Elementliste $1: STATUS (IN/OUT/?), PRES (Minuten, leer = nicht gelesen), LETZTE, BUCH, Knopf-Positionen
stand() { STATUS="?"; HOT=""; PRES=""; HOX=113; HOY=436; SSX=70; SSY=567; HUX=172; HUY=567; ZEITEN=""
  while IFS='|' read -r x y s; do
    case "$x$y" in *[!0-9]*|"") continue ;; esac
    if [ "$x" -lt 600 ]; then
      case "$s" in
        *" HOME OFFICE") HOT=$s; HOX=$x; HOY=$y
          case "$s" in SORTIE*) STATUS=IN ;; ENTR*) STATUS=OUT ;; esac ;;
        "SUR SITE") SSX=$x; SSY=$y ;;
        HUB) HUX=$x; HUY=$y ;;
        *"Temps de pr"*) p=${s%%[!0-9:]*}; case "$p" in *[0-9]:[0-9][0-9]) PRES=$(minuten "$p") ;; esac ;;
      esac
    elif [ "$x" -gt 720 ]; then
      case "$s" in [0-2][0-9]:[0-5][0-9]) ZEITEN="$ZEITEN $s" ;; esac
    fi
  done < "$1"
  LETZTE=""; BUCH=0
  for s in $(for s in $ZEITEN; do echo $s; done | sort -u); do LETZTE=$s; BUCH=$(( BUCH + 1 )); done; }
