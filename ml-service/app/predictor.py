import joblib
from pathlib import Path
import pandas as pd
import features
MODEL_DIR = Path(__file__).resolve().parent / "model"
_model = joblib.load(MODEL_DIR / "xgboost_model.pkl")
_label_encoder = joblib.load(MODEL_DIR / "label_encoder.pkl")

ALL_POSITIONS = ["BB", "BTN", "CO", "HJ", "SB", "UTG"]
import json

with open(MODEL_DIR / "ev_lookup.json") as f:
    _ev_lookup = json.load(f)

_EV_BUCKETS = [(0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]


def get_real_ev_loss(hand_strength, player_action, recommended_action):
    for low, high in _EV_BUCKETS:
        if low <= hand_strength <= high:
            bucket_key = f"{low if low > 0 else -0.001}-{high}"
            bucket_data = _ev_lookup.get(bucket_key, {})
            player_ev = bucket_data.get(player_action)
            recommended_ev = bucket_data.get(recommended_action)
            if player_ev is not None and recommended_ev is not None:
                return round(recommended_ev - player_ev, 2)
            return None
    return None

def predict_preflop_action(hand_strength, num_bets, pot_size, num_players, position):
    row = {
        "our_hand_strength": hand_strength,
        "num_bets": num_bets,
        "pot_size": pot_size,
        "num_players": num_players,
    }
    for pos in ALL_POSITIONS:
        row[f"pos_{pos}"] = 1 if position == pos else 0

    X = pd.DataFrame([row])
    prediction_encoded = _model.predict(X)[0]
    action = _label_encoder.inverse_transform([prediction_encoded])[0]
    return action

def predict_headsup_opening_action(hand_strength, min_raise):
    if hand_strength < 0.26:
        return "fold", None
    else:
        return "raise", min_raise

_postflop_model = joblib.load(MODEL_DIR / "postflop_xgboost_model.pkl")
_postflop_label_encoder = joblib.load(MODEL_DIR / "postflop_label_encoder.pkl")


_raise_downgrade_count = [0]

def predict_postflop_action(hole_cards, community_cards, pot_size, to_call, min_raise,
                             num_prior_bets, is_hero_aggressor, street, hero_is_ip):
    strength = features.hand_strength(hole_cards, community_cards)
    is_paired, flush_possible = features.board_texture(community_cards)
    straight_poss = features.straight_possible(community_cards)
    facing_bet_to_pot = (to_call / pot_size) if pot_size > 0 else 0

    row = {
        "our_hand_strength": strength,
        "pot_size": pot_size,
        "num_prior_bets": num_prior_bets,
        "is_hero_aggressor": int(is_hero_aggressor),
        "facing_bet_to_pot": facing_bet_to_pot,
        "board_paired": is_paired,
        "board_flush_possible": flush_possible,
        "board_straight_possible": straight_poss,
        "street_Flop": 1 if street == "Flop" else 0,
        "street_River": 1 if street == "River" else 0,
        "street_Turn": 1 if street == "Turn" else 0,
        "pos_IP": 1 if hero_is_ip else 0,
        "pos_OOP": 0 if hero_is_ip else 1,
    }
    X = pd.DataFrame([row])
    X = X[_postflop_model.feature_names_in_]

    prediction_encoded = _postflop_model.predict(X)[0]
    action = _postflop_label_encoder.inverse_transform([prediction_encoded])[0]

    if action == "fold" and to_call <= 0:
        action = "check"
    if action == "raise" and to_call > 0:
        _raise_downgrade_count[0] += 1
        action = "call"

    if action == "raise":
        return "raise", min_raise
    elif action in ("check", "call") and to_call <= 0:
        return "call", None
    else:
        return action, None

import math

def get_real_ev_loss(hand_strength, player_action, recommended_action):
    for low, high in _EV_BUCKETS:
        if low <= hand_strength <= high:
            bucket_key = f"{low if low > 0 else -0.001}-{high}"
            bucket_data = _ev_lookup.get(bucket_key, {})
            player_ev = bucket_data.get(player_action)
            recommended_ev = bucket_data.get(recommended_action)
            if player_ev is None or recommended_ev is None:
                return None
            if math.isnan(player_ev) or math.isnan(recommended_ev):
                return None
            return round(recommended_ev - player_ev, 2)
    return None

import random as _rand

_WORSE_ACTION = {
    "raise": "call",
    "call": "fold",
    "check": "fold",
    "fold": "check",
}


def apply_mistake_rate(action, raise_amount, mistake_rate):
    if _rand.random() < mistake_rate:
        downgraded = _WORSE_ACTION.get(action, action)
        new_raise_amount = raise_amount if downgraded == "raise" else None
        return downgraded, new_raise_amount
    return action, raise_amount

RATING_TIERS = {
    400: 0.55,
    800: 0.35,
    1200: 0.15,
    1600: 0.0,
}


def predict_rated_action(base_action, base_raise_amount, bot_rating):
    mistake_rate = RATING_TIERS.get(bot_rating, 0.0)
    return apply_mistake_rate(base_action, base_raise_amount, mistake_rate)

import numpy as np

def blend_with_heuristic(model_action, model_raise, heuristic_action, heuristic_raise, blend_weight):
    if np.random.random() < blend_weight:
        return heuristic_action, heuristic_raise
    return model_action, model_raise

RATING_CONFIG = {
    400: {"mistake_rate": 0.40, "noise_level": 0.25, "blend_weight": 0.50},
    800: {"mistake_rate": 0.25, "noise_level": 0.15, "blend_weight": 0.30},
    1200: {"mistake_rate": 0.10, "noise_level": 0.08, "blend_weight": 0.10},
    1600: {"mistake_rate": 0.0, "noise_level": 0.0, "blend_weight": 0.0},
}