# SVG Specifications

## Required Attributes

```
viewBox="0 0 640 360"
```

Always use exactly this viewBox for 16:9 aspect ratio.

## Permitted Elements

| Element | Use For |
|---------|---------|
| `<rect>` | Buildings, windows, doors, frames |
| `<circle>` / `<ellipse>` | Heads, suns, lamps, wheels |
| `<line>` | Arms, legs, horizon, light rays |
| `<path>` | Simple curves only (hair, fabric) |
| `<polygon>` | Simple geometric shapes |

## Color Constraints

- **stroke**: `#222222` (near-black)
- **stroke-width**: `2` to `3`
- **fill**: `none` or `#f5f5f5` / `#eeeeee`
- **background**: `#ffffff` or `#fafafa`
- **No gradients, filters, shadows, opacity**

## Sketch Style

Think thumbnail pencil sketch:

1. **Character**: Circle head + oval body + line limbs
2. **Environment**: 2-3 key shapes only, don't overcrowd
3. **Camera**: Implied by composition
4. **Ground line**: Anchors figures

## Prohibited

- Detailed facial features
- Text labels or annotations
- Multiple scenes per panel
- Photo-realistic rendering
- Watermarks or signatures
