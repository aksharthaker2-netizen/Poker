from fastapi import FastAPI
import features
import decision_engine
from schemas import DecideRequest, DecideResponse
import predictor

app = FastAPI(title="Poker ML Service", version="0.1.0")

@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    if not req.community_cards:
        pot_size_bb = req.pot_size / 10
        action = predictor.predict_preflop_action(
            hand_strength=features.hand_strength(req.hole_cards, []),
            num_bets=len(req.action_history) or 1,
            pot_size=pot_size_bb,
            num_players=req.num_active_players,
            position=features.map_position_label(req.position),
        )
        raise_amount = req.min_raise if action == "raise" else None
        return DecideResponse(action=action, raise_amount=raise_amount)

    street_map = {3: "Flop", 4: "Turn", 5: "River"}
    street = street_map.get(len(req.community_cards), "Flop")
    action, raise_amount = predictor.predict_postflop_action(
        req.hole_cards, req.community_cards, req.pot_size, req.to_call, req.min_raise,
        num_prior_bets=len(req.action_history), is_hero_aggressor=False, street=street,
        hero_is_ip=False,
    )
    return DecideResponse(action=action, raise_amount=raise_amount)

@app.get("/health")
def health():
    return {"status": "ok"}