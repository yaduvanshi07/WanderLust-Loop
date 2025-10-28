from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import random

# ----------- MODELS -----------

class RankRequest(BaseModel):
    userId: Optional[str] = None
    listingIds: List[str]
    context: Optional[Dict[str, Any]] = None


class Feedback(BaseModel):
    userId: Optional[str] = None
    listingId: str
    action: str
    reward: float = 0.0
    context: Optional[Dict[str, Any]] = None


# ----------- BANDIT CORE -----------

class Bandit:
    def __init__(self, decay: float = 0.995):
        self.alpha: Dict[str, float] = {}
        self.beta: Dict[str, float] = {}
        self.history: List[Dict[str, Any]] = []
        self.decay = decay

    def _ensure(self, arm: str):
        if arm not in self.alpha:
            self.alpha[arm] = 1.0
            self.beta[arm] = 1.0

    def _context_score(self, arm: str, context: Optional[Dict[str, Any]] = None) -> float:
        bonus = 0.0
        if not context:
            return bonus
        if context.get("timeOfDay") == "evening":
            bonus += 0.02
        if context.get("deviceType") == "mobile":
            bonus += 0.01
        if context.get("location") and "beach" in str(context["location"]).lower():
            bonus += 0.03
        return bonus

    def rank(self, arms: List[str], context: Optional[Dict[str, Any]] = None):
        results = []
        for arm in arms:
            self._ensure(arm)
            sample = random.betavariate(self.alpha[arm], self.beta[arm])
            sample += self._context_score(arm, context)
            sample = min(1.0, max(0.0, sample))
            results.append((arm, sample, self._explain(arm)))
        results.sort(key=lambda x: x[1], reverse=True)
        return results

    def update(self, arm: str, reward: float):
        r = max(0.0, min(1.0, reward))
        self._ensure(arm)

        # Apply decay
        self.alpha[arm] = 1.0 + (self.alpha[arm] - 1.0) * self.decay
        self.beta[arm] = 1.0 + (self.beta[arm] - 1.0) * self.decay

        # Update posterior
        self.alpha[arm] += r
        self.beta[arm] += (1.0 - r)

        expected = self.alpha[arm] / (self.alpha[arm] + self.beta[arm])
        self.history.append({
            "listingId": arm,
            "reward": r,
            "expectedCTR": round(expected, 4)
        })

    def _explain(self, arm: str) -> Dict[str, Any]:
        alpha, beta = self.alpha[arm], self.beta[arm]
        expected = alpha / (alpha + beta)
        clicks = alpha - 1
        total = (alpha + beta) - 2

        factors = []
        if expected > 0.6:
            factors.append({"type": "click_rate", "message": f"High engagement rate ({expected*100:.0f}%)"})
        if total > 5:
            factors.append({"type": "popular", "message": f"{int(total)} past interactions"})
        if clicks > 2:
            factors.append({"type": "engagement", "message": f"{int(clicks)} successful clicks"})
        if not factors:
            factors.append({"type": "default", "message": "Recommended based on user similarity"})

        return {
            "expectedReward": round(expected, 3),
            "confidence": "high" if total > 10 else ("medium" if total > 3 else "low"),
            "factors": factors[:2]
        }

    def get_ctr_history(self, limit: int = 100):
        return self.history[-limit:]


# ----------- FASTAPI SERVICE -----------

app = FastAPI(title="Contextual Bandit Service", version="0.4")
bandit = Bandit()


@app.get("/")
def home():
    return {"message": "Bandit service running", "try": "/dashboard"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/rank")
def rank(req: RankRequest):
    results = bandit.rank(req.listingIds, req.context)
    ranked_ids = [item[0] for item in results]
    explanations = {item[0]: item[2] for item in results}
    return {"rankedIds": ranked_ids, "explanations": explanations}


@app.post("/feedback")
def feedback(fb: Feedback):
    bandit.update(fb.listingId, fb.reward)
    return {"ok": True, "updated": fb.listingId}


@app.get("/stats/ctr")
def ctr_stats():
    return {"history": bandit.get_ctr_history()}


# ----------- DASHBOARD (HTML VIEW) -----------

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    html = """
    <html>
    <head>
        <title>Bandit CTR Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body style="font-family: Arial; background: #f5f6fa; padding: 40px;">
        <h2>📊 Bandit CTR History</h2>
        <canvas id="ctrChart" width="800" height="400"></canvas>
        <script>
        async function loadData() {
            const res = await fetch('/stats/ctr');
            const data = await res.json();
            const history = data.history;

            const labels = history.map((_, i) => i + 1);
            const ctr = history.map(h => h.expectedCTR);

            const ctx = document.getElementById('ctrChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Expected CTR',
                        data: ctr,
                        borderWidth: 2,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.25,
                        fill: true
                    }]
                },
                options: {
                    responsive: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
        }
        loadData();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


# ----------- ENTRY POINT -----------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
