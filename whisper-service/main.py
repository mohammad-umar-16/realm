import os
import tempfile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model import get_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CLIENT_ORIGIN", "*")],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warm_model():
    # load model at startup, not on first request — avoids a slow first transcription
    get_model()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), lang: str = Form("en")):
    # webm chunk from MediaRecorder written to a temp file — faster-whisper reads from a path
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        model = get_model()
        segments, _ = model.transcribe(tmp_path, language=lang, vad_filter=True)
        # vad_filter drops silence — short chunks are often mostly silence between words
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {"text": text}
    except Exception as e:
        # fail soft — client just skips this chunk and tries the next one
        print(f"transcription error: {e}")
        return {"text": ""}
    finally:
        os.unlink(tmp_path)
