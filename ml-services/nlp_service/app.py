from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
import uvicorn

# Lightweight sentiment using rule-based fallback; replace with transformers for production

class SentimentRequest(BaseModel):
    text: str

class RiskRequest(BaseModel):
    price: float | None = None
    days_until_checkin: int | None = None
    is_new_user: bool | None = None
    prior_cancellations: int | None = None

app = FastAPI(title="NLP Service", version="0.1")

positive_words = {"great","amazing","clean","friendly","perfect","excellent","spacious","comfortable","cozy","nice"}
negative_words = {"bad","dirty","rude","terrible","worst","noisy","broken","smell","smelly","uncomfortable"}

def simple_sentiment(text: str):
    t = text.lower()
    pos = sum(1 for w in positive_words if w in t)
    neg = sum(1 for w in negative_words if w in t)
    if pos == 0 and neg == 0:
        return ("neutral", 0.5)
    if pos >= neg:
        score = min(1.0, 0.5 + (pos - neg) * 0.1)
        return ("positive", score)
    score = max(0.0, 0.5 - (neg - pos) * 0.1)
    return ("negative", score)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/sentiment")
def sentiment(req: SentimentRequest):
    label, score = simple_sentiment(req.text or "")
    return {"label": label, "score": score}


@app.post("/risk")
def risk(req: RiskRequest):
    # Simple interpretable scoring: higher score means higher cancel risk
    score = 0.0
    if (req.price or 0) > 5000:
        score += 0.2
    if (req.days_until_checkin or 0) > 30:
        score += 0.2
    if req.is_new_user:
        score += 0.2
    if (req.prior_cancellations or 0) > 0:
        score += min(0.4, 0.1 * req.prior_cancellations)
    score = max(0.0, min(1.0, score))
    label = "high" if score >= 0.6 else ("medium" if score >= 0.3 else "low")
    return {"risk": label, "score": score}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)


