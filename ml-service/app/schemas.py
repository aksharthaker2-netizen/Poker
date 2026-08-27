from typing import Dict, List, Optional
from pydantic import BaseModel


class DecideRequest(BaseModel):
    hole_cards: List[str]
    community_cards: List[str] = []
    pot_size: float
    to_call: float
    min_raise: float
    stack_sizes: Dict[str, float]
    position: str
    num_active_players: int
    betting_round: str
    action_history: List[str] = []
    bot_rating: Optional[int] = None


class DecideResponse(BaseModel):
    action: str
    raise_amount: Optional[float] = None

class HintRequest(BaseModel):
    hole_cards: List[str]
    community_cards: List[str] = []
    pot_size: float
    to_call: float
    min_raise: float
    stack_sizes: Dict[str, float]
    position: str
    num_active_players: int
    betting_round: str
    action_history: List[str] = []


class HintResponse(BaseModel):
    suggested_action: str
    suggested_raise_amount: Optional[float] = None
    reason: str


class DecisionPoint(BaseModel):
    hole_cards: List[str]
    community_cards: List[str] = []
    pot_size: float
    to_call: float
    min_raise: float
    stack_sizes: Dict[str, float]
    position: str
    num_active_players: int
    betting_round: str
    action_history: List[str] = []
    player_action: str


class AnalyzeRequest(BaseModel):
    hand_history: List[DecisionPoint]


class Mistake(BaseModel):
    decision_point: int
    situation_summary: str
    player_action: str
    recommended_action: str
    estimated_ev_loss_bb: float


class AnalyzeResponse(BaseModel):
    accuracy_pct: float
    mistakes: List[Mistake]