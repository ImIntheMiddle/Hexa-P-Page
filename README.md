# Hexa-P project page

Source of https://iminthemiddle.github.io/Hexa-P-Page/, the project page of *Hexa-P: Physical Plausibility-aware Pre-training for Pedestrian Path Prediction* (Pattern Analysis and Applications, 2026). The code is at https://github.com/ImIntheMiddle/Hexa-P.

`index.html` is a static page. `static/results/data.js` lists the videos and numbers that `static/js/hexap.js` puts on the page; the videos are in `static/results/`.

## Preview

The page loads its videos and data with relative paths, so any static file server shows it:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://localhost:8765/. To view a server on a remote machine, forward the port first (`ssh -L 8765:localhost:8765 <host>`).

The page is built on the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template), adopted from the [Nerfies](https://nerfies.github.io) page, and is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
