from fastapi import FastAPI
import features
import decision_engine
from schemas import DecideRequest, DecideResponse

app = FastAPI(title="Poker ML Service", version="0.1.0")


@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    feats = features.build_feature_vector(
        hole_cards=req.hole_cards,
        community_cards=req.community_cards,
        pot_size=req.pot_size,
        to_call=req.to_call,
    )
    result = decision_engine.decide(feats, min_raise=req.min_raise)
    return DecideResponse(**result)


@app.get("/health")
def health():
    return {"status": "ok"}