import sys
from pathlib import Path
import pandas as pd

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

    street_dummies = pd.get_dummies(df["evaluation_at"], prefix="street").astype(int)
    position_dummies = pd.get_dummies(df["hero_position"], prefix="pos").astype(int)

    X = pd.concat([
        df[["our_hand_strength", "pot_size"]],
        street_dummies,
        position_dummies,
    ], axis=1)

    y = df["action_label"]
    return X, y