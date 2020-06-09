(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.horsey = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _hashSum = _interopRequireDefault(require("hash-sum"));

var _sell = _interopRequireDefault(require("sell"));

var _sektor = _interopRequireDefault(require("sektor"));

var _emitter = _interopRequireDefault(require("contra/emitter"));

var _bullseye = _interopRequireDefault(require("bullseye"));

var _crossvent = _interopRequireDefault(require("crossvent"));

var _fuzzysearch = _interopRequireDefault(require("fuzzysearch"));

var _debounce = _interopRequireDefault(require("lodash/debounce"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var KEY_BACKSPACE = 8;
var KEY_ENTER = 13;
var KEY_ESC = 27;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_TAB = 9;
var doc = document;
var docElement = doc.documentElement;

function horsey(el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var setAppends = options.setAppends,
      _set = options.set,
      filter = options.filter,
      source = options.source,
      _options$cache = options.cache,
      cache = _options$cache === void 0 ? {} : _options$cache,
      predictNextSearch = options.predictNextSearch,
      renderItem = options.renderItem,
      renderCategory = options.renderCategory,
      blankSearch = options.blankSearch,
      appendTo = options.appendTo,
      anchor = options.anchor,
      debounce = options.debounce;
  var caching = options.cache !== false;

  if (!source) {
    return;
  }

  var userGetText = options.getText;
  var userGetValue = options.getValue;
  var getText = typeof userGetText === 'string' ? function (d) {
    return d[userGetText];
  } : typeof userGetText === 'function' ? userGetText : function (d) {
    return d.toString();
  };
  var getValue = typeof userGetValue === 'string' ? function (d) {
    return d[userGetValue];
  } : typeof userGetValue === 'function' ? userGetValue : function (d) {
    return d;
  };
  var previousSuggestions = [];
  var previousSelection = null;
  var limit = Number(options.limit) || Infinity;
  var completer = autocomplete(el, {
    source: sourceFunction,
    limit: limit,
    getText: getText,
    getValue: getValue,
    setAppends: setAppends,
    predictNextSearch: predictNextSearch,
    renderItem: renderItem,
    renderCategory: renderCategory,
    appendTo: appendTo,
    anchor: anchor,
    noMatches: noMatches,
    noMatchesText: options.noMatches,
    blankSearch: blankSearch,
    debounce: debounce,
    set: function set(s) {
      if (setAppends !== true) {
        el.value = '';
      }

      previousSelection = s;

      (_set || completer.defaultSetter)(getText(s), s);

      completer.emit('afterSet');
    },
    filter: filter
  });
  return completer;

  function noMatches(data) {
    if (!options.noMatches) {
      return false;
    }

    return data.query.length;
  }

  function sourceFunction(data, done) {
    var query = data.query,
        limit = data.limit;

    if (!options.blankSearch && query.length === 0) {
      done(null, [], true);
      return;
    }

    if (completer) {
      completer.emit('beforeUpdate');
    }

    var hash = (0, _hashSum["default"])(query); // fast, case insensitive, prevents collisions

    if (caching) {
      var entry = cache[hash];

      if (entry) {
        var start = entry.created.getTime();
        var duration = cache.duration || 60 * 60 * 24;
        var diff = duration * 1000;
        var fresh = new Date(start + diff) > new Date();

        if (fresh) {
          done(null, entry.items.slice());
          return;
        }
      }
    }

    var sourceData = {
      previousSuggestions: previousSuggestions.slice(),
      previousSelection: previousSelection,
      input: query,
      renderItem: renderItem,
      renderCategory: renderCategory,
      limit: limit
    };

    if (typeof options.source === 'function') {
      options.source(sourceData, sourced);
    } else {
      sourced(null, options.source);
    }

    function sourced(err, result) {
      if (err) {
        console.log('Autocomplete source error.', err, el);
        done(err, []);
      }

      var items = Array.isArray(result) ? result : [];

      if (caching) {
        cache[hash] = {
          created: new Date(),
          items: items
        };
      }

      previousSuggestions = items;
      done(null, items.slice());
    }
  }
}

function autocomplete(el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var o = options;
  var parent = o.appendTo || doc.body;
  var getText = o.getText,
      getValue = o.getValue,
      form = o.form,
      source = o.source,
      noMatches = o.noMatches,
      noMatchesText = o.noMatchesText,
      _o$highlighter = o.highlighter,
      highlighter = _o$highlighter === void 0 ? true : _o$highlighter,
      _o$highlightCompleteW = o.highlightCompleteWords,
      highlightCompleteWords = _o$highlightCompleteW === void 0 ? true : _o$highlightCompleteW,
      _o$renderItem = o.renderItem,
      renderItem = _o$renderItem === void 0 ? defaultItemRenderer : _o$renderItem,
      _o$renderCategory = o.renderCategory,
      renderCategory = _o$renderCategory === void 0 ? defaultCategoryRenderer : _o$renderCategory,
      setAppends = o.setAppends;
  var limit = typeof o.limit === 'number' ? o.limit : Infinity;
  var userFilter = o.filter || defaultFilter;
  var userSet = o.set || defaultSetter;
  var categories = tag('div', 'sey-categories');
  var container = tag('div', 'sey-container');
  var deferredFiltering = defer(filtering);
  var state = {
    counter: 0,
    query: null
  };
  var categoryMap = Object.create(null);
  var selection = null;
  var eye;
  var attachment = el;
  var noneMatch;
  var textInput;
  var anyInput;
  var ranchorleft;
  var ranchorright;
  var lastPrefix = '';
  var debounceTime = o.debounce || 300;
  var debouncedLoading = (0, _debounce["default"])(loading, debounceTime);

  if (o.autoHideOnBlur === void 0) {
    o.autoHideOnBlur = true;
  }

  if (o.autoHideOnClick === void 0) {
    o.autoHideOnClick = true;
  }

  if (o.autoShowOnUpDown === void 0) {
    o.autoShowOnUpDown = el.tagName === 'INPUT';
  }

  if (o.anchor) {
    ranchorleft = new RegExp('^' + o.anchor);
    ranchorright = new RegExp(o.anchor + '$');
  }

  var hasItems = false;
  var api = (0, _emitter["default"])({
    anchor: o.anchor,
    clear: clear,
    show: show,
    hide: hide,
    toggle: toggle,
    destroy: destroy,
    refreshPosition: refreshPosition,
    appendText: appendText,
    appendHTML: appendHTML,
    filterAnchoredText: filterAnchoredText,
    filterAnchoredHTML: filterAnchoredHTML,
    defaultAppendText: appendText,
    defaultFilter: defaultFilter,
    defaultItemRenderer: defaultItemRenderer,
    defaultCategoryRenderer: defaultCategoryRenderer,
    defaultSetter: defaultSetter,
    retarget: retarget,
    attachment: attachment,
    source: []
  });
  retarget(el);
  container.appendChild(categories);

  if (noMatches && noMatchesText) {
    noneMatch = tag('div', 'sey-empty sey-hide');
    text(noneMatch, noMatchesText);
    container.appendChild(noneMatch);
  }

  parent.appendChild(container);
  el.setAttribute('autocomplete', 'off');

  if (Array.isArray(source)) {
    loaded(source, false);
  }

  return api;

  function retarget(el) {
    inputEvents(true);
    attachment = api.attachment = el;
    textInput = attachment.tagName === 'INPUT' || attachment.tagName === 'TEXTAREA';
    anyInput = textInput || isEditable(attachment);
    inputEvents();
  }

  function refreshPosition() {
    if (eye) {
      eye.refresh();
    }
  }

  function loading(forceShow) {
    if (typeof source !== 'function') {
      return;
    }

    _crossvent["default"].remove(attachment, 'focus', loading);

    var query = readInput();

    if (query === state.query) {
      return;
    }

    hasItems = false;
    state.query = query;
    var counter = ++state.counter;
    source({
      query: query,
      limit: limit
    }, sourced);

    function sourced(err, result, blankQuery) {
      if (state.counter !== counter) {
        return;
      }

      loaded(result, forceShow);

      if (err || blankQuery) {
        hasItems = false;
      }
    }
  }

  function loaded(categories, forceShow) {
    clear();
    hasItems = true;
    api.source = [];
    categories.forEach(function (cat) {
      return cat.list.forEach(function (suggestion) {
        return add(suggestion, cat);
      });
    });

    if (forceShow) {
      show();
    }

    filtering();
  }

  function clear() {
    unselect();

    while (categories.lastChild) {
      categories.removeChild(categories.lastChild);
    }

    categoryMap = Object.create(null);
    hasItems = false;
  }

  function readInput() {
    return (textInput ? el.value : el.innerHTML).trim();
  }

  function getCategory(data) {
    if (!data.id) {
      data.id = 'default';
    }

    if (!categoryMap[data.id]) {
      categoryMap[data.id] = createCategory();
    }

    return categoryMap[data.id];

    function createCategory() {
      var category = tag('div', 'sey-category');
      var ul = tag('ul', 'sey-list');
      renderCategory(category, data);
      category.appendChild(ul);
      categories.appendChild(category);
      return {
        data: data,
        ul: ul
      };
    }
  }

  function add(suggestion, categoryData) {
    var cat = getCategory(categoryData);
    var li = tag('li', 'sey-item');
    renderItem(li, suggestion);

    if (highlighter) {
      breakupForHighlighter(li);
    }

    _crossvent["default"].add(li, 'mouseenter', hoverSuggestion);

    _crossvent["default"].add(li, 'click', clickedSuggestion);

    _crossvent["default"].add(li, 'horsey-filter', filterItem);

    _crossvent["default"].add(li, 'horsey-hide', hideItem);

    cat.ul.appendChild(li);
    api.source.push(suggestion);
    return li;

    function hoverSuggestion() {
      select(li);
    }

    function clickedSuggestion() {
      var input = getText(suggestion);
      set(suggestion);
      hide();
      attachment.focus();
      lastPrefix = o.predictNextSearch && o.predictNextSearch({
        input: input,
        source: api.source.slice(),
        selection: suggestion
      }) || '';

      if (lastPrefix) {
        el.value = lastPrefix;
        el.select();
        show();
        filtering();
      }
    }

    function filterItem() {
      var value = readInput();

      if (filter(value, suggestion)) {
        li.className = li.className.replace(/ sey-hide/g, '');
      } else {
        _crossvent["default"].fabricate(li, 'horsey-hide');
      }
    }

    function hideItem() {
      if (!hidden(li)) {
        li.className += ' sey-hide';

        if (selection === li) {
          unselect();
        }
      }
    }
  }

  function breakupForHighlighter(el) {
    getTextChildren(el).forEach(function (el) {
      var parent = el.parentElement;
      var text = el.textContent || el.nodeValue || '';

      if (text.length === 0) {
        return;
      }

      var _iterator = _createForOfIteratorHelper(text),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _char2 = _step.value;
          parent.insertBefore(spanFor(_char2), el);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      parent.removeChild(el);

      function spanFor(_char) {
        var span = doc.createElement('span');
        span.className = 'sey-char';
        span.textContent = span.innerText = _char;
        return span;
      }
    });
  }

  function highlight(el, needle) {
    var rword = /[\s,._\[\]{}()-]/g;
    var words = needle.split(rword).filter(function (w) {
      return w.length;
    });

    var elems = _toConsumableArray(el.querySelectorAll('.sey-char'));

    var chars;
    var startIndex = 0;
    balance();

    if (highlightCompleteWords) {
      whole();
    }

    fuzzy();
    clearRemainder();

    function balance() {
      chars = elems.map(function (el) {
        return el.innerText || el.textContent;
      });
    }

    function whole() {
      var _iterator2 = _createForOfIteratorHelper(words),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var word = _step2.value;
          var tempIndex = startIndex;

          retry: while (tempIndex !== -1) {
            var init = true;
            var prevIndex = tempIndex;

            var _iterator3 = _createForOfIteratorHelper(word),
                _step3;

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var _char3 = _step3.value;
                var i = chars.indexOf(_char3, prevIndex + 1);
                var fail = i === -1 || !init && prevIndex + 1 !== i;

                if (init) {
                  init = false;
                  tempIndex = i;
                }

                if (fail) {
                  continue retry;
                }

                prevIndex = i;
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }

            var _iterator4 = _createForOfIteratorHelper(elems.splice(tempIndex, 1 + prevIndex - tempIndex)),
                _step4;

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _el = _step4.value;
                on(_el);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }

            balance();
            needle = needle.replace(word, '');
            break;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    function fuzzy() {
      var _iterator5 = _createForOfIteratorHelper(needle),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var input = _step5.value;

          while (elems.length) {
            var _el2 = elems.shift();

            if ((_el2.innerText || _el2.textContent) === input) {
              on(_el2);
              break;
            } else {
              off(_el2);
            }
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }

    function clearRemainder() {
      while (elems.length) {
        off(elems.shift());
      }
    }

    function on(ch) {
      ch.classList.add('sey-char-highlight');
    }

    function off(ch) {
      ch.classList.remove('sey-char-highlight');
    }
  }

  function getTextChildren(el) {
    var texts = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;

    while (node = walker.nextNode()) {
      texts.push(node);
    }

    return texts;
  }

  function set(value) {
    if (o.anchor) {
      return (isText() ? api.appendText : api.appendHTML)(getValue(value));
    }

    userSet(value);
  }

  function filter(value, suggestion) {
    if (o.anchor) {
      var il = (isText() ? api.filterAnchoredText : api.filterAnchoredHTML)(value, suggestion);
      return il ? userFilter(il.input, il.suggestion) : false;
    }

    return userFilter(value, suggestion);
  }

  function isText() {
    return isInput(attachment);
  }

  function visible() {
    return container.className.indexOf('sey-show') !== -1;
  }

  function hidden(li) {
    return li.className.indexOf('sey-hide') !== -1;
  }

  function show() {
    eye.refresh();

    if (!visible()) {
      container.className += ' sey-show';

      _crossvent["default"].fabricate(attachment, 'horsey-show');
    }
  }

  function toggler(e) {
    var left = e.which === 1 && !e.metaKey && !e.ctrlKey;

    if (left === false) {
      return; // we only care about honest to god left-clicks
    }

    toggle();
  }

  function toggle() {
    if (!visible()) {
      show();
    } else {
      hide();
    }
  }

  function select(li) {
    unselect();

    if (li) {
      selection = li;
      selection.className += ' sey-selected';
    }
  }

  function unselect() {
    if (selection) {
      selection.className = selection.className.replace(/ sey-selected/g, '');
      selection = null;
    }
  }

  function move(up, moves) {
    var total = api.source.length;

    if (total === 0) {
      return;
    }

    if (moves > total) {
      unselect();
      return;
    }

    var cat = findCategory(selection) || categories.firstChild;
    var first = up ? 'lastChild' : 'firstChild';
    var last = up ? 'firstChild' : 'lastChild';
    var next = up ? 'previousSibling' : 'nextSibling';
    var prev = up ? 'nextSibling' : 'previousSibling';
    var li = findNext();
    select(li);

    if (hidden(li)) {
      move(up, moves ? moves + 1 : 1);
    }

    function findCategory(el) {
      while (el) {
        if (_sektor["default"].matchesSelector(el.parentElement, '.sey-category')) {
          return el.parentElement;
        }

        el = el.parentElement;
      }

      return null;
    }

    function findNext() {
      if (selection) {
        if (selection[next]) {
          return selection[next];
        }

        if (cat[next] && findList(cat[next])[first]) {
          return findList(cat[next])[first];
        }
      }

      return findList(categories[first])[first];
    }
  }

  function hide() {
    eye.sleep();
    container.className = container.className.replace(/ sey-show/g, '');
    unselect();

    _crossvent["default"].fabricate(attachment, 'horsey-hide');

    if (el.value === lastPrefix) {
      el.value = '';
    }
  }

  function keydown(e) {
    var shown = visible();
    var which = e.which || e.keyCode;

    if (which === KEY_DOWN) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }

      if (shown) {
        move();
        stop(e);
      }
    } else if (which === KEY_UP) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }

      if (shown) {
        move(true);
        stop(e);
      }
    } else if (which === KEY_BACKSPACE) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }
    } else if (shown) {
      if (which === KEY_ENTER) {
        if (selection) {
          _crossvent["default"].fabricate(selection, 'click');
        } else {
          hide();
        }

        stop(e);
      } else if (which === KEY_ESC) {
        hide();
        stop(e);
      }
    }
  }

  function stop(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function showNoResults() {
    if (noneMatch) {
      noneMatch.classList.remove('sey-hide');
    }
  }

  function hideNoResults() {
    if (noneMatch) {
      noneMatch.classList.add('sey-hide');
    }
  }

  function filtering() {
    if (!visible()) {
      return;
    }

    debouncedLoading(true);

    _crossvent["default"].fabricate(attachment, 'horsey-filter');

    var value = readInput();

    if (!o.blankSearch && !value) {
      hide();
      return;
    }

    var nomatch = noMatches({
      query: value
    });
    var count = walkCategories();

    if (count === 0 && nomatch && hasItems) {
      showNoResults();
    } else {
      hideNoResults();
    }

    if (!selection) {
      move();
    }

    if (!selection && !nomatch) {
      hide();
    }

    function walkCategories() {
      var category = categories.firstChild;
      var count = 0;

      while (category) {
        var list = findList(category);
        var partial = walkCategory(list);

        if (partial === 0) {
          category.classList.add('sey-hide');
        } else {
          category.classList.remove('sey-hide');
        }

        count += partial;
        category = category.nextSibling;
      }

      return count;
    }

    function walkCategory(ul) {
      var li = ul.firstChild;
      var count = 0;

      while (li) {
        if (count >= limit) {
          _crossvent["default"].fabricate(li, 'horsey-hide');
        } else {
          _crossvent["default"].fabricate(li, 'horsey-filter');

          if (li.className.indexOf('sey-hide') === -1) {
            count++;

            if (highlighter) {
              highlight(li, value);
            }
          }
        }

        li = li.nextSibling;
      }

      return count;
    }
  }

  function deferredFilteringNoEnter(e) {
    var which = e.which || e.keyCode;

    if (which === KEY_ENTER) {
      return;
    }

    deferredFiltering();
  }

  function deferredShow(e) {
    var which = e.which || e.keyCode;

    if (which === KEY_ENTER || which === KEY_TAB) {
      return;
    }

    setTimeout(show, 0);
  }

  function autocompleteEventTarget(e) {
    var target = e.target;

    if (target === attachment) {
      return true;
    }

    while (target) {
      if (target === container || target === attachment) {
        return true;
      }

      target = target.parentNode;
    }
  }

  function hideOnBlur(e) {
    var which = e.which || e.keyCode;

    if (which === KEY_TAB) {
      hide();
    }
  }

  function hideOnClick(e) {
    if (autocompleteEventTarget(e)) {
      return;
    }

    hide();
  }

  function inputEvents(remove) {
    var op = remove ? 'remove' : 'add';

    if (eye) {
      eye.destroy();
      eye = null;
    }

    if (!remove) {
      eye = (0, _bullseye["default"])(container, attachment, {
        caret: anyInput && attachment.tagName !== 'INPUT',
        context: o.appendTo
      });

      if (!visible()) {
        eye.sleep();
      }
    }

    if (remove || anyInput && doc.activeElement !== attachment) {
      _crossvent["default"][op](attachment, 'focus', loading);
    } else {
      loading();
    }

    if (anyInput) {
      _crossvent["default"][op](attachment, 'keypress', deferredShow);

      _crossvent["default"][op](attachment, 'keypress', deferredFiltering);

      _crossvent["default"][op](attachment, 'keydown', deferredFilteringNoEnter);

      _crossvent["default"][op](attachment, 'paste', function (ev) {
        deferredShow(ev);
        deferredFiltering(ev);
      });

      _crossvent["default"][op](attachment, 'keydown', keydown);

      if (o.autoHideOnBlur) {
        _crossvent["default"][op](attachment, 'keydown', hideOnBlur);
      }
    } else {
      _crossvent["default"][op](attachment, 'click', toggler);

      _crossvent["default"][op](docElement, 'keydown', keydown);
    }

    if (o.autoHideOnClick) {
      _crossvent["default"][op](doc, 'click', hideOnClick);
    }

    if (form) {
      _crossvent["default"][op](form, 'submit', hide);
    }
  }

  function destroy() {
    inputEvents(true);

    if (parent.contains(container)) {
      parent.removeChild(container);
    }
  }

  function defaultSetter(value) {
    if (textInput) {
      if (setAppends === true) {
        el.value += ' ' + value;
      } else {
        el.value = value;
      }
    } else {
      if (setAppends === true) {
        el.innerHTML += ' ' + value;
      } else {
        el.innerHTML = value;
      }
    }
  }

  function defaultItemRenderer(li, suggestion) {
    text(li, getText(suggestion));
  }

  function defaultCategoryRenderer(div, data) {
    if (data.id !== 'default') {
      var id = tag('div', 'sey-category-id');
      div.appendChild(id);
      text(id, data.id);
    }
  }

  function defaultFilter(q, suggestion) {
    var needle = q.toLowerCase();
    var text = getText(suggestion) || '';

    if ((0, _fuzzysearch["default"])(needle, text.toLowerCase())) {
      return true;
    }

    var value = getValue(suggestion) || '';

    if (typeof value !== 'string') {
      return false;
    }

    return (0, _fuzzysearch["default"])(needle, value.toLowerCase());
  }

  function loopbackToAnchor(text, p) {
    var result = '';
    var anchored = false;
    var start = p.start;

    while (anchored === false && start >= 0) {
      result = text.substr(start - 1, p.start - start + 1);
      anchored = ranchorleft.test(result);
      start--;
    }

    return {
      text: anchored ? result : null,
      start: start
    };
  }

  function filterAnchoredText(q, suggestion) {
    var position = (0, _sell["default"])(el);
    var input = loopbackToAnchor(q, position).text;

    if (input) {
      return {
        input: input,
        suggestion: suggestion
      };
    }
  }

  function appendText(value) {
    var current = el.value;
    var position = (0, _sell["default"])(el);
    var input = loopbackToAnchor(current, position);
    var left = current.substr(0, input.start);
    var right = current.substr(input.start + input.text.length + (position.end - position.start));
    var before = left + value + ' ';
    el.value = before + right;
    (0, _sell["default"])(el, {
      start: before.length,
      end: before.length
    });
  }

  function filterAnchoredHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function appendHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function findList(category) {
    return (0, _sektor["default"])('.sey-list', category)[0];
  }
}

