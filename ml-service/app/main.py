from fastapi import FastAPI
import features
import decision_engine
from schemas import DecideRequest, DecideResponse
import predictor

app = FastAPI(title="Poker ML Service", version="0.1.0")


@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    if not req.community_cards:
        action = predictor.predict_preflop_action(
            hand_strength=features.hand_strength(req.hole_cards, []),
            num_bets=len(req.action_history),
            pot_size=req.pot_size,
            num_players=req.num_active_players,
            position=req.position,
        )
        raise_amount = req.min_raise if action == "raise" else None
        return DecideResponse(action=action, raise_amount=raise_amount)

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