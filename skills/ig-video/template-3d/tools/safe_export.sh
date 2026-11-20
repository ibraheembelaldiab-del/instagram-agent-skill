#!/bin/bash
# safe_export.sh in.mp4 out.mp4 — pad 0.4 s at the start (first frame held) and
# 1.2 s at the end (last frame held, music fades), constant 30 fps, keyframe at 0,
# AAC audio re-encoded, no edit list, moov atom at the front.
set -e
ffmpeg -nostdin -v error -y -i "$1" \
  -vf "tpad=start_duration=0.4:start_mode=clone:stop_duration=1.2:stop_mode=clone,fps=30,format=yuv420p" \
  -af "adelay=400:all=1,apad=pad_dur=1.2" \
  -c:v libx264 -preset medium -crf 18 -profile:v high -level 4.1 -g 30 -bf 0 \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -movflags +faststart -use_editlist 0 -shortest "$2"
