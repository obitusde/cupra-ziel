# Baut stempeln/paket.txt aus stempeln/skripte/*.sh (Version = SKV in kopf.sh).
# Das Makro "Stempeln Update" laedt paket.txt von GitHub (main) und packt es auf dem Handy aus.
# Nach jeder Skript-Aenderung: SKV in kopf.sh hochzaehlen, dieses Skript laufen lassen, committen, pushen.
import os,re
H=os.path.dirname(os.path.abspath(__file__))
DATEIEN=['kopf.sh','start.sh','neu.sh','haupt.sh','ende.sh','waechter.sh','spaeter.sh','frei.sh']
v=re.search(r'^SKV=([0-9.]+)$',open(H+'/skripte/kopf.sh').read(),re.M).group(1)
t=['#STEMPELPAKET '+v,'# Stempel-Skripte fuer MacroDroid (Makro "Stempeln Update" packt aus). Nicht von Hand aendern.']
for d in DATEIEN:
    t.append('#DATEI '+d); t+=open(H+'/skripte/'+d).read().rstrip('\n').split('\n')
t+=['#DATEI VERSION',v,'#ENDE '+v]
for z in t[2:]:
    assert not z.startswith(('ENDE_PAKET','#STEMPELPAKET ','#ENDE ')) or z==t[-1], z
assert not re.search(r'(?<!\$)\{(v=|last_loc|not_)',''.join(t)), 'Magic Text im Paket'
open(H+'/paket.txt','w').write('\n'.join(t)+'\n'); print('paket.txt v'+v)
