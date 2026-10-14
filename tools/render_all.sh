#!/bin/bash
# usage: tools/render_all.sh <scale> <fps> <outdir> [chunks] [jobs]
set -e
S=$1; FPS=$2; OUT=$3; CH=${4:-8}; J=${5:-4}
mkdir -p "$OUT"
TOTAL=$(node -e "console.log(124)")
N=$((TOTAL*FPS)); STEP=$(( (N + CH - 1) / CH ))
seq 0 $((CH-1)) | xargs -P $J -I{} bash -c "a=\$(( {} * $STEP )); b=\$(( a + $STEP )); [ \$b -gt $N ] && b=$N; node tools/render.mjs $S $FPS \$a \$b $OUT/chunk_{}.mp4 > $OUT/log_{}.txt 2>&1"
: > $OUT/list.txt; for i in $(seq 0 $((CH-1))); do echo "file 'chunk_$i.mp4'" >> $OUT/list.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i $OUT/list.txt -c copy $OUT/video.mp4
echo ALLDONE
