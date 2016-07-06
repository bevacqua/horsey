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

## `predictNextSearch(info)`

Runs when a tag is inserted. The returned string is used to pre-fill the text input. Useful to avoid repetitive user input. The suggestion list can be used to choose a prefix based on the previous list of suggestions.

- `info.input` contains the user input at the time a suggestion was selected
- `info.suggestions` contains the list of suggestions at the time a suggestion was selected
- `info.selection` contains the suggestion selected by the user

## `cache`

Can be an object that will be used to store queries and suggestions. You can provide a `cache.duration` as well, which defaults to one day and is specified in seconds. The `cache.duration` is used to figure out whether cache entries are fresh or stale.
You can disable autocomplete caching by setting `cache` to `false`.

## `limit`

Can be a number that determines the maximum amount of suggestions shown in the autocomplete list.

## `filter(query, suggestion)`

By default suggestions are filtered using the [`fuzzysearch`](https://github.com/bevacqua/fuzzysearch) algorithm. You can change that and use your own `filter` algorithm instead.

## `source`

A `source(data, done)` should be set to a function. The `done(err, items)` function should provide the `items` for the provided `data.input`.

- `data.input` is a query for which suggestions should be provided
- `data.limit` is the previously specified `options.limit`
- `data.previousSelection` is the last suggestion selected by the user
- `data.previousSuggestions` is the last list of suggestions provided to the user

The expected schema for the `items` object result is outlined below.

```js
[category1, category2, category3]
```

Each category is expected to follow the next schema. The `id` is optional, all category objects without an `id` will be treated as if their `id` was `'default'`. Note that categories under the same `id` will be merged together when displaying the autocomplete suggestions.

```js
{
  id: 'here is some category',
  list: [item1, item2, item3]
}
```

## `blankSearch`

When this option is set to `true`, the `source(data, done)` function will be called even when the `input` string is empty.

## `noMatches`

Defaults to `null`. Set to a string if you want to display an informational message when no suggestions match the provided `input` string. Note that this message won't be displayed when `input` is empty even if `blankSearch` is turned on.

## `debounce`

The minimum amount of milliseconds that should ellapse between two different calls to `source`. Useful to allow users to type text without firing dozens of queries. Defaults to `300`.

## `highlighter`

If set to `false`, autocomplete suggestions won't be highlighted based on user input.

## `highlightCompleteWords`

If set to `false`, autocomplete suggestions won't be highlighted as whole words first. The highlighter will be faster but the UX won't be as close to user expectations.

## `renderItem`

By default, items are rendered using the text for a `suggestion`. You can customize this behavior by setting `autocomplete.renderItem` to a function that receives `li, suggestion` parameters. The `li` is a DOM element and the `suggestion` is its data object.

## `renderCategory`

By default, categories are rendered using just their `data.title`. You can customize this behavior by setting `autocomplete.renderCategory` to a function that receives `div, data` parameters. The `div` is a DOM element and the `data` is the full category data object, including the `list` of suggestions. After you customize the `div`, the list of suggestions for the category will be appended to `div`.

# API

Once you've instantiated a `horsey`, you can do a few more things with it.

## `.clear()`

You can however, remove every single suggestion from the autocomplete, wiping the slate clean. Contrary to `.destroy()`, `.clear()` won't leave the `horsey` instance useless, and calling `.add` will turn it back online in no time.

## `.source`

Exposes the suggestions that have been added so far to the autocomplete list. Includes suggestions that may not be shown due to filtering. This should be treated as a read-only list.

## `.show()`

Shows the autocomplete list.

## `.hide()`

Hides the autocomplete list.

## `.toggle()`

Shows or hides the autocomplete list.

## `.refreshPosition()`

Updates the position of the autocomplete list relative to the position of the `el`. Only necessary when the `el` is moved.

## `.destroy()`

Unbind horsey-related events from the `el`, remove the autocomplete list. It's like `horsey` was never here.

## `.retarget(target)`

Detaches this `horsey` instance from `el`, removing events and whatnot, and then attaches the instance to `target`. Note that `horsey.find` will still only work with `el`. This method is mostly for internal purposes, but it's also useful if you're developing a text editor with multiple modes (particularly if it switches between a `<textarea>` and a content-editable `<div>`).

## `.anchor`

The anchor value that was originally passed into `horse` as `options.anchor`.

## `.defaultRenderer`

The default `render` method

## `.defaultGetText`

The default `getText` method

## `.defaultGetValue`

The default `getValue` method

## `.defaultSetter`

The default `set` method

## `.defaultFilter`

The default `filter` method

## `.appendText`

Method called whenever we have an `anchor` and we need to append a suggestion to an input field. Defaults to `defaultAppendText`.

## `.appendHTML`

Method called whenever we have an `anchor` and we need to append a suggestion for a `contentEditable` element. **Unsupported by default**. Provided by [banksy][8].

## `.defaultAppendText`

Default `appendText` implementation

## `.filterAnchoredText`

Method called whenever we have an `anchor` and we need to filter a suggestion for an input field.

## `.filterAnchoredHTML`

Method called whenever we have an `anchor` and we need to filter a suggestion for a `contentEditable` element. **Unsupported by default**. Provided by [banksy][8].

# Events

Once you've instantiated a `horsey`, some propietary synthetic events will be emitted on the provided `el`.

Name              | Description
------------------|---------------------------------------------------------------
`horsey-show`     | Fired whenever the autocomplete list is displayed
`horsey-hide`     | Fired whenever the autocomplete list is hidden
`horsey-filter`   | Fired whenever the autocomplete list is about to be filtered. Useful to prime the filter method

## Usage with [woofmark][7]

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
