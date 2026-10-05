# Testing

## Automated

```
npm test
```

Runs the unit tests (no install needed, Node 20+): dice and roll logic, theme text contrast, the
exact roll-odds math, versus rolls, saved-data validation, the offline file
list, and the version number.

## Manual checks before a release

The automated tests and the browser checks done during development ran in
Chromium (Chrome's engine), including an iPhone-sized touch emulation. These
need a real device or browser, so run through them once per release.

Serve the folder (for example `python3 -m http.server`) and open it over
`http://` or `https://`. Opening `index.html` by double-clicking does not work
because browsers block the JavaScript modules on `file://` pages.

**On each of: Safari on iPhone, Chrome on Android, Firefox on desktop, Safari on Mac**

- [ ] Every dice button rolls and the newest roll appears at the top.
- [ ] Attack, Initiative, Saving Throw and Ability Score roll; changing a modifier changes the result and the "Modifiers" heading.
- [ ] Versus Roll: both sides roll, the winner is highlighted, the tie rule works.
- [ ] Custom Roll and Find Roll Stats (try 50d6) work; the chart is readable.
- [ ] Settings opens, Escape or ✕ closes it, and typing in a field does not zoom the page (iPhone).
- [ ] All four themes look right (Midnight, Violet, Parchment, Neon): page, panels, Settings, chart, and each die has its own colour.
- [ ] Reload: theme, sound setting, presets, modifiers, Versus values and recent rolls are all still there.
- [ ] Sounds are off by default; turn them on and each die makes a sound.
      On iPhone, sound is silent when the ring/silent switch is on silent.
- [ ] Copy last roll (button, and Alt+C on a keyboard) puts text on the clipboard.
- [ ] Clear results, then Undo within eight seconds, brings the rolls back.
- [ ] Long-press on the results opens the menu on a phone; scrolling does not.
- [ ] Turn on the device's "reduce motion" setting: buttons no longer shake or scale.
- [ ] Add to Home Screen / Install: the dice icon and name appear, and the app opens full screen.
- [ ] Turn on airplane mode after one visit: the app still loads and rolls.
