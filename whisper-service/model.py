import os
from faster_whisper import WhisperModel

# "base" balances accuracy vs CPU speed for near-real-time chunked transcription;
# "small"/"medium" are more accurate but too slow on CPU for ~4s chunk turnaround.
# int8 compute_type keeps CPU inference fast with acceptable accuracy loss.
MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "base")

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _model
