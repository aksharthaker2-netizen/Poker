import sys
from pathlib import Path
import pandas as pd
import re
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
from features import hand_strength

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)

ALL_POSITIONS = ["BB", "BTN", "CO", "HJ", "SB", "UTG"]


def _normalize_action(decision):
    if decision in ("fold", "call", "check"):
        return decision
    return "raise"


def _compute_strength(holding):
    card1 = holding[0:2]
    card2 = holding[2:4]
    return hand_strength([card1, card2], [])


def load_preflop_split(url, cache_filename):
    local_path = DATA_DIR / cache_filename
    if local_path.exists():
        df = pd.read_csv(local_path)
    else:
        df = pd.read_csv(url)
        df.to_csv(local_path, index=False)

    df = df.drop(columns=["Unnamed: 0"], errors="ignore")
    df["action_label"] = df["correct_decision"].apply(_normalize_action)
    df["our_hand_strength"] = df["hero_holding"].apply(_compute_strength)

    X = df[["our_hand_strength", "num_bets", "pot_size", "num_players"]].copy()
    for pos in ALL_POSITIONS:
        X[f"pos_{pos}"] = (df["hero_pos"] == pos).astype(int)

    y = df["action_label"]
    return X, y


def _normalize_postflop_decision(decision):
    if decision in ("Fold", "Call", "Check"):
        return decision.lower()
    return "raise"


def _get_board_for_street(row):
    if row["evaluation_at"] == "Flop":
        return [row["board_flop"][i:i+2] for i in range(0, 6, 2)]
    elif row["evaluation_at"] == "Turn":
        flop = [row["board_flop"][i:i+2] for i in range(0, 6, 2)]
        return flop + [row["board_turn"]]
    else:
        flop = [row["board_flop"][i:i+2] for i in range(0, 6, 2)]
        return flop + [row["board_turn"], row["board_river"]]


def _count_aggression(action_str):
    if pd.isna(action_str):
        return 0
    return action_str.count("BET") + action_str.count("RAISE")


def _board_texture(cards):
    ranks = [c[0] for c in cards]
    suits = [c[1] for c in cards]
    is_paired = int(len(ranks) != len(set(ranks)))
    suit_counts = {s: suits.count(s) for s in set(suits)}
    flush_possible = int(max(suit_counts.values()) >= 3)
    return is_paired, flush_possible


def _facing_bet_amount(action_str):
    if pd.isna(action_str) or action_str == "":
        return 0
    matches = re.findall(r"(?:BET|RAISE)_(\d+)", action_str)
    return int(matches[-1]) if matches else 0


_RANK_TO_NUM = {r: i for i, r in enumerate("23456789TJQKA", start=2)}


def _straight_possible(cards):
    nums = sorted(set(_RANK_TO_NUM[c[0]] for c in cards))
    if len(nums) < 2:
        return 0
    return int(nums[-1] - nums[0] <= 4)

def load_postflop_split(url, cache_filename):
    local_path = DATA_DIR / cache_filename
    if local_path.exists():
        df = pd.read_csv(local_path)
    else:
        df = pd.read_csv(url)
        df.to_csv(local_path, index=False)

    df["action_label"] = df["correct_decision"].apply(_normalize_postflop_decision)
    df["community_cards"] = df.apply(_get_board_for_street, axis=1)
    df["our_hand_strength"] = df.apply(
        lambda row: hand_strength([row["holding"][0:2], row["holding"][2:4]], row["community_cards"]),
        axis=1,
    )
    df["num_prior_bets"] = df["postflop_action"].apply(_count_aggression)
    df["is_hero_aggressor"] = (df["hero_position"] == df["aggressor_position"]).astype(int)
    df["facing_bet_to_pot"] = df["postflop_action"].apply(_facing_bet_amount) / df["pot_size"].replace(0, 1)

    texture = df["community_cards"].apply(_board_texture)
    df["board_paired"] = texture.apply(lambda t: t[0])
    df["board_flush_possible"] = texture.apply(lambda t: t[1])
    df["board_straight_possible"] = df["community_cards"].apply(_straight_possible)

    street_dummies = pd.get_dummies(df["evaluation_at"], prefix="street").astype(int)
    position_dummies = pd.get_dummies(df["hero_position"], prefix="pos").astype(int)

    X = pd.concat([
        df[["our_hand_strength", "pot_size", "num_prior_bets", "is_hero_aggressor",
            "facing_bet_to_pot", "board_paired", "board_flush_possible", "board_straight_possible"]],
        street_dummies,
        position_dummies,
    ], axis=1)

    y = df["action_label"]
    return X, y