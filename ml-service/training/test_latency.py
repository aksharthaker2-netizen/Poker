import requests
import time

url = "http://127.0.0.1:8000/decide"
payload = {
    "hole_cards": ["Ah", "Kd"],
    "community_cards": [],
    "pot_size": 15,
    "to_call": 0,
    "min_raise": 20,
    "stack_sizes": {"seat_1": 1000, "bot_seat": 1000},
    "position": "button",
    "num_active_players": 2,
    "betting_round": "preflop",
    "action_history": [],
    "bot_rating": None,
}

times = []
for i in range(50):
    start = time.time()
    response = requests.post(url, json=payload)
    elapsed = time.time() - start
    times.append(elapsed)

times.sort()
print(f"50 sequential requests to /decide:")
print(f"  Min: {times[0]*1000:.1f} ms")
print(f"  Median: {times[25]*1000:.1f} ms")
print(f"  Max: {times[-1]*1000:.1f} ms")
print(f"  All under 1s: {all(t < 1.0 for t in times)}")