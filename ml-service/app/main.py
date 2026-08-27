from fastapi import FastAPI
import features
import decision_engine
from schemas import (
    DecideRequest, DecideResponse,
    HintRequest, HintResponse,
    AnalyzeRequest, AnalyzeResponse, Mistake,
)
import predictor
import explain

app = FastAPI(title="Poker ML Service", version="0.1.0")

@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    if not req.community_cards:
        # ASSUMPTION: big blind = 10 chips, hardcoded. If the real game supports
        # variable blind structures, this needs to come from the request instead
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

@app.post("/hint", response_model=HintResponse)
def hint(req: HintRequest):
    if not req.community_cards:
        pot_size_bb = req.pot_size / 10
        strength = features.hand_strength(req.hole_cards, [])
        action = predictor.predict_preflop_action(
            hand_strength=strength,
            num_bets=len(req.action_history) or 1,
            pot_size=pot_size_bb,
            num_players=req.num_active_players,
            position=features.map_position_label(req.position),
        )
        raise_amount = req.min_raise if action == "raise" else None
        pot_odds_val = req.to_call / (req.pot_size + req.to_call) if req.to_call > 0 else 0
        reason = explain.generate_reason(action, strength, pot_odds_val, True, req.to_call)
    else:
        street_map = {3: "Flop", 4: "Turn", 5: "River"}
        street = street_map.get(len(req.community_cards), "Flop")
        strength = features.hand_strength(req.hole_cards, req.community_cards)
        action, raise_amount = predictor.predict_postflop_action(
            req.hole_cards, req.community_cards, req.pot_size, req.to_call, req.min_raise,
            num_prior_bets=len(req.action_history), is_hero_aggressor=False, street=street,
            hero_is_ip=False,
        )
        facing_bet_to_pot = req.to_call / req.pot_size if req.pot_size > 0 else 0
        reason = explain.generate_reason(action, strength, facing_bet_to_pot, False, req.to_call)

    return HintResponse(suggested_action=action, suggested_raise_amount=raise_amount, reason=reason)

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    mistakes = []
    correct_count = 0

    for i, point in enumerate(req.hand_history):
        if not point.community_cards:
            pot_size_bb = point.pot_size / 10
            recommended = predictor.predict_preflop_action(
                hand_strength=features.hand_strength(point.hole_cards, []),
                num_bets=len(point.action_history) or 1,
                pot_size=pot_size_bb,
                num_players=point.num_active_players,
                position=features.map_position_label(point.position),
            )
            situation = f"Preflop, {point.betting_round}, facing {point.to_call} to call"
        else:
            street_map = {3: "Flop", 4: "Turn", 5: "River"}
            street = street_map.get(len(point.community_cards), "Flop")
            recommended, _ = predictor.predict_postflop_action(
                point.hole_cards, point.community_cards, point.pot_size, point.to_call, point.min_raise,
                num_prior_bets=len(point.action_history), is_hero_aggressor=False, street=street,
                hero_is_ip=False,
            )
            situation = f"{street}, facing {point.to_call} to call, pot {point.pot_size}"

        if point.player_action == recommended:
            correct_count += 1
        else:
            real_ev_loss = None
            if not point.community_cards:
                strength = features.hand_strength(point.hole_cards, [])
                real_ev_loss = predictor.get_real_ev_loss(strength, point.player_action, recommended)

            if real_ev_loss is not None:
                estimated_ev_loss = real_ev_loss
            else:
                severity = {"fold": 0, "check": 0, "call": 1, "raise": 2}
                gap = abs(severity.get(point.player_action, 1) - severity.get(recommended, 1))
                estimated_ev_loss = gap * 1.5

            mistakes.append(Mistake(
                decision_point=i,
                situation_summary=situation,
                player_action=point.player_action,
                recommended_action=recommended,
                estimated_ev_loss_bb=estimated_ev_loss,
            ))

    accuracy_pct = (correct_count / len(req.hand_history) * 100) if req.hand_history else 0
    return AnalyzeResponse(accuracy_pct=round(accuracy_pct, 1), mistakes=mistakes)

@app.get("/health")
def health():
    return {"status": "ok"}