# Design system

## Type and colour
- Fonts: IBM Plex Sans (UI), IBM Plex Mono (code). Free (OFL-1.1), served from the site itself via Fontsource (latin 400/500/600/700 Sans, 400/500/400-italic Mono).
- UI accent: indigo `#3730A3` (dark theme `#A5ACFF`). Background `#F6F7F9`, ink `#14181F`.
- All colours live in `src/styles/tokens.css`, with light and dark values. Never hard-code a colour in a component.

## UML elements (Okabe-Ito, colour-blind safe; colour is never the only signal)
| Element | Border | Fill | Stereotype |
| --- | --- | --- | --- |
| Interface / trait | `#0072B2` | `#E1EEF7` | «interface» |
| Abstract class | `#CC79A7` | `#F7E8F0` | «abstract», name in italics |
| Concrete class | `#009E73` | `#E0F3EC` | — |
| Singleton / object | `#56B4E9` | `#E6F4FB` | «singleton» |
| Enum / value | `#B8A800` | `#FCF9D9` | «enumeration» |
| Client | `#8A8F98` | `#F0F0F0` | «client» |
| Key pattern role | `#E69F00` thick border | — | role label |

Relationships: association (solid, open arrow), dependency (dashed, open arrow), aggregation (solid, hollow diamond
at the whole), composition (solid, filled diamond at the whole), inheritance (solid, hollow triangle at the parent),
realization (dashed, hollow triangle at the interface). **Draw dashed lines from the arrowhead end.**

## Code panels
Dark panel in both themes. Token colours: keyword `#C792EA`, type `#FFCB6B`, function `#82AAFF`, self/this `#F07178`,
string `#C3E88D`, number/literal `#F78C6C`, decorator `#89DDFF`, comment `#9AA3B2` italic. Highlighted lines:
background `#3A3320` with a `#E69F00` left bar; other lines dimmed when a step highlights lines.

## Animation
GSAP timelines split into labelled steps. Controls: previous / play all / next / replay / step bar / speed 0.5–2× /
voice-over (browser speech, off by default; Play waits for narration). Calls are indigo pills, return values green pills.
Respect `prefers-reduced-motion` (jump to end states).

## Layout rules
- Pattern page: header → analogy + problem → Animation & examples card (stage full width → controls →
  narration + code side by side) → UML (class / sequence) → participants → when / avoid / trade-offs →
  confused with + SOLID → quiz → practise → previous / next.
- Touch targets ≥ 44 px (48 px for primary mobile controls).
- Phones: portrait diagram layout; tables → stacked cards; sequence diagrams → numbered steps; code scrolls sideways.
