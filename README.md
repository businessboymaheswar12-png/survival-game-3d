# Wildfall Survival

A lightweight browser-based 3D survival game prototype optimized for low-end Chromebooks and Android/mobile browsers.

## Run locally

Open a local static server from this folder:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Included systems

- Third-person 3D movement with WASD + mouse drag camera
- Mobile touch joystick and action buttons
- Empty-handed start with no hidden item attached
- Large low-poly island, trees, rocks, water, plants, and caves-like terrain
- Day/night cycle and dangerous nighttime conditions
- Passive, defensive, and aggressive wildlife AI
- Gather resources through actual proximity interaction
- Crafting progression with earned tools and materials only
- Basic shelter and campfire systems
- Hunger, thirst, stamina, health, and temperature pressure
- Local save/load via browser storage
- Performance-focused lightweight rendering

## Notes

This project intentionally keeps assets and code lightweight for browser performance while still delivering a coherent survival progression from nothing to basic tools, shelter, fire, water management, and dangerous nights.

No advanced equipment is granted for free. Tools, shelter, and survival items are earned by gathering and crafting in-game.

## Controls

- WASD / Arrow keys: move
- Mouse drag: rotate camera
- Shift: sprint
- Space: jump
- E: interact
- F: attack
- Q: block
- Mobile: on-screen joystick and buttons

## Survival loop

1. Gather branches, stones, and fiber.
2. Craft primitive tools and rope.
3. Build a basic container and fire starter.
4. Gather water from natural sources using the container.
5. Build shelter and campfire.
6. Hunt or gather food safely.
7. Survive dangerous nights with better tools and stronger shelter.

## Future enhancement ideas

- Expand crafting tiers and stronger weapons
- Add building placement validation and snap points
- Add more advanced animal behaviors and quest content
- Add more detailed animation and sound
- Add a richer save/state system
