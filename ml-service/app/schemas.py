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