function isInput(el) {
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
}

function tag(type, className) {
  var el = doc.createElement(type);
  el.className = className;
  return el;
}

function defer(fn) {
  return function () {
    setTimeout(fn, 0);
  };
}

function text(el, value) {
  el.innerText = el.textContent = value;
}

function isEditable(el) {
  var value = el.getAttribute('contentEditable');

  if (value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (el.parentElement) {
    return isEditable(el.parentElement);
  }

  return false;
}

module.exports = horsey;

},{"bullseye":3,"contra/emitter":7,"crossvent":8,"fuzzysearch":11,"hash-sum":12,"lodash/debounce":19,"sektor":26,"sell":35}],2:[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],3:[function(require,module,exports){
'use strict';

var crossvent = require('crossvent');
var throttle = require('./throttle');
var tailormade = require('./tailormade');

function bullseye (el, target, options) {
  var o = options;
  var domTarget = target && target.tagName;

  if (!domTarget && arguments.length === 2) {
    o = target;
  }
  if (!domTarget) {
    target = el;
  }
  if (!o) { o = {}; }

  var destroyed = false;
  var throttledWrite = throttle(write, 30);
  var tailorOptions = { update: o.autoupdateToCaret !== false && update };
  var tailor = o.caret && tailormade(target, tailorOptions);

  write();

  if (o.tracking !== false) {
    crossvent.add(window, 'resize', throttledWrite);
  }

  return {
    read: readNull,
    refresh: write,
    destroy: destroy,
    sleep: sleep
  };

  function sleep () {
    tailorOptions.sleeping = true;
  }

  function readNull () { return read(); }

  function read (readings) {
    var bounds = target.getBoundingClientRect();
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    if (tailor) {
      readings = tailor.read();
      return {
        x: (readings.absolute ? 0 : bounds.left) + readings.x,
        y: (readings.absolute ? 0 : bounds.top) + scrollTop + readings.y + 20
      };
    }
    return {
      x: bounds.left,
      y: bounds.top + scrollTop
    };
  }

  function update (readings) {
    write(readings);
  }

  function write (readings) {
    if (destroyed) {
      throw new Error('Bullseye can\'t refresh after being destroyed. Create another instance instead.');
    }
    if (tailor && !readings) {
      tailorOptions.sleeping = false;
      tailor.refresh(); return;
    }
    var p = read(readings);
    if (!tailor && target !== el) {
      p.y += target.offsetHeight;
    }
    var context = o.context;
    el.style.left = p.x + 'px';
    el.style.top = (context ? context.offsetHeight : p.y) + 'px';
  }

  function destroy () {
    if (tailor) { tailor.destroy(); }
    crossvent.remove(window, 'resize', throttledWrite);
    destroyed = true;
  }
}

module.exports = bullseye;

},{"./tailormade":4,"./throttle":5,"crossvent":8}],4:[function(require,module,exports){
(function (global){
'use strict';

var sell = require('sell');
var crossvent = require('crossvent');
var seleccion = require('seleccion');
var throttle = require('./throttle');
var getSelection = seleccion.get;
var props = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing'
];
var win = global;
var doc = document;
var ff = win.mozInnerScreenX !== null && win.mozInnerScreenX !== void 0;

function tailormade (el, options) {
  var textInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
  var throttledRefresh = throttle(refresh, 30);
  var o = options || {};

  bind();

  return {
    read: readPosition,
    refresh: throttledRefresh,
    destroy: destroy
  };

  function noop () {}
  function readPosition () { return (textInput ? coordsText : coordsHTML)(); }

  function refresh () {
    if (o.sleeping) {
      return;
    }
    return (o.update || noop)(readPosition());
  }

  function coordsText () {
    var p = sell(el);
    var context = prepare();
    var readings = readTextCoords(context, p.start);
    doc.body.removeChild(context.mirror);
    return readings;
  }

  function coordsHTML () {
    var sel = getSelection();
    if (sel.rangeCount) {
      var range = sel.getRangeAt(0);
      var needsToWorkAroundNewlineBug = range.startContainer.nodeName === 'P' && range.startOffset === 0;
      if (needsToWorkAroundNewlineBug) {
        return {
          x: range.startContainer.offsetLeft,
          y: range.startContainer.offsetTop,
          absolute: true
        };
      }
      if (range.getClientRects) {
        var rects = range.getClientRects();
        if (rects.length > 0) {
          return {
            x: rects[0].left,
            y: rects[0].top,
            absolute: true
          };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  function readTextCoords (context, p) {
    var rest = doc.createElement('span');
    var mirror = context.mirror;
    var computed = context.computed;

    write(mirror, read(el).substring(0, p));

    if (el.tagName === 'INPUT') {
      mirror.textContent = mirror.textContent.replace(/\s/g, '\u00a0');
    }

    write(rest, read(el).substring(p) || '.');

    mirror.appendChild(rest);

    return {
      x: rest.offsetLeft + parseInt(computed['borderLeftWidth']),
      y: rest.offsetTop + parseInt(computed['borderTopWidth'])
    };
  }

  function read (el) {
    return textInput ? el.value : el.innerHTML;
  }

  function prepare () {
    var computed = win.getComputedStyle ? getComputedStyle(el) : el.currentStyle;
    var mirror = doc.createElement('div');
    var style = mirror.style;

    doc.body.appendChild(mirror);

    if (el.tagName !== 'INPUT') {
      style.wordWrap = 'break-word';
    }
    style.whiteSpace = 'pre-wrap';
    style.position = 'absolute';
    style.visibility = 'hidden';
    props.forEach(copy);

    if (ff) {
      style.width = parseInt(computed.width) - 2 + 'px';
      if (el.scrollHeight > parseInt(computed.height)) {
        style.overflowY = 'scroll';
      }
    } else {
      style.overflow = 'hidden';
    }
    return { mirror: mirror, computed: computed };

    function copy (prop) {
      style[prop] = computed[prop];
    }
  }

  function write (el, value) {
    if (textInput) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  }

  function bind (remove) {
    var op = remove ? 'remove' : 'add';
    crossvent[op](el, 'keydown', throttledRefresh);
    crossvent[op](el, 'keyup', throttledRefresh);
    crossvent[op](el, 'input', throttledRefresh);
    crossvent[op](el, 'paste', throttledRefresh);
    crossvent[op](el, 'change', throttledRefresh);
  }

  function destroy () {
    bind(true);
  }
}

module.exports = tailormade;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./throttle":5,"crossvent":8,"seleccion":33,"sell":35}],5:[function(require,module,exports){
'use strict';

function throttle (fn, boundary) {
  var last = -Infinity;
  var timer;
  return function bounced () {
    if (timer) {
      return;
    }
    unbound();

    function unbound () {
      clearTimeout(timer);
      timer = null;
      var next = last + boundary;
      var now = Date.now();
      if (now > next) {
        last = now;
        fn();
      } else {
        timer = setTimeout(unbound, next - now);
      }
    }
  };
}

module.exports = throttle;

},{}],6:[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":36}],7:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var debounce = require('./debounce');

module.exports = function emitter (thing, options) {
  var opts = options || {};
  var evt = {};
  if (thing === undefined) { thing = {}; }
  thing.on = function (type, fn) {
    if (!evt[type]) {
      evt[type] = [fn];
    } else {
      evt[type].push(fn);
    }
    return thing;
  };
  thing.once = function (type, fn) {
    fn._once = true; // thing.off(fn) still works!
    thing.on(type, fn);
    return thing;
  };
  thing.off = function (type, fn) {
    var c = arguments.length;
    if (c === 1) {
      delete evt[type];
    } else if (c === 0) {
      evt = {};
    } else {
      var et = evt[type];
      if (!et) { return thing; }
      et.splice(et.indexOf(fn), 1);
    }
    return thing;
  };
  thing.emit = function () {
    var args = atoa(arguments);
    return thing.emitterSnapshot(args.shift()).apply(this, args);
  };
  thing.emitterSnapshot = function (type) {
    var et = (evt[type] || []).slice(0);
    return function () {
      var args = atoa(arguments);
      var ctx = this || thing;
      if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
      et.forEach(function emitter (listen) {
        if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
        if (listen._once) { thing.off(type, listen); }
      });
      return thing;
    };
  };
  return thing;
};

},{"./debounce":6,"atoa":2}],8:[function(require,module,exports){
(function (global){
'use strict';

var customEvent = require('custom-event');
var eventmap = require('./eventmap');
var doc = global.document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  var listener = unwrap(el, type, fn);
  if (listener) {
    return el.detachEvent('on' + type, listener);
  }
}

function fabricateEvent (el, type, model) {
  var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
  if (el.dispatchEvent) {
    el.dispatchEvent(e);
  } else {
    el.fireEvent('on' + type, e);
  }
  function makeClassicEvent () {
    var e;
    if (doc.createEvent) {
      e = doc.createEvent('Event');
      e.initEvent(type, true, true);
    } else if (doc.createEventObject) {
      e = doc.createEventObject();
    }
    return e;
  }
  function makeCustomEvent () {
    return new customEvent(type, { detail: model });
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault = e.preventDefault || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    e.which = e.which || e.keyCode;
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./eventmap":9,"custom-event":10}],9:[function(require,module,exports){
(function (global){
'use strict';

var eventmap = [];
var eventname = '';
var ron = /^on/;

for (eventname in global) {
  if (ron.test(eventname)) {
    eventmap.push(eventname.slice(2));
  }
}

module.exports = eventmap;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){

var NativeCustomEvent = global.CustomEvent;

function useNative () {
  try {
    var p = new NativeCustomEvent('cat', { detail: { foo: 'bar' } });
    return  'cat' === p.type && 'bar' === p.detail.foo;
  } catch (e) {
  }
  return false;
}

/**
 * Cross-browser `CustomEvent` constructor.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
 *
 * @public
 */

module.exports = useNative() ? NativeCustomEvent :

// IE >= 9
'undefined' !== typeof document && 'function' === typeof document.createEvent ? function CustomEvent (type, params) {
  var e = document.createEvent('CustomEvent');
  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, void 0);
  }
  return e;
} :

// IE <= 8
function CustomEvent (type, params) {
  var e = document.createEventObject();
  e.type = type;
  if (params) {
    e.bubbles = Boolean(params.bubbles);
    e.cancelable = Boolean(params.cancelable);
    e.detail = params.detail;
  } else {
    e.bubbles = false;
    e.cancelable = false;
    e.detail = void 0;
  }
  return e;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
'use strict';

function fuzzysearch (needle, haystack) {
  var tlen = haystack.length;
  var qlen = needle.length;
  if (qlen > tlen) {
    return false;
  }
  if (qlen === tlen) {
    return needle === haystack;
  }
  outer: for (var i = 0, j = 0; i < qlen; i++) {
    var nch = needle.charCodeAt(i);
    while (j < tlen) {
      if (haystack.charCodeAt(j++) === nch) {
        continue outer;
      }
    }
    return false;
  }
  return true;
}

module.exports = fuzzysearch;

},{}],12:[function(require,module,exports){
'use strict';

function pad (hash, len) {
  while (hash.length < len) {
    hash = '0' + hash;
  }
  return hash;
}

function fold (hash, text) {
  var i;
  var chr;
  var len;
  if (text.length === 0) {
    return hash;
  }
  for (i = 0, len = text.length; i < len; i++) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash < 0 ? hash * -2 : hash;
}

function foldObject (hash, o, seen) {
  return Object.keys(o).sort().reduce(foldKey, hash);
  function foldKey (hash, key) {
    return foldValue(hash, o[key], key, seen);
  }
}

function foldValue (input, value, key, seen) {
  var hash = fold(fold(fold(input, key), toString(value)), typeof value);
  if (value === null) {
    return fold(hash, 'null');
  }
  if (value === undefined) {
    return fold(hash, 'undefined');
  }
  if (typeof value === 'object' || typeof value === 'function') {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, '[Circular]' + key);
    }
    seen.push(value);

    var objHash = foldObject(hash, value, seen)

    if (!('valueOf' in value) || typeof value.valueOf !== 'function') {
      return objHash;
    }

    try {
      return fold(objHash, String(value.valueOf()))
    } catch (err) {
      return fold(objHash, '[valueOf exception]' + (err.stack || err.message))
    }
  }
  return fold(hash, value.toString());
}

function toString (o) {
  return Object.prototype.toString.call(o);
}

function sum (o) {
  return pad(foldValue(0, o, '', []).toString(16), 8);
}

module.exports = sum;

},{}],13:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":18}],14:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":13,"./_getRawTag":16,"./_objectToString":17}],15:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],16:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":13}],17:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],18:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":15}],19:[function(require,module,exports){
var isObject = require('./isObject'),
    now = require('./now'),
    toNumber = require('./toNumber');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;

},{"./isObject":20,"./now":23,"./toNumber":24}],20:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],21:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],22:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":14,"./isObjectLike":21}],23:[function(require,module,exports){
var root = require('./_root');

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;

},{"./_root":18}],24:[function(require,module,exports){
var isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isObject":20,"./isSymbol":22}],25:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],26:[function(require,module,exports){
(function (global){
'use strict';

var expando = 'sektor-' + Date.now();
var rsiblings = /[+~]/;
var document = global.document;
var del = (document && document.documentElement) || {};
var match = (
  del.matches ||
  del.webkitMatchesSelector ||
  del.mozMatchesSelector ||
  del.oMatchesSelector ||
  del.msMatchesSelector ||
  never
);

module.exports = sektor;

sektor.matches = matches;
sektor.matchesSelector = matchesSelector;

function qsa (selector, context) {
  var existed, id, prefix, prefixed, adapter, hack = context !== document;
  if (hack) { // id hack for context-rooted queries
    existed = context.getAttribute('id');
    id = existed || expando;
    prefix = '#' + id + ' ';
    prefixed = prefix + selector.replace(/,/g, ',' + prefix);
    adapter = rsiblings.test(selector) && context.parentNode;
    if (!existed) { context.setAttribute('id', id); }
  }
  try {
    return (adapter || context).querySelectorAll(prefixed || selector);
  } catch (e) {
    return [];
  } finally {
    if (existed === null) { context.removeAttribute('id'); }
  }
}

function sektor (selector, ctx, collection, seed) {
  var element;
  var context = ctx || document;
  var results = collection || [];
  var i = 0;
  if (typeof selector !== 'string') {
    return results;
  }
  if (context.nodeType !== 1 && context.nodeType !== 9) {
    return []; // bail if context is not an element or document
  }
  if (seed) {
    while ((element = seed[i++])) {
      if (matchesSelector(element, selector)) {
        results.push(element);
      }
    }
  } else {
    results.push.apply(results, qsa(selector, context));
  }
  return results;
}

function matches (selector, elements) {
  return sektor(selector, null, null, elements);
}

function matchesSelector (element, selector) {
  return match.call(element, selector);
}

function never () { return false; }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],27:[function(require,module,exports){
(function (global){
'use strict';

var getSelection;
var doc = global.document;
var getSelectionRaw = require('./getSelectionRaw');
var getSelectionNullOp = require('./getSelectionNullOp');
var getSelectionSynthetic = require('./getSelectionSynthetic');
var isHost = require('./isHost');
if (isHost.method(global, 'getSelection')) {
  getSelection = getSelectionRaw;
} else if (typeof doc.selection === 'object' && doc.selection) {
  getSelection = getSelectionSynthetic;
} else {
  getSelection = getSelectionNullOp;
}

module.exports = getSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./getSelectionNullOp":28,"./getSelectionRaw":29,"./getSelectionSynthetic":30,"./isHost":31}],28:[function(require,module,exports){
'use strict';

function noop () {}

function getSelectionNullOp () {
  return {
    removeAllRanges: noop,
    addRange: noop
  };
}

module.exports = getSelectionNullOp;

},{}],29:[function(require,module,exports){
(function (global){
'use strict';

function getSelectionRaw () {
  return global.getSelection();
}

module.exports = getSelectionRaw;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],30:[function(require,module,exports){
(function (global){
'use strict';

var rangeToTextRange = require('./rangeToTextRange');
var doc = global.document;
var body = doc.body;
var GetSelectionProto = GetSelection.prototype;

function GetSelection (selection) {
  var self = this;
  var range = selection.createRange();

  this._selection = selection;
  this._ranges = [];

  if (selection.type === 'Control') {
    updateControlSelection(self);
  } else if (isTextRange(range)) {
    updateFromTextRange(self, range);
  } else {
    updateEmptySelection(self);
  }
}

GetSelectionProto.removeAllRanges = function () {
  var textRange;
  try {
    this._selection.empty();
    if (this._selection.type !== 'None') {
      textRange = body.createTextRange();
      textRange.select();
      this._selection.empty();
    }
  } catch (e) {
  }
  updateEmptySelection(this);
};

GetSelectionProto.addRange = function (range) {
  if (this._selection.type === 'Control') {
    addRangeToControlSelection(this, range);
  } else {
    rangeToTextRange(range).select();
    this._ranges[0] = range;
    this.rangeCount = 1;
    this.isCollapsed = this._ranges[0].collapsed;
    updateAnchorAndFocusFromRange(this, range, false);
  }
};

GetSelectionProto.setRanges = function (ranges) {
  this.removeAllRanges();
  var rangeCount = ranges.length;
  if (rangeCount > 1) {
    createControlSelection(this, ranges);
  } else if (rangeCount) {
    this.addRange(ranges[0]);
  }
};

GetSelectionProto.getRangeAt = function (index) {
  if (index < 0 || index >= this.rangeCount) {
    throw new Error('getRangeAt(): index out of bounds');
  } else {
    return this._ranges[index].cloneRange();
  }
};

GetSelectionProto.removeRange = function (range) {
  if (this._selection.type !== 'Control') {
    removeRangeManually(this, range);
    return;
  }
  var controlRange = this._selection.createRange();
  var rangeElement = getSingleElementFromRange(range);
  var newControlRange = body.createControlRange();
  var el;
  var removed = false;
  for (var i = 0, len = controlRange.length; i < len; ++i) {
    el = controlRange.item(i);
    if (el !== rangeElement || removed) {
      newControlRange.add(controlRange.item(i));
    } else {
      removed = true;
    }
  }
  newControlRange.select();
  updateControlSelection(this);
};

GetSelectionProto.eachRange = function (fn, returnValue) {
  var i = 0;
  var len = this._ranges.length;
  for (i = 0; i < len; ++i) {
    if (fn(this.getRangeAt(i))) {
      return returnValue;
    }
  }
};

GetSelectionProto.getAllRanges = function () {
  var ranges = [];
  this.eachRange(function (range) {
    ranges.push(range);
  });
  return ranges;
};

GetSelectionProto.setSingleRange = function (range) {
  this.removeAllRanges();
  this.addRange(range);
};

function createControlSelection (sel, ranges) {
  var controlRange = body.createControlRange();
  for (var i = 0, el, len = ranges.length; i < len; ++i) {
    el = getSingleElementFromRange(ranges[i]);
    try {
      controlRange.add(el);
    } catch (e) {
      throw new Error('setRanges(): Element could not be added to control selection');
    }
  }
  controlRange.select();
  updateControlSelection(sel);
}

function removeRangeManually (sel, range) {
  var ranges = sel.getAllRanges();
  sel.removeAllRanges();
  for (var i = 0, len = ranges.length; i < len; ++i) {
    if (!isSameRange(range, ranges[i])) {
      sel.addRange(ranges[i]);
    }
  }
  if (!sel.rangeCount) {
    updateEmptySelection(sel);
  }
}

function updateAnchorAndFocusFromRange (sel, range) {
  var anchorPrefix = 'start';
  var focusPrefix = 'end';
  sel.anchorNode = range[anchorPrefix + 'Container'];
  sel.anchorOffset = range[anchorPrefix + 'Offset'];
  sel.focusNode = range[focusPrefix + 'Container'];
  sel.focusOffset = range[focusPrefix + 'Offset'];
}

function updateEmptySelection (sel) {
  sel.anchorNode = sel.focusNode = null;
  sel.anchorOffset = sel.focusOffset = 0;
  sel.rangeCount = 0;
  sel.isCollapsed = true;
  sel._ranges.length = 0;
}

function rangeContainsSingleElement (rangeNodes) {
  if (!rangeNodes.length || rangeNodes[0].nodeType !== 1) {
    return false;
  }
  for (var i = 1, len = rangeNodes.length; i < len; ++i) {
    if (!isAncestorOf(rangeNodes[0], rangeNodes[i])) {
      return false;
    }
  }
  return true;
}

function getSingleElementFromRange (range) {
  var nodes = range.getNodes();
  if (!rangeContainsSingleElement(nodes)) {
    throw new Error('getSingleElementFromRange(): range did not consist of a single element');
  }
  return nodes[0];
}

function isTextRange (range) {
  return range && range.text !== void 0;
}

function updateFromTextRange (sel, range) {
  sel._ranges = [range];
  updateAnchorAndFocusFromRange(sel, range, false);
  sel.rangeCount = 1;
  sel.isCollapsed = range.collapsed;
}

function updateControlSelection (sel) {
  sel._ranges.length = 0;
  if (sel._selection.type === 'None') {
    updateEmptySelection(sel);
  } else {
    var controlRange = sel._selection.createRange();
    if (isTextRange(controlRange)) {
      updateFromTextRange(sel, controlRange);
    } else {
      sel.rangeCount = controlRange.length;
      var range;
      for (var i = 0; i < sel.rangeCount; ++i) {
        range = doc.createRange();
        range.selectNode(controlRange.item(i));
        sel._ranges.push(range);
      }
      sel.isCollapsed = sel.rangeCount === 1 && sel._ranges[0].collapsed;
      updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
    }
  }
}

function addRangeToControlSelection (sel, range) {
  var controlRange = sel._selection.createRange();
  var rangeElement = getSingleElementFromRange(range);
  var newControlRange = body.createControlRange();
  for (var i = 0, len = controlRange.length; i < len; ++i) {
    newControlRange.add(controlRange.item(i));
  }
  try {
    newControlRange.add(rangeElement);
  } catch (e) {
    throw new Error('addRange(): Element could not be added to control selection');
  }
  newControlRange.select();
  updateControlSelection(sel);
}

function isSameRange (left, right) {
  return (
    left.startContainer === right.startContainer &&
    left.startOffset === right.startOffset &&
    left.endContainer === right.endContainer &&
    left.endOffset === right.endOffset
  );
}

function isAncestorOf (ancestor, descendant) {
  var node = descendant;
  while (node.parentNode) {
    if (node.parentNode === ancestor) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function getSelection () {
  return new GetSelection(global.document.selection);
}

module.exports = getSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./rangeToTextRange":32}],31:[function(require,module,exports){
'use strict';

function isHostMethod (host, prop) {
  var type = typeof host[prop];
  return type === 'function' || !!(type === 'object' && host[prop]) || type === 'unknown';
}

function isHostProperty (host, prop) {
  return typeof host[prop] !== 'undefined';
}

function many (fn) {
  return function areHosted (host, props) {
    var i = props.length;
    while (i--) {
      if (!fn(host, props[i])) {
        return false;
      }
    }
    return true;
  };
}

module.exports = {
  method: isHostMethod,
  methods: many(isHostMethod),
  property: isHostProperty,
  properties: many(isHostProperty)
};

},{}],32:[function(require,module,exports){
(function (global){
'use strict';

var doc = global.document;
var body = doc.body;

function rangeToTextRange (p) {
  if (p.collapsed) {
    return createBoundaryTextRange({ node: p.startContainer, offset: p.startOffset }, true);
  }
  var startRange = createBoundaryTextRange({ node: p.startContainer, offset: p.startOffset }, true);
  var endRange = createBoundaryTextRange({ node: p.endContainer, offset: p.endOffset }, false);
  var textRange = body.createTextRange();
  textRange.setEndPoint('StartToStart', startRange);
  textRange.setEndPoint('EndToEnd', endRange);
  return textRange;
}

function isCharacterDataNode (node) {
  var t = node.nodeType;
  return t === 3 || t === 4 || t === 8 ;
}

function createBoundaryTextRange (p, starting) {
  var bound;
  var parent;
  var offset = p.offset;
  var workingNode;
  var childNodes;
  var range = body.createTextRange();
  var data = isCharacterDataNode(p.node);

  if (data) {
    bound = p.node;
    parent = bound.parentNode;
  } else {
    childNodes = p.node.childNodes;
    bound = offset < childNodes.length ? childNodes[offset] : null;
    parent = p.node;
  }

  workingNode = doc.createElement('span');
  workingNode.innerHTML = '&#feff;';

  if (bound) {
    parent.insertBefore(workingNode, bound);
  } else {
    parent.appendChild(workingNode);
  }

  range.moveToElementText(workingNode);
  range.collapse(!starting);
  parent.removeChild(workingNode);

  if (data) {
    range[starting ? 'moveStart' : 'moveEnd']('character', offset);
  }
  return range;
}

module.exports = rangeToTextRange;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],33:[function(require,module,exports){
'use strict';

var getSelection = require('./getSelection');
var setSelection = require('./setSelection');

module.exports = {
  get: getSelection,
  set: setSelection
};

},{"./getSelection":27,"./setSelection":34}],34:[function(require,module,exports){
(function (global){
'use strict';

var getSelection = require('./getSelection');
var rangeToTextRange = require('./rangeToTextRange');
var doc = global.document;

function setSelection (p) {
  if (doc.createRange) {
    modernSelection();
  } else {
    oldSelection();
  }

  function modernSelection () {
    var sel = getSelection();
    var range = doc.createRange();
    if (!p.startContainer) {
      return;
    }
    if (p.endContainer) {
      range.setEnd(p.endContainer, p.endOffset);
    } else {
      range.setEnd(p.startContainer, p.startOffset);
    }
    range.setStart(p.startContainer, p.startOffset);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function oldSelection () {
    rangeToTextRange(p).select();
  }
}

module.exports = setSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./getSelection":27,"./rangeToTextRange":32}],35:[function(require,module,exports){
'use strict';

var get = easyGet;
var set = easySet;

if (document.selection && document.selection.createRange) {
  get = hardGet;
  set = hardSet;
}

function easyGet (el) {
  return {
    start: el.selectionStart,
    end: el.selectionEnd
  };
}

function hardGet (el) {
  var active = document.activeElement;
  if (active !== el) {
    el.focus();
  }

  var range = document.selection.createRange();
  var bookmark = range.getBookmark();
  var original = el.value;
  var marker = getUniqueMarker(original);
  var parent = range.parentElement();
  if (parent === null || !inputs(parent)) {
    return result(0, 0);
  }
  range.text = marker + range.text + marker;

  var contents = el.value;

  el.value = original;
  range.moveToBookmark(bookmark);
  range.select();

  return result(contents.indexOf(marker), contents.lastIndexOf(marker) - marker.length);

  function result (start, end) {
    if (active !== el) { // don't disrupt pre-existing state
      if (active) {
        active.focus();
      } else {
        el.blur();
      }
    }
    return { start: start, end: end };
  }
}

function getUniqueMarker (contents) {
  var marker;
  do {
    marker = '@@marker.' + Math.random() * new Date();
  } while (contents.indexOf(marker) !== -1);
  return marker;
}

function inputs (el) {
  return ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA');
}

function easySet (el, p) {
  el.selectionStart = parse(el, p.start);
  el.selectionEnd = parse(el, p.end);
}

function hardSet (el, p) {
  var range = el.createTextRange();

  if (p.start === 'end' && p.end === 'end') {
    range.collapse(false);
    range.select();
  } else {
    range.collapse(true);
    range.moveEnd('character', parse(el, p.end));
    range.moveStart('character', parse(el, p.start));
    range.select();
  }
}

function parse (el, value) {
  return value === 'end' ? el.value.length : value || 0;
}

function sell (el, p) {
  if (arguments.length === 2) {
    set(el, p);
  }
  return get(el);
}

module.exports = sell;

},{}],36:[function(require,module,exports){
(function (setImmediate){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
}).call(this,require("timers").setImmediate)

},{"timers":37}],37:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":25,"timers":37}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJob3JzZXkuanMiLCIuLi9ub2RlX21vZHVsZXMvYXRvYS9hdG9hLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2J1bGxzZXllL2J1bGxzZXllLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2J1bGxzZXllL3RhaWxvcm1hZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvYnVsbHNleWUvdGhyb3R0bGUuanMiLCIuLi9ub2RlX21vZHVsZXMvY29udHJhL2RlYm91bmNlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NvbnRyYS9lbWl0dGVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvZXZlbnRtYXAuanMiLCIuLi9ub2RlX21vZHVsZXMvY3VzdG9tLWV2ZW50L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Z1enp5c2VhcmNoL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2hhc2gtc3VtL2hhc2gtc3VtLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUdldFRhZy5qcyIsIi4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2ZyZWVHbG9iYWwuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoL19nZXRSYXdUYWcuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoL19vYmplY3RUb1N0cmluZy5qcyIsIi4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3Jvb3QuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIi4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC90b051bWJlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VrdG9yL3NyYy9zZWt0b3IuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb24uanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25OdWxsT3AuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25SYXcuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25TeW50aGV0aWMuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9pc0hvc3QuanMiLCIuLi9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9yYW5nZVRvVGV4dFJhbmdlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2VsZWNjaW9uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2V0U2VsZWN0aW9uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NlbGwvc2VsbC5qcyIsIi4uL25vZGVfbW9kdWxlcy90aWNreS90aWNreS1icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3RpbWVycy1icm93c2VyaWZ5L21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTSxhQUFhLEdBQUcsQ0FBdEI7QUFDQSxJQUFNLFNBQVMsR0FBRyxFQUFsQjtBQUNBLElBQU0sT0FBTyxHQUFHLEVBQWhCO0FBQ0EsSUFBTSxNQUFNLEdBQUcsRUFBZjtBQUNBLElBQU0sUUFBUSxHQUFHLEVBQWpCO0FBQ0EsSUFBTSxPQUFPLEdBQUcs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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBzdW0gZnJvbSAnaGFzaC1zdW0nO1xuaW1wb3J0IHNlbGwgZnJvbSAnc2VsbCc7XG5pbXBvcnQgc2VrdG9yIGZyb20gJ3Nla3Rvcic7XG5pbXBvcnQgZW1pdHRlciBmcm9tICdjb250cmEvZW1pdHRlcic7XG5pbXBvcnQgYnVsbHNleWUgZnJvbSAnYnVsbHNleWUnO1xuaW1wb3J0IGNyb3NzdmVudCBmcm9tICdjcm9zc3ZlbnQnO1xuaW1wb3J0IGZ1enp5c2VhcmNoIGZyb20gJ2Z1enp5c2VhcmNoJztcbmltcG9ydCBkZWJvdW5jZSBmcm9tICdsb2Rhc2gvZGVib3VuY2UnO1xuY29uc3QgS0VZX0JBQ0tTUEFDRSA9IDg7XG5jb25zdCBLRVlfRU5URVIgPSAxMztcbmNvbnN0IEtFWV9FU0MgPSAyNztcbmNvbnN0IEtFWV9VUCA9IDM4O1xuY29uc3QgS0VZX0RPV04gPSA0MDtcbmNvbnN0IEtFWV9UQUIgPSA5O1xuY29uc3QgZG9jID0gZG9jdW1lbnQ7XG5jb25zdCBkb2NFbGVtZW50ID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuZnVuY3Rpb24gaG9yc2V5IChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBzZXRBcHBlbmRzLFxuICAgIHNldCxcbiAgICBmaWx0ZXIsXG4gICAgc291cmNlLFxuICAgIGNhY2hlID0ge30sXG4gICAgcHJlZGljdE5leHRTZWFyY2gsXG4gICAgcmVuZGVySXRlbSxcbiAgICByZW5kZXJDYXRlZ29yeSxcbiAgICBibGFua1NlYXJjaCxcbiAgICBhcHBlbmRUbyxcbiAgICBhbmNob3IsXG4gICAgZGVib3VuY2VcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNhY2hpbmcgPSBvcHRpb25zLmNhY2hlICE9PSBmYWxzZTtcbiAgaWYgKCFzb3VyY2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB1c2VyR2V0VGV4dCA9IG9wdGlvbnMuZ2V0VGV4dDtcbiAgY29uc3QgdXNlckdldFZhbHVlID0gb3B0aW9ucy5nZXRWYWx1ZTtcbiAgY29uc3QgZ2V0VGV4dCA9IChcbiAgICB0eXBlb2YgdXNlckdldFRleHQgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRUZXh0XSA6XG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnZnVuY3Rpb24nID8gdXNlckdldFRleHQgOlxuICAgIGQgPT4gZC50b1N0cmluZygpXG4gICk7XG4gIGNvbnN0IGdldFZhbHVlID0gKFxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRWYWx1ZV0gOlxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdmdW5jdGlvbicgPyB1c2VyR2V0VmFsdWUgOlxuICAgIGQgPT4gZFxuICApO1xuXG4gIGxldCBwcmV2aW91c1N1Z2dlc3Rpb25zID0gW107XG4gIGxldCBwcmV2aW91c1NlbGVjdGlvbiA9IG51bGw7XG4gIGNvbnN0IGxpbWl0ID0gTnVtYmVyKG9wdGlvbnMubGltaXQpIHx8IEluZmluaXR5O1xuICBjb25zdCBjb21wbGV0ZXIgPSBhdXRvY29tcGxldGUoZWwsIHtcbiAgICBzb3VyY2U6IHNvdXJjZUZ1bmN0aW9uLFxuICAgIGxpbWl0LFxuICAgIGdldFRleHQsXG4gICAgZ2V0VmFsdWUsXG4gICAgc2V0QXBwZW5kcyxcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcbiAgICByZW5kZXJJdGVtLFxuICAgIHJlbmRlckNhdGVnb3J5LFxuICAgIGFwcGVuZFRvLFxuICAgIGFuY2hvcixcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dDogb3B0aW9ucy5ub01hdGNoZXMsXG4gICAgYmxhbmtTZWFyY2gsXG4gICAgZGVib3VuY2UsXG4gICAgc2V0IChzKSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyAhPT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTZWxlY3Rpb24gPSBzO1xuICAgICAgKHNldCB8fCBjb21wbGV0ZXIuZGVmYXVsdFNldHRlcikoZ2V0VGV4dChzKSwgcyk7XG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYWZ0ZXJTZXQnKTtcbiAgICB9LFxuICAgIGZpbHRlclxuICB9KTtcbiAgcmV0dXJuIGNvbXBsZXRlcjtcbiAgZnVuY3Rpb24gbm9NYXRjaGVzIChkYXRhKSB7XG4gICAgaWYgKCFvcHRpb25zLm5vTWF0Y2hlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5xdWVyeS5sZW5ndGg7XG4gIH1cbiAgZnVuY3Rpb24gc291cmNlRnVuY3Rpb24gKGRhdGEsIGRvbmUpIHtcbiAgICBjb25zdCB7cXVlcnksIGxpbWl0fSA9IGRhdGE7XG4gICAgaWYgKCFvcHRpb25zLmJsYW5rU2VhcmNoICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgZG9uZShudWxsLCBbXSwgdHJ1ZSk7IHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbXBsZXRlcikge1xuICAgICAgY29tcGxldGVyLmVtaXQoJ2JlZm9yZVVwZGF0ZScpO1xuICAgIH1cbiAgICBjb25zdCBoYXNoID0gc3VtKHF1ZXJ5KTsgLy8gZmFzdCwgY2FzZSBpbnNlbnNpdGl2ZSwgcHJldmVudHMgY29sbGlzaW9uc1xuICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGNhY2hlW2hhc2hdO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gZW50cnkuY3JlYXRlZC5nZXRUaW1lKCk7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gY2FjaGUuZHVyYXRpb24gfHwgNjAgKiA2MCAqIDI0O1xuICAgICAgICBjb25zdCBkaWZmID0gZHVyYXRpb24gKiAxMDAwO1xuICAgICAgICBjb25zdCBmcmVzaCA9IG5ldyBEYXRlKHN0YXJ0ICsgZGlmZikgPiBuZXcgRGF0ZSgpO1xuICAgICAgICBpZiAoZnJlc2gpIHtcbiAgICAgICAgICBkb25lKG51bGwsIGVudHJ5Lml0ZW1zLnNsaWNlKCkpOyByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNvdXJjZURhdGEgPSB7XG4gICAgICBwcmV2aW91c1N1Z2dlc3Rpb25zOiBwcmV2aW91c1N1Z2dlc3Rpb25zLnNsaWNlKCksXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbixcbiAgICAgIGlucHV0OiBxdWVyeSxcbiAgICAgIHJlbmRlckl0ZW0sXG4gICAgICByZW5kZXJDYXRlZ29yeSxcbiAgICAgIGxpbWl0XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLnNvdXJjZShzb3VyY2VEYXRhLCBzb3VyY2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc291cmNlZChudWxsLCBvcHRpb25zLnNvdXJjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBdXRvY29tcGxldGUgc291cmNlIGVycm9yLicsIGVyciwgZWwpO1xuICAgICAgICBkb25lKGVyciwgW10pO1xuICAgICAgfVxuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQgOiBbXTtcbiAgICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICAgIGNhY2hlW2hhc2hdID0geyBjcmVhdGVkOiBuZXcgRGF0ZSgpLCBpdGVtcyB9O1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTdWdnZXN0aW9ucyA9IGl0ZW1zO1xuICAgICAgZG9uZShudWxsLCBpdGVtcy5zbGljZSgpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXV0b2NvbXBsZXRlIChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IG8gPSBvcHRpb25zO1xuICBjb25zdCBwYXJlbnQgPSBvLmFwcGVuZFRvIHx8IGRvYy5ib2R5O1xuICBjb25zdCB7XG4gICAgZ2V0VGV4dCxcbiAgICBnZXRWYWx1ZSxcbiAgICBmb3JtLFxuICAgIHNvdXJjZSxcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dCxcbiAgICBoaWdobGlnaHRlciA9IHRydWUsXG4gICAgaGlnaGxpZ2h0Q29tcGxldGVXb3JkcyA9IHRydWUsXG4gICAgcmVuZGVySXRlbSA9IGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgcmVuZGVyQ2F0ZWdvcnkgPSBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlcixcbiAgICBzZXRBcHBlbmRzXG4gIH0gPSBvO1xuICBjb25zdCBsaW1pdCA9IHR5cGVvZiBvLmxpbWl0ID09PSAnbnVtYmVyJyA/IG8ubGltaXQgOiBJbmZpbml0eTtcbiAgY29uc3QgdXNlckZpbHRlciA9IG8uZmlsdGVyIHx8IGRlZmF1bHRGaWx0ZXI7XG4gIGNvbnN0IHVzZXJTZXQgPSBvLnNldCB8fCBkZWZhdWx0U2V0dGVyO1xuICBjb25zdCBjYXRlZ29yaWVzID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3JpZXMnKTtcbiAgY29uc3QgY29udGFpbmVyID0gdGFnKCdkaXYnLCAnc2V5LWNvbnRhaW5lcicpO1xuICBjb25zdCBkZWZlcnJlZEZpbHRlcmluZyA9IGRlZmVyKGZpbHRlcmluZyk7XG4gIGNvbnN0IHN0YXRlID0geyBjb3VudGVyOiAwLCBxdWVyeTogbnVsbCB9O1xuICBsZXQgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBsZXQgc2VsZWN0aW9uID0gbnVsbDtcbiAgbGV0IGV5ZTtcbiAgbGV0IGF0dGFjaG1lbnQgPSBlbDtcbiAgbGV0IG5vbmVNYXRjaDtcbiAgbGV0IHRleHRJbnB1dDtcbiAgbGV0IGFueUlucHV0O1xuICBsZXQgcmFuY2hvcmxlZnQ7XG4gIGxldCByYW5jaG9ycmlnaHQ7XG4gIGxldCBsYXN0UHJlZml4ID0gJyc7XG4gIGNvbnN0IGRlYm91bmNlVGltZSA9IG8uZGVib3VuY2UgfHwgMzAwO1xuICBjb25zdCBkZWJvdW5jZWRMb2FkaW5nID0gZGVib3VuY2UobG9hZGluZywgZGVib3VuY2VUaW1lKTtcblxuICBpZiAoby5hdXRvSGlkZU9uQmx1ciA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkJsdXIgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9IaWRlT25DbGljayA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkNsaWNrID0gdHJ1ZTsgfVxuICBpZiAoby5hdXRvU2hvd09uVXBEb3duID09PSB2b2lkIDApIHsgby5hdXRvU2hvd09uVXBEb3duID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJzsgfVxuICBpZiAoby5hbmNob3IpIHtcbiAgICByYW5jaG9ybGVmdCA9IG5ldyBSZWdFeHAoJ14nICsgby5hbmNob3IpO1xuICAgIHJhbmNob3JyaWdodCA9IG5ldyBSZWdFeHAoby5hbmNob3IgKyAnJCcpO1xuICB9XG5cbiAgbGV0IGhhc0l0ZW1zID0gZmFsc2U7XG4gIGNvbnN0IGFwaSA9IGVtaXR0ZXIoe1xuICAgIGFuY2hvcjogby5hbmNob3IsXG4gICAgY2xlYXIsXG4gICAgc2hvdyxcbiAgICBoaWRlLFxuICAgIHRvZ2dsZSxcbiAgICBkZXN0cm95LFxuICAgIHJlZnJlc2hQb3NpdGlvbixcbiAgICBhcHBlbmRUZXh0LFxuICAgIGFwcGVuZEhUTUwsXG4gICAgZmlsdGVyQW5jaG9yZWRUZXh0LFxuICAgIGZpbHRlckFuY2hvcmVkSFRNTCxcbiAgICBkZWZhdWx0QXBwZW5kVGV4dDogYXBwZW5kVGV4dCxcbiAgICBkZWZhdWx0RmlsdGVyLFxuICAgIGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIsXG4gICAgZGVmYXVsdFNldHRlcixcbiAgICByZXRhcmdldCxcbiAgICBhdHRhY2htZW50LFxuICAgIHNvdXJjZTogW11cbiAgfSk7XG5cbiAgcmV0YXJnZXQoZWwpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2F0ZWdvcmllcyk7XG4gIGlmIChub01hdGNoZXMgJiYgbm9NYXRjaGVzVGV4dCkge1xuICAgIG5vbmVNYXRjaCA9IHRhZygnZGl2JywgJ3NleS1lbXB0eSBzZXktaGlkZScpO1xuICAgIHRleHQobm9uZU1hdGNoLCBub01hdGNoZXNUZXh0KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9uZU1hdGNoKTtcbiAgfVxuICBwYXJlbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGxvYWRlZChzb3VyY2UsIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG5cbiAgZnVuY3Rpb24gcmV0YXJnZXQgKGVsKSB7XG4gICAgaW5wdXRFdmVudHModHJ1ZSk7XG4gICAgYXR0YWNobWVudCA9IGFwaS5hdHRhY2htZW50ID0gZWw7XG4gICAgdGV4dElucHV0ID0gYXR0YWNobWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGF0dGFjaG1lbnQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbiAgICBhbnlJbnB1dCA9IHRleHRJbnB1dCB8fCBpc0VkaXRhYmxlKGF0dGFjaG1lbnQpO1xuICAgIGlucHV0RXZlbnRzKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWZyZXNoUG9zaXRpb24gKCkge1xuICAgIGlmIChleWUpIHsgZXllLnJlZnJlc2goKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGluZyAoZm9yY2VTaG93KSB7XG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LnJlbW92ZShhdHRhY2htZW50LCAnZm9jdXMnLCBsb2FkaW5nKTtcbiAgICBjb25zdCBxdWVyeSA9IHJlYWRJbnB1dCgpO1xuICAgIGlmIChxdWVyeSA9PT0gc3RhdGUucXVlcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFzSXRlbXMgPSBmYWxzZTtcbiAgICBzdGF0ZS5xdWVyeSA9IHF1ZXJ5O1xuXG4gICAgY29uc3QgY291bnRlciA9ICsrc3RhdGUuY291bnRlcjtcblxuICAgIHNvdXJjZSh7IHF1ZXJ5LCBsaW1pdCB9LCBzb3VyY2VkKTtcblxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0LCBibGFua1F1ZXJ5KSB7XG4gICAgICBpZiAoc3RhdGUuY291bnRlciAhPT0gY291bnRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2FkZWQocmVzdWx0LCBmb3JjZVNob3cpO1xuICAgICAgaWYgKGVyciB8fCBibGFua1F1ZXJ5KSB7XG4gICAgICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGVkIChjYXRlZ29yaWVzLCBmb3JjZVNob3cpIHtcbiAgICBjbGVhcigpO1xuICAgIGhhc0l0ZW1zID0gdHJ1ZTtcbiAgICBhcGkuc291cmNlID0gW107XG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiBjYXQubGlzdC5mb3JFYWNoKHN1Z2dlc3Rpb24gPT4gYWRkKHN1Z2dlc3Rpb24sIGNhdCkpKTtcbiAgICBpZiAoZm9yY2VTaG93KSB7XG4gICAgICBzaG93KCk7XG4gICAgfVxuICAgIGZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIgKCkge1xuICAgIHVuc2VsZWN0KCk7XG4gICAgd2hpbGUgKGNhdGVnb3JpZXMubGFzdENoaWxkKSB7XG4gICAgICBjYXRlZ29yaWVzLnJlbW92ZUNoaWxkKGNhdGVnb3JpZXMubGFzdENoaWxkKTtcbiAgICB9XG4gICAgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkSW5wdXQgKCkge1xuICAgIHJldHVybiAodGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUwpLnRyaW0oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENhdGVnb3J5IChkYXRhKSB7XG4gICAgaWYgKCFkYXRhLmlkKSB7XG4gICAgICBkYXRhLmlkID0gJ2RlZmF1bHQnO1xuICAgIH1cbiAgICBpZiAoIWNhdGVnb3J5TWFwW2RhdGEuaWRdKSB7XG4gICAgICBjYXRlZ29yeU1hcFtkYXRhLmlkXSA9IGNyZWF0ZUNhdGVnb3J5KCk7XG4gICAgfVxuICAgIHJldHVybiBjYXRlZ29yeU1hcFtkYXRhLmlkXTtcbiAgICBmdW5jdGlvbiBjcmVhdGVDYXRlZ29yeSAoKSB7XG4gICAgICBjb25zdCBjYXRlZ29yeSA9IHRhZygnZGl2JywgJ3NleS1jYXRlZ29yeScpO1xuICAgICAgY29uc3QgdWwgPSB0YWcoJ3VsJywgJ3NleS1saXN0Jyk7XG4gICAgICByZW5kZXJDYXRlZ29yeShjYXRlZ29yeSwgZGF0YSk7XG4gICAgICBjYXRlZ29yeS5hcHBlbmRDaGlsZCh1bCk7XG4gICAgICBjYXRlZ29yaWVzLmFwcGVuZENoaWxkKGNhdGVnb3J5KTtcbiAgICAgIHJldHVybiB7IGRhdGEsIHVsIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkIChzdWdnZXN0aW9uLCBjYXRlZ29yeURhdGEpIHtcbiAgICBjb25zdCBjYXQgPSBnZXRDYXRlZ29yeShjYXRlZ29yeURhdGEpO1xuICAgIGNvbnN0IGxpID0gdGFnKCdsaScsICdzZXktaXRlbScpO1xuICAgIHJlbmRlckl0ZW0obGksIHN1Z2dlc3Rpb24pO1xuICAgIGlmIChoaWdobGlnaHRlcikge1xuICAgICAgYnJlYWt1cEZvckhpZ2hsaWdodGVyKGxpKTtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ21vdXNlZW50ZXInLCBob3ZlclN1Z2dlc3Rpb24pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdjbGljaycsIGNsaWNrZWRTdWdnZXN0aW9uKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnaG9yc2V5LWZpbHRlcicsIGZpbHRlckl0ZW0pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdob3JzZXktaGlkZScsIGhpZGVJdGVtKTtcbiAgICBjYXQudWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgIGFwaS5zb3VyY2UucHVzaChzdWdnZXN0aW9uKTtcbiAgICByZXR1cm4gbGk7XG5cbiAgICBmdW5jdGlvbiBob3ZlclN1Z2dlc3Rpb24gKCkge1xuICAgICAgc2VsZWN0KGxpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGlja2VkU3VnZ2VzdGlvbiAoKSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGdldFRleHQoc3VnZ2VzdGlvbik7XG4gICAgICBzZXQoc3VnZ2VzdGlvbik7XG4gICAgICBoaWRlKCk7XG4gICAgICBhdHRhY2htZW50LmZvY3VzKCk7XG4gICAgICBsYXN0UHJlZml4ID0gby5wcmVkaWN0TmV4dFNlYXJjaCAmJiBvLnByZWRpY3ROZXh0U2VhcmNoKHtcbiAgICAgICAgaW5wdXQ6IGlucHV0LFxuICAgICAgICBzb3VyY2U6IGFwaS5zb3VyY2Uuc2xpY2UoKSxcbiAgICAgICAgc2VsZWN0aW9uOiBzdWdnZXN0aW9uXG4gICAgICB9KSB8fCAnJztcbiAgICAgIGlmIChsYXN0UHJlZml4KSB7XG4gICAgICAgIGVsLnZhbHVlID0gbGFzdFByZWZpeDtcbiAgICAgICAgZWwuc2VsZWN0KCk7XG4gICAgICAgIHNob3coKTtcbiAgICAgICAgZmlsdGVyaW5nKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySXRlbSAoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xuICAgICAgaWYgKGZpbHRlcih2YWx1ZSwgc3VnZ2VzdGlvbikpIHtcbiAgICAgICAgbGkuY2xhc3NOYW1lID0gbGkuY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktaGlkZS9nLCAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlSXRlbSAoKSB7XG4gICAgICBpZiAoIWhpZGRlbihsaSkpIHtcbiAgICAgICAgbGkuY2xhc3NOYW1lICs9ICcgc2V5LWhpZGUnO1xuICAgICAgICBpZiAoc2VsZWN0aW9uID09PSBsaSkge1xuICAgICAgICAgIHVuc2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBicmVha3VwRm9ySGlnaGxpZ2h0ZXIgKGVsKSB7XG4gICAgZ2V0VGV4dENoaWxkcmVuKGVsKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICBjb25zdCB0ZXh0ID0gZWwudGV4dENvbnRlbnQgfHwgZWwubm9kZVZhbHVlIHx8ICcnO1xuICAgICAgaWYgKHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGNoYXIgb2YgdGV4dCkge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHNwYW5Gb3IoY2hhciksIGVsKTtcbiAgICAgIH1cbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbCk7XG4gICAgICBmdW5jdGlvbiBzcGFuRm9yIChjaGFyKSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzcGFuLmNsYXNzTmFtZSA9ICdzZXktY2hhcic7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSBzcGFuLmlubmVyVGV4dCA9IGNoYXI7XG4gICAgICAgIHJldHVybiBzcGFuO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0IChlbCwgbmVlZGxlKSB7XG4gICAgY29uc3QgcndvcmQgPSAvW1xccywuX1xcW1xcXXt9KCktXS9nO1xuICAgIGNvbnN0IHdvcmRzID0gbmVlZGxlLnNwbGl0KHJ3b3JkKS5maWx0ZXIodyA9PiB3Lmxlbmd0aCk7XG4gICAgY29uc3QgZWxlbXMgPSBbLi4uZWwucXVlcnlTZWxlY3RvckFsbCgnLnNleS1jaGFyJyldO1xuICAgIGxldCBjaGFycztcbiAgICBsZXQgc3RhcnRJbmRleCA9IDA7XG5cbiAgICBiYWxhbmNlKCk7XG4gICAgaWYgKGhpZ2hsaWdodENvbXBsZXRlV29yZHMpIHtcbiAgICAgIHdob2xlKCk7XG4gICAgfVxuICAgIGZ1enp5KCk7XG4gICAgY2xlYXJSZW1haW5kZXIoKTtcblxuICAgIGZ1bmN0aW9uIGJhbGFuY2UgKCkge1xuICAgICAgY2hhcnMgPSBlbGVtcy5tYXAoZWwgPT4gZWwuaW5uZXJUZXh0IHx8IGVsLnRleHRDb250ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aG9sZSAoKSB7XG4gICAgICBmb3IgKGxldCB3b3JkIG9mIHdvcmRzKSB7XG4gICAgICAgIGxldCB0ZW1wSW5kZXggPSBzdGFydEluZGV4O1xuICAgICAgICByZXRyeTogd2hpbGUgKHRlbXBJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5pdCA9IHRydWU7XG4gICAgICAgICAgbGV0IHByZXZJbmRleCA9IHRlbXBJbmRleDtcbiAgICAgICAgICBmb3IgKGxldCBjaGFyIG9mIHdvcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGkgPSBjaGFycy5pbmRleE9mKGNoYXIsIHByZXZJbmRleCArIDEpO1xuICAgICAgICAgICAgY29uc3QgZmFpbCA9IGkgPT09IC0xIHx8ICghaW5pdCAmJiBwcmV2SW5kZXggKyAxICE9PSBpKTtcbiAgICAgICAgICAgIGlmIChpbml0KSB7XG4gICAgICAgICAgICAgIGluaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGVtcEluZGV4ID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmYWlsKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlIHJldHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkluZGV4ID0gaTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgZWwgb2YgZWxlbXMuc3BsaWNlKHRlbXBJbmRleCwgMSArIHByZXZJbmRleCAtIHRlbXBJbmRleCkpIHtcbiAgICAgICAgICAgIG9uKGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYmFsYW5jZSgpO1xuICAgICAgICAgIG5lZWRsZSA9IG5lZWRsZS5yZXBsYWNlKHdvcmQsICcnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZ1enp5ICgpIHtcbiAgICAgIGZvciAobGV0IGlucHV0IG9mIG5lZWRsZSkge1xuICAgICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IGVsID0gZWxlbXMuc2hpZnQoKTtcbiAgICAgICAgICBpZiAoKGVsLmlubmVyVGV4dCB8fCBlbC50ZXh0Q29udGVudCkgPT09IGlucHV0KSB7XG4gICAgICAgICAgICBvbihlbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2ZmKGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhclJlbWFpbmRlciAoKSB7XG4gICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICAgIG9mZihlbGVtcy5zaGlmdCgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbiAoY2gpIHtcbiAgICAgIGNoLmNsYXNzTGlzdC5hZGQoJ3NleS1jaGFyLWhpZ2hsaWdodCcpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvZmYgKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUZXh0Q2hpbGRyZW4gKGVsKSB7XG4gICAgY29uc3QgdGV4dHMgPSBbXTtcbiAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpO1xuICAgIGxldCBub2RlO1xuICAgIHdoaWxlIChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgIHRleHRzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldCAodmFsdWUpIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIHJldHVybiAoaXNUZXh0KCkgPyBhcGkuYXBwZW5kVGV4dCA6IGFwaS5hcHBlbmRIVE1MKShnZXRWYWx1ZSh2YWx1ZSkpO1xuICAgIH1cbiAgICB1c2VyU2V0KHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlciAodmFsdWUsIHN1Z2dlc3Rpb24pIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIGNvbnN0IGlsID0gKGlzVGV4dCgpID8gYXBpLmZpbHRlckFuY2hvcmVkVGV4dCA6IGFwaS5maWx0ZXJBbmNob3JlZEhUTUwpKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgICAgIHJldHVybiBpbCA/IHVzZXJGaWx0ZXIoaWwuaW5wdXQsIGlsLnN1Z2dlc3Rpb24pIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB1c2VyRmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzVGV4dCAoKSB7IHJldHVybiBpc0lucHV0KGF0dGFjaG1lbnQpOyB9XG4gIGZ1bmN0aW9uIHZpc2libGUgKCkgeyByZXR1cm4gY29udGFpbmVyLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktc2hvdycpICE9PSAtMTsgfVxuICBmdW5jdGlvbiBoaWRkZW4gKGxpKSB7IHJldHVybiBsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSAhPT0gLTE7IH1cblxuICBmdW5jdGlvbiBzaG93ICgpIHtcbiAgICBleWUucmVmcmVzaCgpO1xuICAgIGlmICghdmlzaWJsZSgpKSB7XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgc2V5LXNob3cnO1xuICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LXNob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVyIChlKSB7XG4gICAgY29uc3QgbGVmdCA9IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5O1xuICAgIGlmIChsZWZ0ID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuOyAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgaG9uZXN0IHRvIGdvZCBsZWZ0LWNsaWNrc1xuICAgIH1cbiAgICB0b2dnbGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZSAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHNob3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdCAobGkpIHtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGlmIChsaSkge1xuICAgICAgc2VsZWN0aW9uID0gbGk7XG4gICAgICBzZWxlY3Rpb24uY2xhc3NOYW1lICs9ICcgc2V5LXNlbGVjdGVkJztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1bnNlbGVjdCAoKSB7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSA9IHNlbGVjdGlvbi5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zZWxlY3RlZC9nLCAnJyk7XG4gICAgICBzZWxlY3Rpb24gPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUgKHVwLCBtb3Zlcykge1xuICAgIGNvbnN0IHRvdGFsID0gYXBpLnNvdXJjZS5sZW5ndGg7XG4gICAgaWYgKHRvdGFsID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb3ZlcyA+IHRvdGFsKSB7XG4gICAgICB1bnNlbGVjdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjYXQgPSBmaW5kQ2F0ZWdvcnkoc2VsZWN0aW9uKSB8fCBjYXRlZ29yaWVzLmZpcnN0Q2hpbGQ7XG4gICAgY29uc3QgZmlyc3QgPSB1cCA/ICdsYXN0Q2hpbGQnIDogJ2ZpcnN0Q2hpbGQnO1xuICAgIGNvbnN0IGxhc3QgPSB1cCA/ICdmaXJzdENoaWxkJyA6ICdsYXN0Q2hpbGQnO1xuICAgIGNvbnN0IG5leHQgPSB1cCA/ICdwcmV2aW91c1NpYmxpbmcnIDogJ25leHRTaWJsaW5nJztcbiAgICBjb25zdCBwcmV2ID0gdXAgPyAnbmV4dFNpYmxpbmcnIDogJ3ByZXZpb3VzU2libGluZyc7XG4gICAgY29uc3QgbGkgPSBmaW5kTmV4dCgpO1xuICAgIHNlbGVjdChsaSk7XG5cbiAgICBpZiAoaGlkZGVuKGxpKSkge1xuICAgICAgbW92ZSh1cCwgbW92ZXMgPyBtb3ZlcyArIDEgOiAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2F0ZWdvcnkgKGVsKSB7XG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgaWYgKHNla3Rvci5tYXRjaGVzU2VsZWN0b3IoZWwucGFyZW50RWxlbWVudCwgJy5zZXktY2F0ZWdvcnknKSkge1xuICAgICAgICAgIHJldHVybiBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmROZXh0ICgpIHtcbiAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbltuZXh0XSkge1xuICAgICAgICAgIHJldHVybiBzZWxlY3Rpb25bbmV4dF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhdFtuZXh0XSAmJiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XSkge1xuICAgICAgICAgIHJldHVybiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdGVnb3JpZXNbZmlyc3RdKVtmaXJzdF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgZXllLnNsZWVwKCk7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zaG93L2csICcnKTtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1oaWRlJyk7XG4gICAgaWYgKGVsLnZhbHVlID09PSBsYXN0UHJlZml4KSB7XG4gICAgICBlbC52YWx1ZSA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGtleWRvd24gKGUpIHtcbiAgICBjb25zdCBzaG93biA9IHZpc2libGUoKTtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0RPV04pIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfVVApIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUodHJ1ZSk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0JBQ0tTUEFDRSkge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzaG93bikge1xuICAgICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoc2VsZWN0aW9uLCAnY2xpY2snKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IEtFWV9FU0MpIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgICBzdG9wKGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3AgKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QuYWRkKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcmluZyAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVib3VuY2VkTG9hZGluZyh0cnVlKTtcbiAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktZmlsdGVyJyk7XG4gICAgY29uc3QgdmFsdWUgPSByZWFkSW5wdXQoKTtcbiAgICBpZiAoIW8uYmxhbmtTZWFyY2ggJiYgIXZhbHVlKSB7XG4gICAgICBoaWRlKCk7IHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgbm9tYXRjaCA9IG5vTWF0Y2hlcyh7IHF1ZXJ5OiB2YWx1ZSB9KTtcbiAgICBsZXQgY291bnQgPSB3YWxrQ2F0ZWdvcmllcygpO1xuICAgIGlmIChjb3VudCA9PT0gMCAmJiBub21hdGNoICYmIGhhc0l0ZW1zKSB7XG4gICAgICBzaG93Tm9SZXN1bHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVOb1Jlc3VsdHMoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24pIHtcbiAgICAgIG1vdmUoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24gJiYgIW5vbWF0Y2gpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gd2Fsa0NhdGVnb3JpZXMgKCkge1xuICAgICAgbGV0IGNhdGVnb3J5ID0gY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChjYXRlZ29yeSkge1xuICAgICAgICBjb25zdCBsaXN0ID0gZmluZExpc3QoY2F0ZWdvcnkpO1xuICAgICAgICBjb25zdCBwYXJ0aWFsID0gd2Fsa0NhdGVnb3J5KGxpc3QpO1xuICAgICAgICBpZiAocGFydGlhbCA9PT0gMCkge1xuICAgICAgICAgIGNhdGVnb3J5LmNsYXNzTGlzdC5hZGQoJ3NleS1oaWRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudCArPSBwYXJ0aWFsO1xuICAgICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcnkgKHVsKSB7XG4gICAgICBsZXQgbGkgPSB1bC5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChsaSkge1xuICAgICAgICBpZiAoY291bnQgPj0gbGltaXQpIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWZpbHRlcicpO1xuICAgICAgICAgIGlmIChsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcbiAgICAgICAgICAgICAgaGlnaGxpZ2h0KGxpLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpID0gbGkubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWZlcnJlZEZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRTaG93IChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUiB8fCB3aGljaCA9PT0gS0VZX1RBQikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KHNob3csIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQgKGUpIHtcbiAgICBsZXQgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgaWYgKHRhcmdldCA9PT0gYXR0YWNobWVudCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lciB8fCB0YXJnZXQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25CbHVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25DbGljayAoZSkge1xuICAgIGlmIChhdXRvY29tcGxldGVFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbnB1dEV2ZW50cyAocmVtb3ZlKSB7XG4gICAgY29uc3Qgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGlmIChleWUpIHtcbiAgICAgIGV5ZS5kZXN0cm95KCk7XG4gICAgICBleWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoIXJlbW92ZSkge1xuICAgICAgZXllID0gYnVsbHNleWUoY29udGFpbmVyLCBhdHRhY2htZW50LCB7XG4gICAgICAgIGNhcmV0OiBhbnlJbnB1dCAmJiBhdHRhY2htZW50LnRhZ05hbWUgIT09ICdJTlBVVCcsXG4gICAgICAgIGNvbnRleHQ6IG8uYXBwZW5kVG9cbiAgICAgIH0pO1xuICAgICAgaWYgKCF2aXNpYmxlKCkpIHsgZXllLnNsZWVwKCk7IH1cbiAgICB9XG4gICAgaWYgKHJlbW92ZSB8fCAoYW55SW5wdXQgJiYgZG9jLmFjdGl2ZUVsZW1lbnQgIT09IGF0dGFjaG1lbnQpKSB7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdmb2N1cycsIGxvYWRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkaW5nKCk7XG4gICAgfVxuICAgIGlmIChhbnlJbnB1dCkge1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZFNob3cpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZEZpbHRlcmluZyk7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywgZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ3Bhc3RlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIGRlZmVycmVkU2hvdyhldik7XG4gICAgICAgIGRlZmVycmVkRmlsdGVyaW5nKGV2KTtcbiAgICAgIH0pO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGtleWRvd24pO1xuICAgICAgaWYgKG8uYXV0b0hpZGVPbkJsdXIpIHsgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGhpZGVPbkJsdXIpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2NsaWNrJywgdG9nZ2xlcik7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGRvY0VsZW1lbnQsICdrZXlkb3duJywga2V5ZG93bik7XG4gICAgfVxuICAgIGlmIChvLmF1dG9IaWRlT25DbGljaykgeyBjcm9zc3ZlbnRbb3BdKGRvYywgJ2NsaWNrJywgaGlkZU9uQ2xpY2spOyB9XG4gICAgaWYgKGZvcm0pIHsgY3Jvc3N2ZW50W29wXShmb3JtLCAnc3VibWl0JywgaGlkZSk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGlmIChwYXJlbnQuY29udGFpbnMoY29udGFpbmVyKSkgeyBwYXJlbnQucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFNldHRlciAodmFsdWUpIHtcbiAgICBpZiAodGV4dElucHV0KSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyA9PT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnZhbHVlID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XG4gICAgICAgIGVsLmlubmVySFRNTCArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRJdGVtUmVuZGVyZXIgKGxpLCBzdWdnZXN0aW9uKSB7XG4gICAgdGV4dChsaSwgZ2V0VGV4dChzdWdnZXN0aW9uKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlciAoZGl2LCBkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgIT09ICdkZWZhdWx0Jykge1xuICAgICAgY29uc3QgaWQgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcnktaWQnKTtcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChpZCk7XG4gICAgICB0ZXh0KGlkLCBkYXRhLmlkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0RmlsdGVyIChxLCBzdWdnZXN0aW9uKSB7XG4gICAgY29uc3QgbmVlZGxlID0gcS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHRleHQgPSBnZXRUZXh0KHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmIChmdXp6eXNlYXJjaChuZWVkbGUsIHRleHQudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmdXp6eXNlYXJjaChuZWVkbGUsIHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9vcGJhY2tUb0FuY2hvciAodGV4dCwgcCkge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBsZXQgYW5jaG9yZWQgPSBmYWxzZTtcbiAgICBsZXQgc3RhcnQgPSBwLnN0YXJ0O1xuICAgIHdoaWxlIChhbmNob3JlZCA9PT0gZmFsc2UgJiYgc3RhcnQgPj0gMCkge1xuICAgICAgcmVzdWx0ID0gdGV4dC5zdWJzdHIoc3RhcnQgLSAxLCBwLnN0YXJ0IC0gc3RhcnQgKyAxKTtcbiAgICAgIGFuY2hvcmVkID0gcmFuY2hvcmxlZnQudGVzdChyZXN1bHQpO1xuICAgICAgc3RhcnQtLTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQ6IGFuY2hvcmVkID8gcmVzdWx0IDogbnVsbCxcbiAgICAgIHN0YXJ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkVGV4dCAocSwgc3VnZ2VzdGlvbikge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gc2VsbChlbCk7XG4gICAgY29uc3QgaW5wdXQgPSBsb29wYmFja1RvQW5jaG9yKHEsIHBvc2l0aW9uKS50ZXh0O1xuICAgIGlmIChpbnB1dCkge1xuICAgICAgcmV0dXJuIHsgaW5wdXQsIHN1Z2dlc3Rpb24gfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRUZXh0ICh2YWx1ZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBlbC52YWx1ZTtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHNlbGwoZWwpO1xuICAgIGNvbnN0IGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihjdXJyZW50LCBwb3NpdGlvbik7XG4gICAgY29uc3QgbGVmdCA9IGN1cnJlbnQuc3Vic3RyKDAsIGlucHV0LnN0YXJ0KTtcbiAgICBjb25zdCByaWdodCA9IGN1cnJlbnQuc3Vic3RyKGlucHV0LnN0YXJ0ICsgaW5wdXQudGV4dC5sZW5ndGggKyAocG9zaXRpb24uZW5kIC0gcG9zaXRpb24uc3RhcnQpKTtcbiAgICBjb25zdCBiZWZvcmUgPSBsZWZ0ICsgdmFsdWUgKyAnICc7XG5cbiAgICBlbC52YWx1ZSA9IGJlZm9yZSArIHJpZ2h0O1xuICAgIHNlbGwoZWwsIHsgc3RhcnQ6IGJlZm9yZS5sZW5ndGgsIGVuZDogYmVmb3JlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkSFRNTCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEhUTUwgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW5jaG9yaW5nIGluIGVkaXRhYmxlIGVsZW1lbnRzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQuJyk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kTGlzdCAoY2F0ZWdvcnkpIHsgcmV0dXJuIHNla3RvcignLnNleS1saXN0JywgY2F0ZWdvcnkpWzBdOyB9XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQgKGVsKSB7IHJldHVybiBlbC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQSc7IH1cblxuZnVuY3Rpb24gdGFnICh0eXBlLCBjbGFzc05hbWUpIHtcbiAgY29uc3QgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGRlZmVyIChmbikgeyByZXR1cm4gZnVuY3Rpb24gKCkgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTsgfVxuZnVuY3Rpb24gdGV4dCAoZWwsIHZhbHVlKSB7IGVsLmlubmVyVGV4dCA9IGVsLnRleHRDb250ZW50ID0gdmFsdWU7IH1cblxuZnVuY3Rpb24gaXNFZGl0YWJsZSAoZWwpIHtcbiAgY29uc3QgdmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnRFZGl0YWJsZScpO1xuICBpZiAodmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHZhbHVlID09PSAndHJ1ZScpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoZWwucGFyZW50RWxlbWVudCkge1xuICAgIHJldHVybiBpc0VkaXRhYmxlKGVsLnBhcmVudEVsZW1lbnQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob3JzZXk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF0b2EgKGEsIG4pIHsgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGEsIG4pOyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciB0YWlsb3JtYWRlID0gcmVxdWlyZSgnLi90YWlsb3JtYWRlJyk7XG5cbmZ1bmN0aW9uIGJ1bGxzZXllIChlbCwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucztcbiAgdmFyIGRvbVRhcmdldCA9IHRhcmdldCAmJiB0YXJnZXQudGFnTmFtZTtcblxuICBpZiAoIWRvbVRhcmdldCAmJiBhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgbyA9IHRhcmdldDtcbiAgfVxuICBpZiAoIWRvbVRhcmdldCkge1xuICAgIHRhcmdldCA9IGVsO1xuICB9XG4gIGlmICghbykgeyBvID0ge307IH1cblxuICB2YXIgZGVzdHJveWVkID0gZmFsc2U7XG4gIHZhciB0aHJvdHRsZWRXcml0ZSA9IHRocm90dGxlKHdyaXRlLCAzMCk7XG4gIHZhciB0YWlsb3JPcHRpb25zID0geyB1cGRhdGU6IG8uYXV0b3VwZGF0ZVRvQ2FyZXQgIT09IGZhbHNlICYmIHVwZGF0ZSB9O1xuICB2YXIgdGFpbG9yID0gby5jYXJldCAmJiB0YWlsb3JtYWRlKHRhcmdldCwgdGFpbG9yT3B0aW9ucyk7XG5cbiAgd3JpdGUoKTtcblxuICBpZiAoby50cmFja2luZyAhPT0gZmFsc2UpIHtcbiAgICBjcm9zc3ZlbnQuYWRkKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVhZDogcmVhZE51bGwsXG4gICAgcmVmcmVzaDogd3JpdGUsXG4gICAgZGVzdHJveTogZGVzdHJveSxcbiAgICBzbGVlcDogc2xlZXBcbiAgfTtcblxuICBmdW5jdGlvbiBzbGVlcCAoKSB7XG4gICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkTnVsbCAoKSB7IHJldHVybiByZWFkKCk7IH1cblxuICBmdW5jdGlvbiByZWFkIChyZWFkaW5ncykge1xuICAgIHZhciBib3VuZHMgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgaWYgKHRhaWxvcikge1xuICAgICAgcmVhZGluZ3MgPSB0YWlsb3IucmVhZCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogKHJlYWRpbmdzLmFic29sdXRlID8gMCA6IGJvdW5kcy5sZWZ0KSArIHJlYWRpbmdzLngsXG4gICAgICAgIHk6IChyZWFkaW5ncy5hYnNvbHV0ZSA/IDAgOiBib3VuZHMudG9wKSArIHNjcm9sbFRvcCArIHJlYWRpbmdzLnkgKyAyMFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGJvdW5kcy5sZWZ0LFxuICAgICAgeTogYm91bmRzLnRvcCArIHNjcm9sbFRvcFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUgKHJlYWRpbmdzKSB7XG4gICAgd3JpdGUocmVhZGluZ3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKHJlYWRpbmdzKSB7XG4gICAgaWYgKGRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWxsc2V5ZSBjYW5cXCd0IHJlZnJlc2ggYWZ0ZXIgYmVpbmcgZGVzdHJveWVkLiBDcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICBpZiAodGFpbG9yICYmICFyZWFkaW5ncykge1xuICAgICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgdGFpbG9yLnJlZnJlc2goKTsgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcCA9IHJlYWQocmVhZGluZ3MpO1xuICAgIGlmICghdGFpbG9yICYmIHRhcmdldCAhPT0gZWwpIHtcbiAgICAgIHAueSArPSB0YXJnZXQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IG8uY29udGV4dDtcbiAgICBlbC5zdHlsZS5sZWZ0ID0gcC54ICsgJ3B4JztcbiAgICBlbC5zdHlsZS50b3AgPSAoY29udGV4dCA/IGNvbnRleHQub2Zmc2V0SGVpZ2h0IDogcC55KSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBpZiAodGFpbG9yKSB7IHRhaWxvci5kZXN0cm95KCk7IH1cbiAgICBjcm9zc3ZlbnQucmVtb3ZlKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYnVsbHNleWU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZWxsID0gcmVxdWlyZSgnc2VsbCcpO1xudmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpO1xudmFyIHNlbGVjY2lvbiA9IHJlcXVpcmUoJ3NlbGVjY2lvbicpO1xudmFyIHRocm90dGxlID0gcmVxdWlyZSgnLi90aHJvdHRsZScpO1xudmFyIGdldFNlbGVjdGlvbiA9IHNlbGVjY2lvbi5nZXQ7XG52YXIgcHJvcHMgPSBbXG4gICdkaXJlY3Rpb24nLFxuICAnYm94U2l6aW5nJyxcbiAgJ3dpZHRoJyxcbiAgJ2hlaWdodCcsXG4gICdvdmVyZmxvd1gnLFxuICAnb3ZlcmZsb3dZJyxcbiAgJ2JvcmRlclRvcFdpZHRoJyxcbiAgJ2JvcmRlclJpZ2h0V2lkdGgnLFxuICAnYm9yZGVyQm90dG9tV2lkdGgnLFxuICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgJ3BhZGRpbmdUb3AnLFxuICAncGFkZGluZ1JpZ2h0JyxcbiAgJ3BhZGRpbmdCb3R0b20nLFxuICAncGFkZGluZ0xlZnQnLFxuICAnZm9udFN0eWxlJyxcbiAgJ2ZvbnRWYXJpYW50JyxcbiAgJ2ZvbnRXZWlnaHQnLFxuICAnZm9udFN0cmV0Y2gnLFxuICAnZm9udFNpemUnLFxuICAnZm9udFNpemVBZGp1c3QnLFxuICAnbGluZUhlaWdodCcsXG4gICdmb250RmFtaWx5JyxcbiAgJ3RleHRBbGlnbicsXG4gICd0ZXh0VHJhbnNmb3JtJyxcbiAgJ3RleHRJbmRlbnQnLFxuICAndGV4dERlY29yYXRpb24nLFxuICAnbGV0dGVyU3BhY2luZycsXG4gICd3b3JkU3BhY2luZydcbl07XG52YXIgd2luID0gZ2xvYmFsO1xudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGZmID0gd2luLm1veklubmVyU2NyZWVuWCAhPT0gbnVsbCAmJiB3aW4ubW96SW5uZXJTY3JlZW5YICE9PSB2b2lkIDA7XG5cbmZ1bmN0aW9uIHRhaWxvcm1hZGUgKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0ZXh0SW5wdXQgPSBlbC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQSc7XG4gIHZhciB0aHJvdHRsZWRSZWZyZXNoID0gdGhyb3R0bGUocmVmcmVzaCwgMzApO1xuICB2YXIgbyA9IG9wdGlvbnMgfHwge307XG5cbiAgYmluZCgpO1xuXG4gIHJldHVybiB7XG4gICAgcmVhZDogcmVhZFBvc2l0aW9uLFxuICAgIHJlZnJlc2g6IHRocm90dGxlZFJlZnJlc2gsXG4gICAgZGVzdHJveTogZGVzdHJveVxuICB9O1xuXG4gIGZ1bmN0aW9uIG5vb3AgKCkge31cbiAgZnVuY3Rpb24gcmVhZFBvc2l0aW9uICgpIHsgcmV0dXJuICh0ZXh0SW5wdXQgPyBjb29yZHNUZXh0IDogY29vcmRzSFRNTCkoKTsgfVxuXG4gIGZ1bmN0aW9uIHJlZnJlc2ggKCkge1xuICAgIGlmIChvLnNsZWVwaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiAoby51cGRhdGUgfHwgbm9vcCkocmVhZFBvc2l0aW9uKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29vcmRzVGV4dCAoKSB7XG4gICAgdmFyIHAgPSBzZWxsKGVsKTtcbiAgICB2YXIgY29udGV4dCA9IHByZXBhcmUoKTtcbiAgICB2YXIgcmVhZGluZ3MgPSByZWFkVGV4dENvb3Jkcyhjb250ZXh0LCBwLnN0YXJ0KTtcbiAgICBkb2MuYm9keS5yZW1vdmVDaGlsZChjb250ZXh0Lm1pcnJvcik7XG4gICAgcmV0dXJuIHJlYWRpbmdzO1xuICB9XG5cbiAgZnVuY3Rpb24gY29vcmRzSFRNTCAoKSB7XG4gICAgdmFyIHNlbCA9IGdldFNlbGVjdGlvbigpO1xuICAgIGlmIChzZWwucmFuZ2VDb3VudCkge1xuICAgICAgdmFyIHJhbmdlID0gc2VsLmdldFJhbmdlQXQoMCk7XG4gICAgICB2YXIgbmVlZHNUb1dvcmtBcm91bmROZXdsaW5lQnVnID0gcmFuZ2Uuc3RhcnRDb250YWluZXIubm9kZU5hbWUgPT09ICdQJyAmJiByYW5nZS5zdGFydE9mZnNldCA9PT0gMDtcbiAgICAgIGlmIChuZWVkc1RvV29ya0Fyb3VuZE5ld2xpbmVCdWcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiByYW5nZS5zdGFydENvbnRhaW5lci5vZmZzZXRMZWZ0LFxuICAgICAgICAgIHk6IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm9mZnNldFRvcCxcbiAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKHJhbmdlLmdldENsaWVudFJlY3RzKSB7XG4gICAgICAgIHZhciByZWN0cyA9IHJhbmdlLmdldENsaWVudFJlY3RzKCk7XG4gICAgICAgIGlmIChyZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJlY3RzWzBdLmxlZnQsXG4gICAgICAgICAgICB5OiByZWN0c1swXS50b3AsXG4gICAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgeDogMCwgeTogMCB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRleHRDb29yZHMgKGNvbnRleHQsIHApIHtcbiAgICB2YXIgcmVzdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIG1pcnJvciA9IGNvbnRleHQubWlycm9yO1xuICAgIHZhciBjb21wdXRlZCA9IGNvbnRleHQuY29tcHV0ZWQ7XG5cbiAgICB3cml0ZShtaXJyb3IsIHJlYWQoZWwpLnN1YnN0cmluZygwLCBwKSk7XG5cbiAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgbWlycm9yLnRleHRDb250ZW50ID0gbWlycm9yLnRleHRDb250ZW50LnJlcGxhY2UoL1xccy9nLCAnXFx1MDBhMCcpO1xuICAgIH1cblxuICAgIHdyaXRlKHJlc3QsIHJlYWQoZWwpLnN1YnN0cmluZyhwKSB8fCAnLicpO1xuXG4gICAgbWlycm9yLmFwcGVuZENoaWxkKHJlc3QpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHJlc3Qub2Zmc2V0TGVmdCArIHBhcnNlSW50KGNvbXB1dGVkWydib3JkZXJMZWZ0V2lkdGgnXSksXG4gICAgICB5OiByZXN0Lm9mZnNldFRvcCArIHBhcnNlSW50KGNvbXB1dGVkWydib3JkZXJUb3BXaWR0aCddKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChlbCkge1xuICAgIHJldHVybiB0ZXh0SW5wdXQgPyBlbC52YWx1ZSA6IGVsLmlubmVySFRNTDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXBhcmUgKCkge1xuICAgIHZhciBjb21wdXRlZCA9IHdpbi5nZXRDb21wdXRlZFN0eWxlID8gZ2V0Q29tcHV0ZWRTdHlsZShlbCkgOiBlbC5jdXJyZW50U3R5bGU7XG4gICAgdmFyIG1pcnJvciA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc3R5bGUgPSBtaXJyb3Iuc3R5bGU7XG5cbiAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChtaXJyb3IpO1xuXG4gICAgaWYgKGVsLnRhZ05hbWUgIT09ICdJTlBVVCcpIHtcbiAgICAgIHN0eWxlLndvcmRXcmFwID0gJ2JyZWFrLXdvcmQnO1xuICAgIH1cbiAgICBzdHlsZS53aGl0ZVNwYWNlID0gJ3ByZS13cmFwJztcbiAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIHByb3BzLmZvckVhY2goY29weSk7XG5cbiAgICBpZiAoZmYpIHtcbiAgICAgIHN0eWxlLndpZHRoID0gcGFyc2VJbnQoY29tcHV0ZWQud2lkdGgpIC0gMiArICdweCc7XG4gICAgICBpZiAoZWwuc2Nyb2xsSGVpZ2h0ID4gcGFyc2VJbnQoY29tcHV0ZWQuaGVpZ2h0KSkge1xuICAgICAgICBzdHlsZS5vdmVyZmxvd1kgPSAnc2Nyb2xsJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICB9XG4gICAgcmV0dXJuIHsgbWlycm9yOiBtaXJyb3IsIGNvbXB1dGVkOiBjb21wdXRlZCB9O1xuXG4gICAgZnVuY3Rpb24gY29weSAocHJvcCkge1xuICAgICAgc3R5bGVbcHJvcF0gPSBjb21wdXRlZFtwcm9wXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZSAoZWwsIHZhbHVlKSB7XG4gICAgaWYgKHRleHRJbnB1dCkge1xuICAgICAgZWwudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYmluZCAocmVtb3ZlKSB7XG4gICAgdmFyIG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAna2V5ZG93bicsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdrZXl1cCcsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdpbnB1dCcsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdwYXN0ZScsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdjaGFuZ2UnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGJpbmQodHJ1ZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0YWlsb3JtYWRlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiB0aHJvdHRsZSAoZm4sIGJvdW5kYXJ5KSB7XG4gIHZhciBsYXN0ID0gLUluZmluaXR5O1xuICB2YXIgdGltZXI7XG4gIHJldHVybiBmdW5jdGlvbiBib3VuY2VkICgpIHtcbiAgICBpZiAodGltZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5ib3VuZCgpO1xuXG4gICAgZnVuY3Rpb24gdW5ib3VuZCAoKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgdmFyIG5leHQgPSBsYXN0ICsgYm91bmRhcnk7XG4gICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGlmIChub3cgPiBuZXh0KSB7XG4gICAgICAgIGxhc3QgPSBub3c7XG4gICAgICAgIGZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQodW5ib3VuZCwgbmV4dCAtIG5vdyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGlja3kgPSByZXF1aXJlKCd0aWNreScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlIChmbiwgYXJncywgY3R4KSB7XG4gIGlmICghZm4pIHsgcmV0dXJuOyB9XG4gIHRpY2t5KGZ1bmN0aW9uIHJ1biAoKSB7XG4gICAgZm4uYXBwbHkoY3R4IHx8IG51bGwsIGFyZ3MgfHwgW10pO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhdG9hID0gcmVxdWlyZSgnYXRvYScpO1xudmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVtaXR0ZXIgKHRoaW5nLCBvcHRpb25zKSB7XG4gIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGV2dCA9IHt9O1xuICBpZiAodGhpbmcgPT09IHVuZGVmaW5lZCkgeyB0aGluZyA9IHt9OyB9XG4gIHRoaW5nLm9uID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgaWYgKCFldnRbdHlwZV0pIHtcbiAgICAgIGV2dFt0eXBlXSA9IFtmbl07XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2dFt0eXBlXS5wdXNoKGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vbmNlID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgZm4uX29uY2UgPSB0cnVlOyAvLyB0aGluZy5vZmYoZm4pIHN0aWxsIHdvcmtzIVxuICAgIHRoaW5nLm9uKHR5cGUsIGZuKTtcbiAgICByZXR1cm4gdGhpbmc7XG4gIH07XG4gIHRoaW5nLm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAoYyA9PT0gMSkge1xuICAgICAgZGVsZXRlIGV2dFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKGMgPT09IDApIHtcbiAgICAgIGV2dCA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZXQgPSBldnRbdHlwZV07XG4gICAgICBpZiAoIWV0KSB7IHJldHVybiB0aGluZzsgfVxuICAgICAgZXQuc3BsaWNlKGV0LmluZGV4T2YoZm4pLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5lbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgIHJldHVybiB0aGluZy5lbWl0dGVyU25hcHNob3QoYXJncy5zaGlmdCgpKS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbiAgdGhpbmcuZW1pdHRlclNuYXBzaG90ID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB2YXIgZXQgPSAoZXZ0W3R5cGVdIHx8IFtdKS5zbGljZSgwKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgICB2YXIgY3R4ID0gdGhpcyB8fCB0aGluZztcbiAgICAgIGlmICh0eXBlID09PSAnZXJyb3InICYmIG9wdHMudGhyb3dzICE9PSBmYWxzZSAmJiAhZXQubGVuZ3RoKSB7IHRocm93IGFyZ3MubGVuZ3RoID09PSAxID8gYXJnc1swXSA6IGFyZ3M7IH1cbiAgICAgIGV0LmZvckVhY2goZnVuY3Rpb24gZW1pdHRlciAobGlzdGVuKSB7XG4gICAgICAgIGlmIChvcHRzLmFzeW5jKSB7IGRlYm91bmNlKGxpc3RlbiwgYXJncywgY3R4KTsgfSBlbHNlIHsgbGlzdGVuLmFwcGx5KGN0eCwgYXJncyk7IH1cbiAgICAgICAgaWYgKGxpc3Rlbi5fb25jZSkgeyB0aGluZy5vZmYodHlwZSwgbGlzdGVuKTsgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpbmc7XG4gICAgfTtcbiAgfTtcbiAgcmV0dXJuIHRoaW5nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGN1c3RvbUV2ZW50ID0gcmVxdWlyZSgnY3VzdG9tLWV2ZW50Jyk7XG52YXIgZXZlbnRtYXAgPSByZXF1aXJlKCcuL2V2ZW50bWFwJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGxpc3RlbmVyID0gdW53cmFwKGVsLCB0eXBlLCBmbik7XG4gIGlmIChsaXN0ZW5lcikge1xuICAgIHJldHVybiBlbC5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSwgbW9kZWwpIHtcbiAgdmFyIGUgPSBldmVudG1hcC5pbmRleE9mKHR5cGUpID09PSAtMSA/IG1ha2VDdXN0b21FdmVudCgpIDogbWFrZUNsYXNzaWNFdmVudCgpO1xuICBpZiAoZWwuZGlzcGF0Y2hFdmVudCkge1xuICAgIGVsLmRpc3BhdGNoRXZlbnQoZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxuICBmdW5jdGlvbiBtYWtlQ2xhc3NpY0V2ZW50ICgpIHtcbiAgICB2YXIgZTtcbiAgICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIGU7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUN1c3RvbUV2ZW50ICgpIHtcbiAgICByZXR1cm4gbmV3IGN1c3RvbUV2ZW50KHR5cGUsIHsgZGV0YWlsOiBtb2RlbCB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ID0gZS5wcmV2ZW50RGVmYXVsdCB8fCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7IGUuY2FuY2VsQnViYmxlID0gdHJ1ZTsgfTtcbiAgICBlLndoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV2ZW50bWFwID0gW107XG52YXIgZXZlbnRuYW1lID0gJyc7XG52YXIgcm9uID0gL15vbi87XG5cbmZvciAoZXZlbnRuYW1lIGluIGdsb2JhbCkge1xuICBpZiAocm9uLnRlc3QoZXZlbnRuYW1lKSkge1xuICAgIGV2ZW50bWFwLnB1c2goZXZlbnRuYW1lLnNsaWNlKDIpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50bWFwO1xuIiwiXG52YXIgTmF0aXZlQ3VzdG9tRXZlbnQgPSBnbG9iYWwuQ3VzdG9tRXZlbnQ7XG5cbmZ1bmN0aW9uIHVzZU5hdGl2ZSAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHAgPSBuZXcgTmF0aXZlQ3VzdG9tRXZlbnQoJ2NhdCcsIHsgZGV0YWlsOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICByZXR1cm4gICdjYXQnID09PSBwLnR5cGUgJiYgJ2JhcicgPT09IHAuZGV0YWlsLmZvbztcbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcm9zcy1icm93c2VyIGBDdXN0b21FdmVudGAgY29uc3RydWN0b3IuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50LkN1c3RvbUV2ZW50XG4gKlxuICogQHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdXNlTmF0aXZlKCkgPyBOYXRpdmVDdXN0b21FdmVudCA6XG5cbi8vIElFID49IDlcbid1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQgJiYgJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID8gZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgfSBlbHNlIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIHZvaWQgMCk7XG4gIH1cbiAgcmV0dXJuIGU7XG59IDpcblxuLy8gSUUgPD0gOFxuZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gIGUudHlwZSA9IHR5cGU7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmJ1YmJsZXMgPSBCb29sZWFuKHBhcmFtcy5idWJibGVzKTtcbiAgICBlLmNhbmNlbGFibGUgPSBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKTtcbiAgICBlLmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gIH0gZWxzZSB7XG4gICAgZS5idWJibGVzID0gZmFsc2U7XG4gICAgZS5jYW5jZWxhYmxlID0gZmFsc2U7XG4gICAgZS5kZXRhaWwgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGZ1enp5c2VhcmNoIChuZWVkbGUsIGhheXN0YWNrKSB7XG4gIHZhciB0bGVuID0gaGF5c3RhY2subGVuZ3RoO1xuICB2YXIgcWxlbiA9IG5lZWRsZS5sZW5ndGg7XG4gIGlmIChxbGVuID4gdGxlbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocWxlbiA9PT0gdGxlbikge1xuICAgIHJldHVybiBuZWVkbGUgPT09IGhheXN0YWNrO1xuICB9XG4gIG91dGVyOiBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBxbGVuOyBpKyspIHtcbiAgICB2YXIgbmNoID0gbmVlZGxlLmNoYXJDb2RlQXQoaSk7XG4gICAgd2hpbGUgKGogPCB0bGVuKSB7XG4gICAgICBpZiAoaGF5c3RhY2suY2hhckNvZGVBdChqKyspID09PSBuY2gpIHtcbiAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdXp6eXNlYXJjaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcGFkIChoYXNoLCBsZW4pIHtcbiAgd2hpbGUgKGhhc2gubGVuZ3RoIDwgbGVuKSB7XG4gICAgaGFzaCA9ICcwJyArIGhhc2g7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvbGQgKGhhc2gsIHRleHQpIHtcbiAgdmFyIGk7XG4gIHZhciBjaHI7XG4gIHZhciBsZW47XG4gIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBoYXNoO1xuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRleHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjaHIgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hyO1xuICAgIGhhc2ggfD0gMDtcbiAgfVxuICByZXR1cm4gaGFzaCA8IDAgPyBoYXNoICogLTIgOiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb2xkT2JqZWN0IChoYXNoLCBvLCBzZWVuKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvKS5zb3J0KCkucmVkdWNlKGZvbGRLZXksIGhhc2gpO1xuICBmdW5jdGlvbiBmb2xkS2V5IChoYXNoLCBrZXkpIHtcbiAgICByZXR1cm4gZm9sZFZhbHVlKGhhc2gsIG9ba2V5XSwga2V5LCBzZWVuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb2xkVmFsdWUgKGlucHV0LCB2YWx1ZSwga2V5LCBzZWVuKSB7XG4gIHZhciBoYXNoID0gZm9sZChmb2xkKGZvbGQoaW5wdXQsIGtleSksIHRvU3RyaW5nKHZhbHVlKSksIHR5cGVvZiB2YWx1ZSk7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmb2xkKGhhc2gsICdudWxsJyk7XG4gIH1cbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm9sZChoYXNoLCAndW5kZWZpbmVkJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZSkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gZm9sZChoYXNoLCAnW0NpcmN1bGFyXScgKyBrZXkpO1xuICAgIH1cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuXG4gICAgdmFyIG9iakhhc2ggPSBmb2xkT2JqZWN0KGhhc2gsIHZhbHVlLCBzZWVuKVxuXG4gICAgaWYgKCEoJ3ZhbHVlT2YnIGluIHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUudmFsdWVPZiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG9iakhhc2g7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmb2xkKG9iakhhc2gsIFN0cmluZyh2YWx1ZS52YWx1ZU9mKCkpKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZvbGQob2JqSGFzaCwgJ1t2YWx1ZU9mIGV4Y2VwdGlvbl0nICsgKGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSkpXG4gICAgfVxuICB9XG4gIHJldHVybiBmb2xkKGhhc2gsIHZhbHVlLnRvU3RyaW5nKCkpO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZyAobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBzdW0gKG8pIHtcbiAgcmV0dXJuIHBhZChmb2xkVmFsdWUoMCwgbywgJycsIFtdKS50b1N0cmluZygxNiksIDgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1bTtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBTeW1ib2wgPSByb290LlN5bWJvbDtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2w7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyksXG4gICAgZ2V0UmF3VGFnID0gcmVxdWlyZSgnLi9fZ2V0UmF3VGFnJyksXG4gICAgb2JqZWN0VG9TdHJpbmcgPSByZXF1aXJlKCcuL19vYmplY3RUb1N0cmluZycpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgbnVsbFRhZyA9ICdbb2JqZWN0IE51bGxdJyxcbiAgICB1bmRlZmluZWRUYWcgPSAnW29iamVjdCBVbmRlZmluZWRdJztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldFRhZ2Agd2l0aG91dCBmYWxsYmFja3MgZm9yIGJ1Z2d5IGVudmlyb25tZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0VGFnKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWRUYWcgOiBudWxsVGFnO1xuICB9XG4gIHJldHVybiAoc3ltVG9TdHJpbmdUYWcgJiYgc3ltVG9TdHJpbmdUYWcgaW4gT2JqZWN0KHZhbHVlKSlcbiAgICA/IGdldFJhd1RhZyh2YWx1ZSlcbiAgICA6IG9iamVjdFRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0VGFnO1xuIiwiLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmcmVlR2xvYmFsO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgbmF0aXZlT2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlR2V0VGFnYCB3aGljaCBpZ25vcmVzIGBTeW1ib2wudG9TdHJpbmdUYWdgIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSByYXcgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gZ2V0UmF3VGFnKHZhbHVlKSB7XG4gIHZhciBpc093biA9IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHN5bVRvU3RyaW5nVGFnKSxcbiAgICAgIHRhZyA9IHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcblxuICB0cnkge1xuICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgdW5tYXNrZWQgPSB0cnVlO1xuICB9IGNhdGNoIChlKSB7fVxuXG4gIHZhciByZXN1bHQgPSBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgaWYgKHVubWFza2VkKSB7XG4gICAgaWYgKGlzT3duKSB7XG4gICAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB0YWc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0UmF3VGFnO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyB1c2luZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VG9TdHJpbmc7XG4iLCJ2YXIgZnJlZUdsb2JhbCA9IHJlcXVpcmUoJy4vX2ZyZWVHbG9iYWwnKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJvb3Q7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgbm93ID0gcmVxdWlyZSgnLi9ub3cnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZVxuICogbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZFxuICogd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbi4gU3Vic2VxdWVudFxuICogY2FsbHMgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2BcbiAqIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHRpbWVXYWl0aW5nID0gd2FpdCAtIHRpbWVTaW5jZUxhc3RDYWxsO1xuXG4gICAgcmV0dXJuIG1heGluZ1xuICAgICAgPyBuYXRpdmVNaW4odGltZVdhaXRpbmcsIG1heFdhaXQgLSB0aW1lU2luY2VMYXN0SW52b2tlKVxuICAgICAgOiB0aW1lV2FpdGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3VsZEludm9rZSh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZTtcblxuICAgIC8vIEVpdGhlciB0aGlzIGlzIHRoZSBmaXJzdCBjYWxsLCBhY3Rpdml0eSBoYXMgc3RvcHBlZCBhbmQgd2UncmUgYXQgdGhlXG4gICAgLy8gdHJhaWxpbmcgZWRnZSwgdGhlIHN5c3RlbSB0aW1lIGhhcyBnb25lIGJhY2t3YXJkcyBhbmQgd2UncmUgdHJlYXRpbmdcbiAgICAvLyBpdCBhcyB0aGUgdHJhaWxpbmcgZWRnZSwgb3Igd2UndmUgaGl0IHRoZSBgbWF4V2FpdGAgbGltaXQuXG4gICAgcmV0dXJuIChsYXN0Q2FsbFRpbWUgPT09IHVuZGVmaW5lZCB8fCAodGltZVNpbmNlTGFzdENhbGwgPj0gd2FpdCkgfHxcbiAgICAgICh0aW1lU2luY2VMYXN0Q2FsbCA8IDApIHx8IChtYXhpbmcgJiYgdGltZVNpbmNlTGFzdEludm9rZSA+PSBtYXhXYWl0KSk7XG4gIH1cblxuICBmdW5jdGlvbiB0aW1lckV4cGlyZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKTtcbiAgICBpZiAoc2hvdWxkSW52b2tlKHRpbWUpKSB7XG4gICAgICByZXR1cm4gdHJhaWxpbmdFZGdlKHRpbWUpO1xuICAgIH1cbiAgICAvLyBSZXN0YXJ0IHRoZSB0aW1lci5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHJlbWFpbmluZ1dhaXQodGltZSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhaWxpbmdFZGdlKHRpbWUpIHtcbiAgICB0aW1lcklkID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gT25seSBpbnZva2UgaWYgd2UgaGF2ZSBgbGFzdEFyZ3NgIHdoaWNoIG1lYW5zIGBmdW5jYCBoYXMgYmVlblxuICAgIC8vIGRlYm91bmNlZCBhdCBsZWFzdCBvbmNlLlxuICAgIGlmICh0cmFpbGluZyAmJiBsYXN0QXJncykge1xuICAgICAgcmV0dXJuIGludm9rZUZ1bmModGltZSk7XG4gICAgfVxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICBpZiAodGltZXJJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgfVxuICAgIGxhc3RJbnZva2VUaW1lID0gMDtcbiAgICBsYXN0QXJncyA9IGxhc3RDYWxsVGltZSA9IGxhc3RUaGlzID0gdGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHJldHVybiB0aW1lcklkID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiB0cmFpbGluZ0VkZ2Uobm93KCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCksXG4gICAgICAgIGlzSW52b2tpbmcgPSBzaG91bGRJbnZva2UodGltZSk7XG5cbiAgICBsYXN0QXJncyA9IGFyZ3VtZW50cztcbiAgICBsYXN0VGhpcyA9IHRoaXM7XG4gICAgbGFzdENhbGxUaW1lID0gdGltZTtcblxuICAgIGlmIChpc0ludm9raW5nKSB7XG4gICAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBsZWFkaW5nRWRnZShsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgICAgaWYgKG1heGluZykge1xuICAgICAgICAvLyBIYW5kbGUgaW52b2NhdGlvbnMgaW4gYSB0aWdodCBsb29wLlxuICAgICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHN5bWJvbCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgYmFzZUdldFRhZyh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4cGFuZG8gPSAnc2VrdG9yLScgKyBEYXRlLm5vdygpO1xudmFyIHJzaWJsaW5ncyA9IC9bK35dLztcbnZhciBkb2N1bWVudCA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBkZWwgPSAoZG9jdW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB8fCB7fTtcbnZhciBtYXRjaCA9IChcbiAgZGVsLm1hdGNoZXMgfHxcbiAgZGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICBkZWwubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5vTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tc01hdGNoZXNTZWxlY3RvciB8fFxuICBuZXZlclxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWt0b3I7XG5cbnNla3Rvci5tYXRjaGVzID0gbWF0Y2hlcztcbnNla3Rvci5tYXRjaGVzU2VsZWN0b3IgPSBtYXRjaGVzU2VsZWN0b3I7XG5cbmZ1bmN0aW9uIHFzYSAoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyIGV4aXN0ZWQsIGlkLCBwcmVmaXgsIHByZWZpeGVkLCBhZGFwdGVyLCBoYWNrID0gY29udGV4dCAhPT0gZG9jdW1lbnQ7XG4gIGlmIChoYWNrKSB7IC8vIGlkIGhhY2sgZm9yIGNvbnRleHQtcm9vdGVkIHF1ZXJpZXNcbiAgICBleGlzdGVkID0gY29udGV4dC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgaWQgPSBleGlzdGVkIHx8IGV4cGFuZG87XG4gICAgcHJlZml4ID0gJyMnICsgaWQgKyAnICc7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXggKyBzZWxlY3Rvci5yZXBsYWNlKC8sL2csICcsJyArIHByZWZpeCk7XG4gICAgYWRhcHRlciA9IHJzaWJsaW5ncy50ZXN0KHNlbGVjdG9yKSAmJiBjb250ZXh0LnBhcmVudE5vZGU7XG4gICAgaWYgKCFleGlzdGVkKSB7IGNvbnRleHQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTsgfVxuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIChhZGFwdGVyIHx8IGNvbnRleHQpLnF1ZXJ5U2VsZWN0b3JBbGwocHJlZml4ZWQgfHwgc2VsZWN0b3IpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChleGlzdGVkID09PSBudWxsKSB7IGNvbnRleHQucmVtb3ZlQXR0cmlidXRlKCdpZCcpOyB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VrdG9yIChzZWxlY3RvciwgY3R4LCBjb2xsZWN0aW9uLCBzZWVkKSB7XG4gIHZhciBlbGVtZW50O1xuICB2YXIgY29udGV4dCA9IGN0eCB8fCBkb2N1bWVudDtcbiAgdmFyIHJlc3VsdHMgPSBjb2xsZWN0aW9uIHx8IFtdO1xuICB2YXIgaSA9IDA7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgaWYgKGNvbnRleHQubm9kZVR5cGUgIT09IDEgJiYgY29udGV4dC5ub2RlVHlwZSAhPT0gOSkge1xuICAgIHJldHVybiBbXTsgLy8gYmFpbCBpZiBjb250ZXh0IGlzIG5vdCBhbiBlbGVtZW50IG9yIGRvY3VtZW50XG4gIH1cbiAgaWYgKHNlZWQpIHtcbiAgICB3aGlsZSAoKGVsZW1lbnQgPSBzZWVkW2krK10pKSB7XG4gICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBxc2Eoc2VsZWN0b3IsIGNvbnRleHQpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuZnVuY3Rpb24gbWF0Y2hlcyAoc2VsZWN0b3IsIGVsZW1lbnRzKSB7XG4gIHJldHVybiBzZWt0b3Ioc2VsZWN0b3IsIG51bGwsIG51bGwsIGVsZW1lbnRzKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yIChlbGVtZW50LCBzZWxlY3Rvcikge1xuICByZXR1cm4gbWF0Y2guY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIG5ldmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb247XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGdldFNlbGVjdGlvblJhdyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uUmF3Jyk7XG52YXIgZ2V0U2VsZWN0aW9uTnVsbE9wID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25OdWxsT3AnKTtcbnZhciBnZXRTZWxlY3Rpb25TeW50aGV0aWMgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblN5bnRoZXRpYycpO1xudmFyIGlzSG9zdCA9IHJlcXVpcmUoJy4vaXNIb3N0Jyk7XG5pZiAoaXNIb3N0Lm1ldGhvZChnbG9iYWwsICdnZXRTZWxlY3Rpb24nKSkge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25SYXc7XG59IGVsc2UgaWYgKHR5cGVvZiBkb2Muc2VsZWN0aW9uID09PSAnb2JqZWN0JyAmJiBkb2Muc2VsZWN0aW9uKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblN5bnRoZXRpYztcbn0gZWxzZSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbk51bGxPcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uTnVsbE9wICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZW1vdmVBbGxSYW5nZXM6IG5vb3AsXG4gICAgYWRkUmFuZ2U6IG5vb3BcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb25OdWxsT3A7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvblJhdyAoKSB7XG4gIHJldHVybiBnbG9iYWwuZ2V0U2VsZWN0aW9uKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uUmF3O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG52YXIgR2V0U2VsZWN0aW9uUHJvdG8gPSBHZXRTZWxlY3Rpb24ucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBHZXRTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciByYW5nZSA9IHNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuXG4gIHRoaXMuX3NlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgdGhpcy5fcmFuZ2VzID0gW107XG5cbiAgaWYgKHNlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbGYpO1xuICB9IGVsc2UgaWYgKGlzVGV4dFJhbmdlKHJhbmdlKSkge1xuICAgIHVwZGF0ZUZyb21UZXh0UmFuZ2Uoc2VsZiwgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbGYpO1xuICB9XG59XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZUFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRleHRSYW5nZTtcbiAgdHJ5IHtcbiAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgIT09ICdOb25lJykge1xuICAgICAgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgIHRleHRSYW5nZS5zZWxlY3QoKTtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5lbXB0eSgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uYWRkUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZSk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShyYW5nZSkuc2VsZWN0KCk7XG4gICAgdGhpcy5fcmFuZ2VzWzBdID0gcmFuZ2U7XG4gICAgdGhpcy5yYW5nZUNvdW50ID0gMTtcbiAgICB0aGlzLmlzQ29sbGFwc2VkID0gdGhpcy5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZSh0aGlzLCByYW5nZSwgZmFsc2UpO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRSYW5nZXMgPSBmdW5jdGlvbiAocmFuZ2VzKSB7XG4gIHRoaXMucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHZhciByYW5nZUNvdW50ID0gcmFuZ2VzLmxlbmd0aDtcbiAgaWYgKHJhbmdlQ291bnQgPiAxKSB7XG4gICAgY3JlYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZXMpO1xuICB9IGVsc2UgaWYgKHJhbmdlQ291bnQpIHtcbiAgICB0aGlzLmFkZFJhbmdlKHJhbmdlc1swXSk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldFJhbmdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnJhbmdlQ291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFJhbmdlQXQoKTogaW5kZXggb3V0IG9mIGJvdW5kcycpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9yYW5nZXNbaW5kZXhdLmNsb25lUmFuZ2UoKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8ucmVtb3ZlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnQ29udHJvbCcpIHtcbiAgICByZW1vdmVSYW5nZU1hbnVhbGx5KHRoaXMsIHJhbmdlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHRoaXMuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgcmFuZ2VFbGVtZW50ID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZSk7XG4gIHZhciBuZXdDb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICB2YXIgZWw7XG4gIHZhciByZW1vdmVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGNvbnRyb2xSYW5nZS5pdGVtKGkpO1xuICAgIGlmIChlbCAhPT0gcmFuZ2VFbGVtZW50IHx8IHJlbW92ZWQpIHtcbiAgICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgbmV3Q29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZWFjaFJhbmdlID0gZnVuY3Rpb24gKGZuLCByZXR1cm5WYWx1ZSkge1xuICB2YXIgaSA9IDA7XG4gIHZhciBsZW4gPSB0aGlzLl9yYW5nZXMubGVuZ3RoO1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoZm4odGhpcy5nZXRSYW5nZUF0KGkpKSkge1xuICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZ2V0QWxsUmFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmFuZ2VzID0gW107XG4gIHRoaXMuZWFjaFJhbmdlKGZ1bmN0aW9uIChyYW5nZSkge1xuICAgIHJhbmdlcy5wdXNoKHJhbmdlKTtcbiAgfSk7XG4gIHJldHVybiByYW5nZXM7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRTaW5nbGVSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB0aGlzLmFkZFJhbmdlKHJhbmdlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2VzKSB7XG4gIHZhciBjb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICBmb3IgKHZhciBpID0gMCwgZWwsIGxlbiA9IHJhbmdlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGVsID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZXNbaV0pO1xuICAgIHRyeSB7XG4gICAgICBjb250cm9sUmFuZ2UuYWRkKGVsKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFJhbmdlcygpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICAgIH1cbiAgfVxuICBjb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmFuZ2VNYW51YWxseSAoc2VsLCByYW5nZSkge1xuICB2YXIgcmFuZ2VzID0gc2VsLmdldEFsbFJhbmdlcygpO1xuICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzU2FtZVJhbmdlKHJhbmdlLCByYW5nZXNbaV0pKSB7XG4gICAgICBzZWwuYWRkUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWwucmFuZ2VDb3VudCkge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGFuY2hvclByZWZpeCA9ICdzdGFydCc7XG4gIHZhciBmb2N1c1ByZWZpeCA9ICdlbmQnO1xuICBzZWwuYW5jaG9yTm9kZSA9IHJhbmdlW2FuY2hvclByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHJhbmdlW2FuY2hvclByZWZpeCArICdPZmZzZXQnXTtcbiAgc2VsLmZvY3VzTm9kZSA9IHJhbmdlW2ZvY3VzUHJlZml4ICsgJ0NvbnRhaW5lciddO1xuICBzZWwuZm9jdXNPZmZzZXQgPSByYW5nZVtmb2N1c1ByZWZpeCArICdPZmZzZXQnXTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW1wdHlTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuYW5jaG9yTm9kZSA9IHNlbC5mb2N1c05vZGUgPSBudWxsO1xuICBzZWwuYW5jaG9yT2Zmc2V0ID0gc2VsLmZvY3VzT2Zmc2V0ID0gMDtcbiAgc2VsLnJhbmdlQ291bnQgPSAwO1xuICBzZWwuaXNDb2xsYXBzZWQgPSB0cnVlO1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiByYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudCAocmFuZ2VOb2Rlcykge1xuICBpZiAoIXJhbmdlTm9kZXMubGVuZ3RoIHx8IHJhbmdlTm9kZXNbMF0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IHJhbmdlTm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzQW5jZXN0b3JPZihyYW5nZU5vZGVzWzBdLCByYW5nZU5vZGVzW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZSAocmFuZ2UpIHtcbiAgdmFyIG5vZGVzID0gcmFuZ2UuZ2V0Tm9kZXMoKTtcbiAgaWYgKCFyYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudChub2RlcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UoKTogcmFuZ2UgZGlkIG5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gbm9kZXNbMF07XG59XG5cbmZ1bmN0aW9uIGlzVGV4dFJhbmdlIChyYW5nZSkge1xuICByZXR1cm4gcmFuZ2UgJiYgcmFuZ2UudGV4dCAhPT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tVGV4dFJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHNlbC5fcmFuZ2VzID0gW3JhbmdlXTtcbiAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2Uoc2VsLCByYW5nZSwgZmFsc2UpO1xuICBzZWwucmFuZ2VDb3VudCA9IDE7XG4gIHNlbC5pc0NvbGxhcHNlZCA9IHJhbmdlLmNvbGxhcHNlZDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29udHJvbFNlbGVjdGlvbiAoc2VsKSB7XG4gIHNlbC5fcmFuZ2VzLmxlbmd0aCA9IDA7XG4gIGlmIChzZWwuX3NlbGVjdGlvbi50eXBlID09PSAnTm9uZScpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250cm9sUmFuZ2UgPSBzZWwuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgIGlmIChpc1RleHRSYW5nZShjb250cm9sUmFuZ2UpKSB7XG4gICAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbCwgY29udHJvbFJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsLnJhbmdlQ291bnQgPSBjb250cm9sUmFuZ2UubGVuZ3RoO1xuICAgICAgdmFyIHJhbmdlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VDb3VudDsgKytpKSB7XG4gICAgICAgIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGUoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgICAgICBzZWwuX3Jhbmdlcy5wdXNoKHJhbmdlKTtcbiAgICAgIH1cbiAgICAgIHNlbC5pc0NvbGxhcHNlZCA9IHNlbC5yYW5nZUNvdW50ID09PSAxICYmIHNlbC5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICAgIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgc2VsLl9yYW5nZXNbc2VsLnJhbmdlQ291bnQgLSAxXSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbiAoc2VsLCByYW5nZSkge1xuICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICB9XG4gIHRyeSB7XG4gICAgbmV3Q29udHJvbFJhbmdlLmFkZChyYW5nZUVsZW1lbnQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRSYW5nZSgpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWwpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVSYW5nZSAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIChcbiAgICBsZWZ0LnN0YXJ0Q29udGFpbmVyID09PSByaWdodC5zdGFydENvbnRhaW5lciAmJlxuICAgIGxlZnQuc3RhcnRPZmZzZXQgPT09IHJpZ2h0LnN0YXJ0T2Zmc2V0ICYmXG4gICAgbGVmdC5lbmRDb250YWluZXIgPT09IHJpZ2h0LmVuZENvbnRhaW5lciAmJlxuICAgIGxlZnQuZW5kT2Zmc2V0ID09PSByaWdodC5lbmRPZmZzZXRcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNBbmNlc3Rvck9mIChhbmNlc3RvciwgZGVzY2VuZGFudCkge1xuICB2YXIgbm9kZSA9IGRlc2NlbmRhbnQ7XG4gIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlID09PSBhbmNlc3Rvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEdldFNlbGVjdGlvbihnbG9iYWwuZG9jdW1lbnQuc2VsZWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzSG9zdE1ldGhvZCAoaG9zdCwgcHJvcCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBob3N0W3Byb3BdO1xuICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAhISh0eXBlID09PSAnb2JqZWN0JyAmJiBob3N0W3Byb3BdKSB8fCB0eXBlID09PSAndW5rbm93bic7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdFByb3BlcnR5IChob3N0LCBwcm9wKSB7XG4gIHJldHVybiB0eXBlb2YgaG9zdFtwcm9wXSAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIG1hbnkgKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhcmVIb3N0ZWQgKGhvc3QsIHByb3BzKSB7XG4gICAgdmFyIGkgPSBwcm9wcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKCFmbihob3N0LCBwcm9wc1tpXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGhvZDogaXNIb3N0TWV0aG9kLFxuICBtZXRob2RzOiBtYW55KGlzSG9zdE1ldGhvZCksXG4gIHByb3BlcnR5OiBpc0hvc3RQcm9wZXJ0eSxcbiAgcHJvcGVydGllczogbWFueShpc0hvc3RQcm9wZXJ0eSlcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xuXG5mdW5jdGlvbiByYW5nZVRvVGV4dFJhbmdlIChwKSB7XG4gIGlmIChwLmNvbGxhcHNlZCkge1xuICAgIHJldHVybiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuc3RhcnRDb250YWluZXIsIG9mZnNldDogcC5zdGFydE9mZnNldCB9LCB0cnVlKTtcbiAgfVxuICB2YXIgc3RhcnRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB2YXIgZW5kUmFuZ2UgPSBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuZW5kQ29udGFpbmVyLCBvZmZzZXQ6IHAuZW5kT2Zmc2V0IH0sIGZhbHNlKTtcbiAgdmFyIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnU3RhcnRUb1N0YXJ0Jywgc3RhcnRSYW5nZSk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnRW5kVG9FbmQnLCBlbmRSYW5nZSk7XG4gIHJldHVybiB0ZXh0UmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyRGF0YU5vZGUgKG5vZGUpIHtcbiAgdmFyIHQgPSBub2RlLm5vZGVUeXBlO1xuICByZXR1cm4gdCA9PT0gMyB8fCB0ID09PSA0IHx8IHQgPT09IDggO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSAocCwgc3RhcnRpbmcpIHtcbiAgdmFyIGJvdW5kO1xuICB2YXIgcGFyZW50O1xuICB2YXIgb2Zmc2V0ID0gcC5vZmZzZXQ7XG4gIHZhciB3b3JraW5nTm9kZTtcbiAgdmFyIGNoaWxkTm9kZXM7XG4gIHZhciByYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHZhciBkYXRhID0gaXNDaGFyYWN0ZXJEYXRhTm9kZShwLm5vZGUpO1xuXG4gIGlmIChkYXRhKSB7XG4gICAgYm91bmQgPSBwLm5vZGU7XG4gICAgcGFyZW50ID0gYm91bmQucGFyZW50Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZE5vZGVzID0gcC5ub2RlLmNoaWxkTm9kZXM7XG4gICAgYm91bmQgPSBvZmZzZXQgPCBjaGlsZE5vZGVzLmxlbmd0aCA/IGNoaWxkTm9kZXNbb2Zmc2V0XSA6IG51bGw7XG4gICAgcGFyZW50ID0gcC5ub2RlO1xuICB9XG5cbiAgd29ya2luZ05vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB3b3JraW5nTm9kZS5pbm5lckhUTUwgPSAnJiNmZWZmOyc7XG5cbiAgaWYgKGJvdW5kKSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZSh3b3JraW5nTm9kZSwgYm91bmQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh3b3JraW5nTm9kZSk7XG4gIH1cblxuICByYW5nZS5tb3ZlVG9FbGVtZW50VGV4dCh3b3JraW5nTm9kZSk7XG4gIHJhbmdlLmNvbGxhcHNlKCFzdGFydGluZyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh3b3JraW5nTm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICByYW5nZVtzdGFydGluZyA/ICdtb3ZlU3RhcnQnIDogJ21vdmVFbmQnXSgnY2hhcmFjdGVyJywgb2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gcmFuZ2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZ2VUb1RleHRSYW5nZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgc2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9zZXRTZWxlY3Rpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldDogZ2V0U2VsZWN0aW9uLFxuICBzZXQ6IHNldFNlbGVjdGlvblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblxuZnVuY3Rpb24gc2V0U2VsZWN0aW9uIChwKSB7XG4gIGlmIChkb2MuY3JlYXRlUmFuZ2UpIHtcbiAgICBtb2Rlcm5TZWxlY3Rpb24oKTtcbiAgfSBlbHNlIHtcbiAgICBvbGRTZWxlY3Rpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vZGVyblNlbGVjdGlvbiAoKSB7XG4gICAgdmFyIHNlbCA9IGdldFNlbGVjdGlvbigpO1xuICAgIHZhciByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgIGlmICghcC5zdGFydENvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocC5lbmRDb250YWluZXIpIHtcbiAgICAgIHJhbmdlLnNldEVuZChwLmVuZENvbnRhaW5lciwgcC5lbmRPZmZzZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZS5zZXRFbmQocC5zdGFydENvbnRhaW5lciwgcC5zdGFydE9mZnNldCk7XG4gICAgfVxuICAgIHJhbmdlLnNldFN0YXJ0KHAuc3RhcnRDb250YWluZXIsIHAuc3RhcnRPZmZzZXQpO1xuICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gb2xkU2VsZWN0aW9uICgpIHtcbiAgICByYW5nZVRvVGV4dFJhbmdlKHApLnNlbGVjdCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0U2VsZWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0ID0gZWFzeUdldDtcbnZhciBzZXQgPSBlYXN5U2V0O1xuXG5pZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSkge1xuICBnZXQgPSBoYXJkR2V0O1xuICBzZXQgPSBoYXJkU2V0O1xufVxuXG5mdW5jdGlvbiBlYXN5R2V0IChlbCkge1xuICByZXR1cm4ge1xuICAgIHN0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCxcbiAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXJkR2V0IChlbCkge1xuICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSAhPT0gZWwpIHtcbiAgICBlbC5mb2N1cygpO1xuICB9XG5cbiAgdmFyIHJhbmdlID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciBib29rbWFyayA9IHJhbmdlLmdldEJvb2ttYXJrKCk7XG4gIHZhciBvcmlnaW5hbCA9IGVsLnZhbHVlO1xuICB2YXIgbWFya2VyID0gZ2V0VW5pcXVlTWFya2VyKG9yaWdpbmFsKTtcbiAgdmFyIHBhcmVudCA9IHJhbmdlLnBhcmVudEVsZW1lbnQoKTtcbiAgaWYgKHBhcmVudCA9PT0gbnVsbCB8fCAhaW5wdXRzKHBhcmVudCkpIHtcbiAgICByZXR1cm4gcmVzdWx0KDAsIDApO1xuICB9XG4gIHJhbmdlLnRleHQgPSBtYXJrZXIgKyByYW5nZS50ZXh0ICsgbWFya2VyO1xuXG4gIHZhciBjb250ZW50cyA9IGVsLnZhbHVlO1xuXG4gIGVsLnZhbHVlID0gb3JpZ2luYWw7XG4gIHJhbmdlLm1vdmVUb0Jvb2ttYXJrKGJvb2ttYXJrKTtcbiAgcmFuZ2Uuc2VsZWN0KCk7XG5cbiAgcmV0dXJuIHJlc3VsdChjb250ZW50cy5pbmRleE9mKG1hcmtlciksIGNvbnRlbnRzLmxhc3RJbmRleE9mKG1hcmtlcikgLSBtYXJrZXIubGVuZ3RoKTtcblxuICBmdW5jdGlvbiByZXN1bHQgKHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoYWN0aXZlICE9PSBlbCkgeyAvLyBkb24ndCBkaXNydXB0IHByZS1leGlzdGluZyBzdGF0ZVxuICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICBhY3RpdmUuZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmJsdXIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFVuaXF1ZU1hcmtlciAoY29udGVudHMpIHtcbiAgdmFyIG1hcmtlcjtcbiAgZG8ge1xuICAgIG1hcmtlciA9ICdAQG1hcmtlci4nICsgTWF0aC5yYW5kb20oKSAqIG5ldyBEYXRlKCk7XG4gIH0gd2hpbGUgKGNvbnRlbnRzLmluZGV4T2YobWFya2VyKSAhPT0gLTEpO1xuICByZXR1cm4gbWFya2VyO1xufVxuXG5mdW5jdGlvbiBpbnB1dHMgKGVsKSB7XG4gIHJldHVybiAoKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgZWwudHlwZSA9PT0gJ3RleHQnKSB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnKTtcbn1cblxuZnVuY3Rpb24gZWFzeVNldCAoZWwsIHApIHtcbiAgZWwuc2VsZWN0aW9uU3RhcnQgPSBwYXJzZShlbCwgcC5zdGFydCk7XG4gIGVsLnNlbGVjdGlvbkVuZCA9IHBhcnNlKGVsLCBwLmVuZCk7XG59XG5cbmZ1bmN0aW9uIGhhcmRTZXQgKGVsLCBwKSB7XG4gIHZhciByYW5nZSA9IGVsLmNyZWF0ZVRleHRSYW5nZSgpO1xuXG4gIGlmIChwLnN0YXJ0ID09PSAnZW5kJyAmJiBwLmVuZCA9PT0gJ2VuZCcpIHtcbiAgICByYW5nZS5jb2xsYXBzZShmYWxzZSk7XG4gICAgcmFuZ2Uuc2VsZWN0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG4gICAgcmFuZ2UubW92ZUVuZCgnY2hhcmFjdGVyJywgcGFyc2UoZWwsIHAuZW5kKSk7XG4gICAgcmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBwYXJzZShlbCwgcC5zdGFydCkpO1xuICAgIHJhbmdlLnNlbGVjdCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlIChlbCwgdmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSAnZW5kJyA/IGVsLnZhbHVlLmxlbmd0aCA6IHZhbHVlIHx8IDA7XG59XG5cbmZ1bmN0aW9uIHNlbGwgKGVsLCBwKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgc2V0KGVsLCBwKTtcbiAgfVxuICByZXR1cm4gZ2V0KGVsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZWxsO1xuIiwidmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbmlmIChzaSkge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldEltbWVkaWF0ZShmbik7IH07XG59IGVsc2Uge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpY2s7IiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07Il19
