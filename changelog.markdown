# 4.2.1 Vampire

- Completely revamped, see API documentation

# 3.0.0 Live from Liverpool

- Introduced live suggestions
- Introduced fixes for Internet Explorer

# 2.6.1 Bullying

- Updated `bullseye@1.4.6`

# 2.6.0 Emancipation

- Decoupled `horsey` from `woofmark`, extracted bridge into `banksy` module

# 2.5.4 Polypony

- Use latest `bullseye`, which uses `getSeleccion` polyfill

# 2.5.3 Area 51

- Handle retargetting for `woofmark` editors

# 2.5.2 Insensitive Animal

- Case insensitive fuzzy searching
- Fixed a bug where non-string suggestions would be displayed as `undefined`

# 2.5.1 Toggle Bobble

- Exposed `toggle` method to toggle visibility of horsey autocomplete suggestion list

# 2.5.0 Woof woof

- Example on how to use in a `<textarea>`
- Example on how to use as a drop-down list
- Better integration with `woofmark`
- Introduced `anchor` option to use in textareas effectively
- Introduced `limit` option to limit suggestions

# 2.4.1 Left-o-mattic

- Ignore right clicks when acting as a drop-down list

# 2.4.0 Customer Care

- Support for _non-`<input>` non-`<textarea>` non-`contentEditable`_ DOM attachment elements
- Updated `crossvent` to `1.4.0`

# 2.3.1 Bullying

- Bumped `bullseye@1.4.3`

# 2.3.0 Suggestive Outfit

- Exposed `suggestions` on instance API

# 2.2.0 Sudden Shock

- Published `<ul>` on the API as a `list` property

# 2.1.3 Bull Run

- Updated `bullseye@1.4.1`

# 2.1.1 Memotest

- Retargetting to improve interaction with rich text editors
- Cache `horsey` instances paired with DOM elements
- Updated `bullseye@1.4.0`

# 2.0.4 Jordania

- DOM safety check when destroying `horsey` instances
- Updated `bullseye@1.2.7`

# 2.0.1 Arena for the Net

- Explicit support for `<textarea>` elements
- Added `autoShowOnUpDown` option

# 1.2.0 Exposé

- Exposed `defaultRenderer` method
- Exposed `defaultGetText` method
- Exposed `defaultGetValue` method
- Exposed `defaultSetter` method
- Exposed `defaultFilter` method

# 1.1.1 Cross Polinize

- Updated `crossvent` to `1.3.1`

# 1.1.0 Ball Drop

- Introduced `refreshPosition` API to simplify positioning below moving inputs

# 1.0.5 Balloon Motorcade

- `.sey-list` resets browser default padding on the autocomplete list `<ul>` element

# 1.0.4 Fuzzy Memory

- Bumped `fuzzysearch` to `@1.0.2`

# 1.0.3 Hack A Ton

- Fixed a bug where the list would still be considered to be _"visible"_ if every item had been filtered out
- Fixed a bug where pressing <kbd>Enter</kbd> would display the autocomplete list

# 1.0.2 Milleanial Zombie Escapade

- Fixed a bug where empty `getText()` or `getValue()` results would cause issues when filtering suggestions
- Introduced `'horsey-selected'` event

# 1.0.1 Arabian Nights

- Fixed a bug ([#1](https://github.com/bevacqua/horsey/issues/1)) where the drop-down would flicker when filtering out results

# 1.0.0 IPO

- Initial Public Release
