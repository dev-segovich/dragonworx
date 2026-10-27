# DRAGONWORX.AI — Coming soon

Static coming-soon page for dragonworx.ai: stacked logo, "Coming soon" headline, a live countdown to the launch (January 1, 2027, 12:00 a.m. Eastern Time) and a short introduction to Dragonworx. Built to the DRAGONWORX.AI Brand Guidelines v1.0.

No build step: plain HTML, CSS and JavaScript.

## Structure

```
index.html            Page
site.webmanifest      Web app manifest (icons, theme colour)
favicon.ico
assets/css/styles.css Brand tokens, layout, responsive rules
assets/js/main.js     Countdown and the dragon flame animation (canvas)
assets/img/           Stacked logo (1488 px and 744 px) and social share image
assets/icons/         Favicon PNG, Apple touch icon, 192/512 app icons
```

## Notes

- The launch time is set in `assets/js/main.js` (`LAUNCH`, `2027-01-01T00:00:00-05:00`).
- The flame plays once on load and again with "Replay flame"; it does not autoplay when the visitor prefers reduced motion.
- Fonts (Exo 2, Montserrat) load from Google Fonts.

## Deploy

Upload the repository contents (everything tracked here) to the web root of the hosting account.
