# Horsey

> Progressive and customizable autocomplete component

Browser support includes every sane browser and **IE7+**.

# Demo!

You can see a [live demo here][3].

[![screenshot.png][5]][3]

# Inspiration

I needed a fast, easy to use, and reliable autocomplete library. The ones I stumbled upon were too bloated, too opinionated, or provided an unfriendly human experience.

The goal is to produce a framework-agnostic autocomplete that is easily integrated into your favorite MVC framework, that doesn't translate into a significant addition to your codebase, and that's **enjoyable to work with**. Horsey shares the modular design philosophy of [Rome, the datetime picker][1]. Furthermore, it plays well with [Insignia, the tag editor][2] component, and pretty much any other well-delimited component out there.

# Features

- Small and focused
- Natural keyboard navigation
- Progressively enhanced
- Extensive browser support
- Fuzzy searching
- Supports `<input>` and `<textarea>` elements

# Install

You can get it on npm.

```shell
npm install horsey --save
```

Or bower, too.

```shell
bower install horsey --save
```

# Options

Entry point is `horsey(el, options)`. Configuration options are detailed below. This method [returns a small API](#api) into the `horsey` autocomplete list instance. You can also find existing horsey instances using `horsey.find`.

### `suggestions`

An array containing a list of suggestions to be presented to the user. Each suggestion can be either a string or an object. If an object is used, the `text` property will be used for displaying the suggestion and the `value` property will be used when a suggestion is selected.

Alternatively, the `suggestions` can be a function. In this case, the function will be called with the current input value when the input is focused, and expected to return a list of suggestions through a callback.

###### Example

The example below would create an instance with a predefined set of suggestions.

```js
horsey(el, {
  suggestions: ['sports', 'drama', 'romantic comedy', 'science fiction', 'thriller']
});
```

###### Example

Here's how you would lazy load your suggestions, except, you know, using actual AJAX calls. Every time the input value changes, the suggestions function will be called:

```js
horsey(el, {
  suggestions: function (value, done) {
    setTimeout(function () {
      done(['sports', 'drama', 'romantic comedy', 'science fiction', 'thriller']);
    }, 2000);
  }
});
```

### `filter`

Allows you to hide suggestions based on user input. The default implementation uses the [fuzzysearch][4] module to discard suggestions that don't contain anything similar to the user input.

###### Default

```js
function defaultFilter (q, suggestion) {
  return fuzzysearch(q, getText(suggestion)) || fuzzysearch(q, getValue(suggestion));
}
```

###### Example

The example below would always display every suggestion, except when the user input looks like `'seahawks/managers'`, in which case it would only return suggestions matching the `'seahawks'` team.

```js
horsey(el, {
  filter: function (q, suggestion) {
    var parts = q.split('/');
    return parts.length === 1 ? true : suggestion.team === parts[0];
  }
});
```

### `limit`

Allows you to limit the amount of search results that are displayed by `horsey`. Defaults to `Infinity`.

### `getText`

A function that returns the textual representation to be displayed on the suggestion list. The result of `getText` is also used when filtering _under the default implementation_.

###### Default

```js
function defaultGetText (suggestion) {
  return typeof suggestion === 'string' ? suggestion : suggestion.text;
}
```

###### Example

The example below would return a model's `displayName` for convenience.

```js
horsey(el, {
  getText: function (suggestion) {
    return suggestion.displayName;
  }
});
```

### `getValue`

A function that returns the value to be given to the `el` when a suggestion is selected.

###### Default

```js
function defaultGetValue (suggestion) {
  return typeof suggestion === 'string' ? suggestion : suggestion.value;
}
```

###### Example

The example below would return a model's `username` for convenience.

```js
horsey(el, {
  getValue: function (suggestion) {
    return suggestion.username;
  }
});
```

### `set`

A function that gets called when an option has been selected on the autocomplete.

###### Default

```js
function defaultSetter (value) {
  el.value = value;
}
```

###### Example

The example below would append values instead of overwriting them.

```js
horsey(el, {
  set: function (value) {
    el.value += value + ', ';
  }
});
```

### `anchor`

A string that will be used as a regular expression to figure out _when_ the suggestions should be presented. If an `anchor` is set, the text will be appended instead of replaced, and **the `set` option will be ignored**.

### `autoHideOnClick`

Hides the autocomplete list whenever something other than the `el` or any child of the autocomplete's `<ul>` element is clicked. Defaults to `true`.

### `autoHideOnBlur`

Hides the autocomplete list whenever something other than the `el` or any child of the autocomplete's `<ul>` element is focused. Defaults to `true`.

### `autoShowOnUpDown`

Displays the autocomplete list whenever the up arrow key or the down arrow key are pressed. Defaults to `el.tagName === 'INPUT'`.

### `render`

A function that's used to decide what to display in each suggestion item. `render` will take the `<li>` element as the first argument, and the suggestion model as the second argument.

###### Default

```js
function defaultRenderer (li, suggestion) {
  li.innerText = li.textContent = getText(suggestion);
}
```

###### Example

The example below would assign arbitrary HTML found in the `suggestion` model to each list item. Note that rendering doesn't necessarily have to be synchronous.

```js
horsey(el, {
  render: function (li, suggestion) {
    li.innerHTML = suggestion.html;
  }
});
```

### `appendTo`

Where should the `<ul>` element containing the autocomplete options be placed? Generally an irrelevant option, but useful if you're dealing with a SPA, where you want to _keep the element inside your view instead of the body_, so that it gets cleaned up as the view goes away.

Defaults to `document.body`.

### `form`

The `form` your `el` belongs to. If provided, the autocomplete list will be hidden whenever the form is submitted.

# API

Once you've instantiated a `horsey`, you can do a few more things with it.

### `.add(suggestion)`

Just like when passing `suggestions` as an option, you can add individual suggestions by calling `.add(suggestion)`. Returns the `<li>` element for this suggestion in the autocomplete list. There isn't an API method to remove the suggestion afterwards, so you'll have to grab onto the `<li>` reference if you want to remove it later on.

### `.clear()`

You can however, remove every single suggestion from the autocomplete, wiping the slate clean. Contrary to `.destroy()`, `.clear()` won't leave the `horsey` instance useless, and calling `.add` will turn it back online in no time.

### `.list`

The autocomplete list DOM `<ul>` element.

### `.suggestions`

Exposes the suggestions that have been added so far to the autocomplete list. Includes suggestions that may not be shown due to filtering. This should be treated as a read-only list.

### `.show()`

Shows the autocomplete list.

### `.hide()`

Hides the autocomplete list.

### `.toggle()`

Shows or hides the autocomplete list.

### `.refreshPosition()`

Updates the position of the autocomplete list relative to the position of the `el`. Only necessary when the `el` is moved.

### `.destroy()`

Unbind horsey-related events from the `el`, remove the autocomplete list. It's like `horsey` was never here.

### `.retarget(target)`

Detaches this `horsey` instance from `el`, removing events and whatnot, and then attaches the instance to `target`. Note that `horsey.find` will still only work with `el`. This method is mostly for internal purposes, but it's also useful if you're developing a text editor with multiple modes (particularly if it switches between a `<textarea>` and a content-editable `<div>`).

### `.anchor`

The anchor value that was originally passed into `horse` as `options.anchor`.

### `.defaultRenderer`

The default `render` method

### `.defaultGetText`

The default `getText` method

### `.defaultGetValue`

The default `getValue` method

### `.defaultSetter`

The default `set` method

### `.defaultFilter`

The default `filter` method

### `.appendText`

Method called whenever we have an `anchor` and we need to append a suggestion to an input field. Defaults to `defaultAppendText`.

### `.appendHTML`

Method called whenever we have an `anchor` and we need to append a suggestion for a `contentEditable` element. **Unsupported by default**. Provided by [banksy][8].

### `.defaultAppendText`

Default `appendText` implementation

### `.filterAnchoredText`

Method called whenever we have an `anchor` and we need to filter a suggestion for an input field.

### `.filterAnchoredHTML`

Method called whenever we have an `anchor` and we need to filter a suggestion for a `contentEditable` element. **Unsupported by default**. Provided by [banksy][8].

# Events

Once you've instantiated a `horsey`, some propietary synthetic events will be emitted on the provided `el`.

Name              | Description
------------------|---------------------------------------------------------------
`horsey-selected` | Fired after a suggestion is selected from the autocomplete
`horsey-show`     | Fired whenever the autocomplete list is displayed
`horsey-hide`     | Fired whenever the autocomplete list is hidden
`horsey-filter`   | Fired whenever the autocomplete list is about to be filtered. Useful to prime the filter method

### Usage with [woofmark][7]

See [banksy][8] to integrate `horsey` into [woofmark][7].

# License

MIT

[1]: https://github.com/bevacqua/rome
[2]: https://github.com/bevacqua/insignia
[3]: http://bevacqua.github.io/horsey
[4]: https://github.com/bevacqua/fuzzysearch
[5]: http://i.imgur.com/imDFC0C.png
[6]: https://github.com/bevacqua/woofmark#editor
[7]: https://github.com/bevacqua/woofmark
[8]: https://github.com/bevacqua/banksy
