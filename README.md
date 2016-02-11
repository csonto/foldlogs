# FoldLogs - Highlight and Fold Logs

JavaScript library for folding and highlighting logfiles.

This is based on regular expressions, folding

* all lines matching an expressions (`.re`)
* or range of lines matching from a start (`.re`) to an end (`.re_end`) when
  `.re_end` is defined.

Each fold may have its own `.class` or `.highlight` and can be expanded by default
(`.collapsed`).

*Disclaimer:* I have not written much javascript in last 15+ years so this is
going to be very un-idiomatic one. Help or straightforward reimplementation
appreciated.

## Requirements

* [JQuery](https://code.jquery.com/) - 2.1.3 is known to work
* [arg.js](https://github.com/stretchr/arg.js) - 1.3.1 is known to work

## Examples

See [examples](examples/index.html)

## Tips

### Enabling CORS

To fold files from random source you may want to enable CORS on the server.

If that is not in your power firefox add-on like [Force-CORS](https://github.com/jo5ef/Force-CORS) could help.

This may also require [The Addon Bar (Restored)](https://addons.mozilla.org/en-US/firefox/addon/the-addon-bar/)
(at least on FF38ESR).

You may want to create an extra profile with CORS enabled.

May be greasemonkey could be taught to automatically load the file in
the appropriate highlighter. Anyone?
