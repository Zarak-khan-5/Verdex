---
name: Obsidian Forest
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#e0e2ee'
  on-surface-variant: '#bec9c2'
  inverse-surface: '#e0e2ee'
  inverse-on-surface: '#2d303a'
  outline: '#89938d'
  outline-variant: '#3f4944'
  surface-tint: '#8bd6b6'
  primary: '#8bd6b6'
  on-primary: '#003828'
  primary-container: '#065f46'
  on-primary-container: '#8bd6b7'
  inverse-primary: '#1b6b51'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#6bd8cb'
  on-tertiary: '#003732'
  tertiary-container: '#005e56'
  on-tertiary-container: '#6cd9cb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a6f2d1'
  primary-fixed-dim: '#8bd6b6'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#10131c'
  on-background: '#e0e2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is a high-performance, premium tech aesthetic centered on depth and focus. It targets professional environments and developer-centric platforms where visual noise must be minimized to allow complex data to surface. 

The style is a fusion of **Minimalism** and **Glassmorphism**, utilizing near-black surfaces to create an infinite canvas feel. It avoids pure blacks to prevent "black crush" on OLED screens, instead opting for a deep, midnight-ink base. The emotional response is one of calm, absolute precision, and high-end engineering. Visual interest is generated through subtle gradients and light-leaks rather than heavy decorative elements.

## Colors

The palette is anchored by a near-black foundation (#050810), providing a high-contrast environment for functional elements. The primary color is a refined, deep forest green (#065F46) used sparingly for high-intent actions and status indicators.

- **Primary:** Forest Green. Reduced saturation for a sophisticated, integrated look.
- **Surface Strategy:** Use charcoal gray gradients (from #0A0F1A to #050810) to define container depth.
- **Accents:** Use Tertiary Teal for secondary data points or success states.
- **Neutral:** A range of cool grays that bridge the gap between the ink-black background and white text, ensuring legibility without harsh contrast.

## Typography

This design system utilizes a technical typographic pairing to emphasize its "Premium Tech" positioning. **Geist** provides a clean, geometric sans-serif foundation for all interface text, while **JetBrains Mono** is utilized for labels, metadata, and technical readouts to reinforce a developer-friendly, precise aesthetic.

- **Headlines:** Tight letter spacing and bold weights to command attention.
- **Body:** Generous line-height to ensure comfort during long reading sessions against dark backgrounds.
- **Labels:** Uppercase application for `label-sm` is encouraged for secondary metadata to create a distinct visual hierarchy.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a preference for wide horizontal margins on desktop to focus the user's eye on the central content. 

- **Grid:** A 12-column system for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** All spacing must be multiples of 4px. Use `lg` (24px) for most container padding and `xl` (40px) for vertical section separation.
- **Safe Areas:** On mobile, maintain a minimum of 16px side margins. On desktop, content should be capped at a maximum width of 1440px to ensure line lengths remain readable.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Light-Leaks**. Instead of traditional drop shadows, which can appear muddy on near-black backgrounds, depth is conveyed by lightening the surface color.

1. **Base:** Level 0 (#050810) - The background canvas.
2. **Raised:** Level 1 (#0A0F1A) - Standard cards and containers.
3. **Overlay:** Level 2 (#111827) - Dialogs, popovers, and navigation menus.
4. **Accents:** Use a 1px inner border (top-down) with 10% white opacity to simulate a "rim light" on raised elements, creating a crisp, physical edge. 

Shadows, when used for modals, should be large, extremely diffused (60px+ blur), and tinted with the primary forest green at 5% opacity to create a subtle glow rather than a dark void.

## Shapes

The shape language is "Soft-Tech." It avoids the playfulness of large radii in favor of precision. 

- **Standard Elements:** 0.25rem (4px) radius for inputs, small buttons, and checkboxes.
- **Containers:** 0.5rem (8px) radius for cards and larger modules.
- **Large Components:** 0.75rem (12px) radius for modals and major sections.

This tighter radius maintains a structured, professional appearance while avoiding the aggressive feel of sharp 0px corners.

## Components

- **Buttons:** Primary buttons use a solid Forest Green background with white text. Secondary buttons use a charcoal gray border with no background. Interaction states should involve a subtle brightness increase (+5%) on hover.
- **Inputs:** Fields should be semi-transparent charcoal with a 1px border. Focus states must use the Forest Green color for the border and a subtle outer glow.
- **Cards:** Utilize a subtle vertical gradient (Charcoal to Black) and the 1px "rim light" border to differentiate from the background.
- **Chips:** Monospaced typography (`label-sm`) inside 4px rounded containers with low-contrast borders.
- **Lists:** Rows separated by 1px dividers in #1E293B. Hover states should trigger a slight background shift to #0A0F1A.
- **Code Blocks:** Integrated JetBrains Mono text on a Level 2 surface for maximum technical clarity.