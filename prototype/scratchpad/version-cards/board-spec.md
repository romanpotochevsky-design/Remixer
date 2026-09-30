# Version cards — board 31422:42642 (read 30.09.2026, Plugin API + get_design_context + get_variable_defs dark)

Chat column "messages" (31422:42648), gap 16 between items. Group x=8, w=416 (i.e. 8px LEFT of the text column).
Order drawn: [Text edit card] · user bubble · [Navigation Update card + AI text + 5 actions] · [stack x3 "Image Replacement"] · user bubble · [current "Testimonials Section Added" + text + actions + disclaimer].

## Card (Modern Website 31422:42691) — 416 x 56
- item frame py 8 (card y=8 inside a 72 frame); AI group: card frame(72) gap 16 → message (px 8, text 15/25 gray-350, actions row 32 at +9)
- fill #171719 opaque; stroke 1px INSIDE, GRADIENT linear TL→BR (CSS: to bottom right) rgba(255,255,255,.15) 0% → .03 @ 50.48% → .15 100%
- background blur 32 (opaque fill → blur pointless; house rule: skip)
- radius 16, py 2 (inner header 36 centered: (56-2-36)/... header y=10)
- Header: AI card pl 20 pr 10 · free-edit / current card pl 8 pr 10
- Left slot (free edit / current): 32x32 frame, gap 8 to title
  - free edit: T-frame glyph 24 (fill white 48%) in 32 (p4), r8
  - current: ring 16 (stroke 2 #A0DDAA inside a 16 box => rect 14 at 1,1) + inner dot 8 #57BC67, centered in 32
- Title: Proxima Nova Semibold 15, leading 1.2, cap-trimmed (text-box-trim), white (Text/Default/Default dark = #fff)
- Right buttons (frame gap 8): [Buttons gap 4: revert 36, eye 36] + chevron 36
  - revert/eye = "Icon button 36px (Dark hover)" Standard: container r8 p6 icon 24 white; states:
    Hovered: plate Black/600 = rgba(9,9,11,.56) r10 · Focused: Black/900 rgba(9,9,11,.80) · Pressed: White/300 = rgba(255,255,255,.24)
  - chevron = Tonal White override: fill Gray/950 #09090b, stroke 1 INSIDE gradient TL→BR NA/300 24% → NA/50 4% @50% → NA/200 12%, r10, p6, glyph 24 white
- Current card: only the chevron (no revert/eye).

## Stack (31422:42821) — frame 416 x 80 (py 8; front card top 16)
- back:  left 8,  top 0,  w 400, h 56, fill #171719, stroke flat 15% white, opacity .33, pl 20 (contents: title + revert + tonal chevron w/ NA/100 fill)
- mid:   left 4,  top 8,  w 408, fill #101012, stroke #212123 solid, opacity 1
- front: left 0,  top 16, w 416 (full card, free-edit variant)
- Badge on icon: Badges/Counter/Small/White/Rounded/Semibold at (19,-3) of the 32 slot; 16 min w, max 34, px 4, radius 100,
  fill white (NA/1000 dark), stroke 2 OUTSIDE #171719, text Gilroy SemiBold 11 / lh 16, #09090b

## Hidden layers of interest
- "Version 1" text under each title (y=22, 62x16) — hidden (version number line considered)
- "Actions: 91" / "Changes: 91" — hidden
- "Message + Loader" (31422:43032) hidden: AI message + card "Writing/App.tsx..." loader state (Loader + Title) + "Details" dots
- "Version control (Light theme)" instance 480x56 hidden under AI message
