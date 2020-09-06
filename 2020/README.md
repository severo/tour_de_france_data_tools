# Tour de France 2020

Parse data from Tour de France 2020.

## Get data

Download the data from stage 5:

```bash
mkdir -p saved_html
wget https://www.letour.fr/en/rankings/stage-5 -O saved_html/stage5.html
```

Download the data from stage 1 to stage 8:

```bash
mkdir -p saved_html
for i in {1..8}; do wget "https://www.letour.fr/en/rankings/stage-${i}" -O saved_html/stage${i}.html; done
```
