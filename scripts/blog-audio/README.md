# Blog Audio Tooling

Site-local Python package for the portfolio blog audio pipeline.

## Runtime model
- The working CUDA runtime is copied from `../tts/.venv`.
- Blog audio generation now runs through `vllm-omni` for Qwen3 `VoiceDesign`.
- `transformers` is still used for tokenizer/config helpers needed by the vLLM prompt builder.
- The copied runtime is local-only and should not be committed.
- The design workflow has one built-in default narration prompt for blog audio when `--instruct` is omitted.
- Post narration output is stitched into one MP3 under `public/assets/post-audio/<post>/post.mp3`.
- `ffmpeg` is required for the MP3 transcode step.
- The shell must provide the same CUDA and C++ runtime support that makes `../tts/.venv` usable.

## Bootstrap
```bash
bash scripts/blog-audio/bootstrap-runtime.sh
```

## Raw voice workflow
```bash
cd scripts/blog-audio
uv run --python .venv/bin/python voice_workflow.py design --text "..." --instruct "..." --language English
```

## Blog-native wrapper
```bash
uv run --python scripts/blog-audio/.venv/bin/python scripts/blog-audio-post.py --post src/_posts/my-post.md --language English
```

## Narration defaults
- Omit `--instruct` to use the built-in narration prompt.
- Posts are chunked into paragraph-sized TTS requests.
- Default chunking targets `200-500` characters per chunk.
- Adjacent short paragraphs or list items are merged until they reach a useful chunk size.
- Long paragraphs fall back to major-punctuation splits.
- Stitching inserts `100ms` of silence between generated chunks.
- Generated sidecars preserve transcript text plus per-chunk text offsets and timeline offsets for later UI sync.
