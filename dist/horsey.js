!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.horsey=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"J:\\Dev\\Work\\horsey\\horsey.js":[function(require,module,exports){
'use strict';

var _hashSum = require('hash-sum');

var _hashSum2 = _interopRequireDefault(_hashSum);

var _sell = require('sell');

var _sell2 = _interopRequireDefault(_sell);

var _sektor = require('sektor');

var _sektor2 = _interopRequireDefault(_sektor);

var _emitter = require('contra/emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _bullseye = require('bullseye');

var _bullseye2 = _interopRequireDefault(_bullseye);

var _crossvent = require('crossvent');

var _crossvent2 = _interopRequireDefault(_crossvent);

var _fuzzysearch = require('fuzzysearch');

var _fuzzysearch2 = _interopRequireDefault(_fuzzysearch);

var _debounce = require('lodash/debounce');

var _debounce2 = _interopRequireDefault(_debounce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
      cache = _options$cache === undefined ? {} : _options$cache,
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
      done(null, [], true);return;
    }
    if (completer) {
      completer.emit('beforeUpdate');
    }
    var hash = (0, _hashSum2.default)(query); // fast, case insensitive, prevents collisions
    if (caching) {
      var entry = cache[hash];
      if (entry) {
        var start = entry.created.getTime();
        var duration = cache.duration || 60 * 60 * 24;
        var diff = duration * 1000;
        var fresh = new Date(start + diff) > new Date();
        if (fresh) {
          done(null, entry.items.slice());return;
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
        cache[hash] = { created: new Date(), items: items };
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
      highlighter = _o$highlighter === undefined ? true : _o$highlighter,
      _o$highlightCompleteW = o.highlightCompleteWords,
      highlightCompleteWords = _o$highlightCompleteW === undefined ? true : _o$highlightCompleteW,
      _o$renderItem = o.renderItem,
      renderItem = _o$renderItem === undefined ? defaultItemRenderer : _o$renderItem,
      _o$renderCategory = o.renderCategory,
      renderCategory = _o$renderCategory === undefined ? defaultCategoryRenderer : _o$renderCategory,
      setAppends = o.setAppends;

  var limit = typeof o.limit === 'number' ? o.limit : Infinity;
  var userFilter = o.filter || defaultFilter;
  var userSet = o.set || defaultSetter;
  var categories = tag('div', 'sey-categories');
  var container = tag('div', 'sey-container');
  var deferredFiltering = defer(filtering);
  var state = { counter: 0, query: null };
  var categoryMap = Object.create(null);
  var selection = null;
  var eye = void 0;
  var attachment = el;
  var noneMatch = void 0;
  var textInput = void 0;
  var anyInput = void 0;
  var ranchorleft = void 0;
  var ranchorright = void 0;
  var lastPrefix = '';
  var debounceTime = o.debounce || 300;
  var debouncedLoading = (0, _debounce2.default)(loading, debounceTime);

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
  var api = (0, _emitter2.default)({
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
    _crossvent2.default.remove(attachment, 'focus', loading);
    var query = readInput();
    if (query === state.query) {
      return;
    }
    hasItems = false;
    state.query = query;

    var counter = ++state.counter;

    source({ query: query, limit: limit }, sourced);

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
      return { data: data, ul: ul };
    }
  }

  function add(suggestion, categoryData) {
    var cat = getCategory(categoryData);
    var li = tag('li', 'sey-item');
    renderItem(li, suggestion);
    if (highlighter) {
      breakupForHighlighter(li);
    }
    _crossvent2.default.add(li, 'mouseenter', hoverSuggestion);
    _crossvent2.default.add(li, 'click', clickedSuggestion);
    _crossvent2.default.add(li, 'horsey-filter', filterItem);
    _crossvent2.default.add(li, 'horsey-hide', hideItem);
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
        _crossvent2.default.fabricate(li, 'horsey-hide');
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
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = text[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var char = _step.value;

          parent.insertBefore(spanFor(char), el);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      parent.removeChild(el);
      function spanFor(char) {
        var span = doc.createElement('span');
        span.className = 'sey-char';
        span.textContent = span.innerText = char;
        return span;
      }
    });
  }

  function highlight(el, needle) {
    var rword = /[\s,._\[\]{}()-]/g;
    var words = needle.split(rword).filter(function (w) {
      return w.length;
    });
    var elems = [].concat(_toConsumableArray(el.querySelectorAll('.sey-char')));
    var chars = void 0;
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
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = words[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var word = _step2.value;

          var tempIndex = startIndex;
          retry: while (tempIndex !== -1) {
            var init = true;
            var prevIndex = tempIndex;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = word[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var char = _step3.value;

                var i = chars.indexOf(char, prevIndex + 1);
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
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = elems.splice(tempIndex, 1 + prevIndex - tempIndex)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var _el = _step4.value;

                on(_el);
              }
            } catch (err) {
              _didIteratorError4 = true;
              _iteratorError4 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                  _iterator4.return();
                }
              } finally {
                if (_didIteratorError4) {
                  throw _iteratorError4;
                }
              }
            }

            balance();
            needle = needle.replace(word, '');
            break;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    function fuzzy() {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = needle[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var input = _step5.value;

          while (elems.length) {
            var _el2 = elems.shift();
            if ((_el2.innerText || _el2.textContent || '').toLocaleLowerCase() === input.toLocaleLowerCase()) {
              on(_el2);
              break;
            } else {
              off(_el2);
            }
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
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
    var node = void 0;
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
      _crossvent2.default.fabricate(attachment, 'horsey-show');
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
        if (_sektor2.default.matchesSelector(el.parentElement, '.sey-category')) {
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
    _crossvent2.default.fabricate(attachment, 'horsey-hide');
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
          _crossvent2.default.fabricate(selection, 'click');
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
    _crossvent2.default.fabricate(attachment, 'horsey-filter');
    var value = readInput();
    if (!o.blankSearch && !value) {
      hide();return;
    }
    var nomatch = noMatches({ query: value });
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
          _crossvent2.default.fabricate(li, 'horsey-hide');
        } else {
          _crossvent2.default.fabricate(li, 'horsey-filter');
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
      eye = (0, _bullseye2.default)(container, attachment, {
        caret: anyInput && attachment.tagName !== 'INPUT',
        context: o.appendTo
      });
      if (!visible()) {
        eye.sleep();
      }
    }
    if (remove || anyInput && doc.activeElement !== attachment) {
      _crossvent2.default[op](attachment, 'focus', loading);
    } else {
      loading();
    }
    if (anyInput) {
      _crossvent2.default[op](attachment, 'keypress', deferredShow);
      _crossvent2.default[op](attachment, 'keypress', deferredFiltering);
      _crossvent2.default[op](attachment, 'keydown', deferredFilteringNoEnter);
      _crossvent2.default[op](attachment, 'paste', deferredFiltering);
      _crossvent2.default[op](attachment, 'keydown', keydown);
      if (o.autoHideOnBlur) {
        _crossvent2.default[op](attachment, 'keydown', hideOnBlur);
      }
    } else {
      _crossvent2.default[op](attachment, 'click', toggler);
      _crossvent2.default[op](docElement, 'keydown', keydown);
    }
    if (o.autoHideOnClick) {
      _crossvent2.default[op](doc, 'click', hideOnClick);
    }
    if (form) {
      _crossvent2.default[op](form, 'submit', hide);
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
    if ((0, _fuzzysearch2.default)(needle, text.toLowerCase())) {
      return true;
    }
    var value = getValue(suggestion) || '';
    if (typeof value !== 'string') {
      return false;
    }
    return (0, _fuzzysearch2.default)(needle, value.toLowerCase());
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
    var position = (0, _sell2.default)(el);
    var input = loopbackToAnchor(q, position).text;
    if (input) {
      return { input: input, suggestion: suggestion };
    }
  }

  function appendText(value) {
    var current = el.value;
    var position = (0, _sell2.default)(el);
    var input = loopbackToAnchor(current, position);
    var left = current.substr(0, input.start);
    var right = current.substr(input.start + input.text.length + (position.end - position.start));
    var before = left + value + ' ';

    el.value = before + right;
    (0, _sell2.default)(el, { start: before.length, end: before.length });
  }

  function filterAnchoredHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function appendHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function findList(category) {
    return (0, _sektor2.default)('.sey-list', category)[0];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvcnNleS5qcyJdLCJuYW1lcyI6WyJLRVlfQkFDS1NQQUNFIiwiS0VZX0VOVEVSIiwiS0VZX0VTQyIsIktFWV9VUCIsIktFWV9ET1dOIiwiS0VZX1RBQiIsImRvYyIsImRvY3VtZW50IiwiZG9jRWxlbWVudCIsImRvY3VtZW50RWxlbWVudCIsImhvcnNleSIsImVsIiwib3B0aW9ucyIsInNldEFwcGVuZHMiLCJzZXQiLCJmaWx0ZXIiLCJzb3VyY2UiLCJjYWNoZSIsInByZWRpY3ROZXh0U2VhcmNoIiwicmVuZGVySXRlbSIsInJlbmRlckNhdGVnb3J5IiwiYmxhbmtTZWFyY2giLCJhcHBlbmRUbyIsImFuY2hvciIsImRlYm91bmNlIiwiY2FjaGluZyIsInVzZXJHZXRUZXh0IiwiZ2V0VGV4dCIsInVzZXJHZXRWYWx1ZSIsImdldFZhbHVlIiwiZCIsInRvU3RyaW5nIiwicHJldmlvdXNTdWdnZXN0aW9ucyIsInByZXZpb3VzU2VsZWN0aW9uIiwibGltaXQiLCJOdW1iZXIiLCJJbmZpbml0eSIsImNvbXBsZXRlciIsImF1dG9jb21wbGV0ZSIsInNvdXJjZUZ1bmN0aW9uIiwibm9NYXRjaGVzIiwibm9NYXRjaGVzVGV4dCIsInMiLCJ2YWx1ZSIsImRlZmF1bHRTZXR0ZXIiLCJlbWl0IiwiZGF0YSIsInF1ZXJ5IiwibGVuZ3RoIiwiZG9uZSIsImhhc2giLCJlbnRyeSIsInN0YXJ0IiwiY3JlYXRlZCIsImdldFRpbWUiLCJkdXJhdGlvbiIsImRpZmYiLCJmcmVzaCIsIkRhdGUiLCJpdGVtcyIsInNsaWNlIiwic291cmNlRGF0YSIsImlucHV0Iiwic291cmNlZCIsImVyciIsInJlc3VsdCIsImNvbnNvbGUiLCJsb2ciLCJBcnJheSIsImlzQXJyYXkiLCJvIiwicGFyZW50IiwiYm9keSIsImZvcm0iLCJoaWdobGlnaHRlciIsImhpZ2hsaWdodENvbXBsZXRlV29yZHMiLCJkZWZhdWx0SXRlbVJlbmRlcmVyIiwiZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIiLCJ1c2VyRmlsdGVyIiwiZGVmYXVsdEZpbHRlciIsInVzZXJTZXQiLCJjYXRlZ29yaWVzIiwidGFnIiwiY29udGFpbmVyIiwiZGVmZXJyZWRGaWx0ZXJpbmciLCJkZWZlciIsImZpbHRlcmluZyIsInN0YXRlIiwiY291bnRlciIsImNhdGVnb3J5TWFwIiwiT2JqZWN0IiwiY3JlYXRlIiwic2VsZWN0aW9uIiwiZXllIiwiYXR0YWNobWVudCIsIm5vbmVNYXRjaCIsInRleHRJbnB1dCIsImFueUlucHV0IiwicmFuY2hvcmxlZnQiLCJyYW5jaG9ycmlnaHQiLCJsYXN0UHJlZml4IiwiZGVib3VuY2VUaW1lIiwiZGVib3VuY2VkTG9hZGluZyIsImxvYWRpbmciLCJhdXRvSGlkZU9uQmx1ciIsImF1dG9IaWRlT25DbGljayIsImF1dG9TaG93T25VcERvd24iLCJ0YWdOYW1lIiwiUmVnRXhwIiwiaGFzSXRlbXMiLCJhcGkiLCJjbGVhciIsInNob3ciLCJoaWRlIiwidG9nZ2xlIiwiZGVzdHJveSIsInJlZnJlc2hQb3NpdGlvbiIsImFwcGVuZFRleHQiLCJhcHBlbmRIVE1MIiwiZmlsdGVyQW5jaG9yZWRUZXh0IiwiZmlsdGVyQW5jaG9yZWRIVE1MIiwiZGVmYXVsdEFwcGVuZFRleHQiLCJyZXRhcmdldCIsImFwcGVuZENoaWxkIiwidGV4dCIsInNldEF0dHJpYnV0ZSIsImxvYWRlZCIsImlucHV0RXZlbnRzIiwiaXNFZGl0YWJsZSIsInJlZnJlc2giLCJmb3JjZVNob3ciLCJjcm9zc3ZlbnQiLCJyZW1vdmUiLCJyZWFkSW5wdXQiLCJibGFua1F1ZXJ5IiwiZm9yRWFjaCIsImNhdCIsImxpc3QiLCJhZGQiLCJzdWdnZXN0aW9uIiwidW5zZWxlY3QiLCJsYXN0Q2hpbGQiLCJyZW1vdmVDaGlsZCIsImlubmVySFRNTCIsInRyaW0iLCJnZXRDYXRlZ29yeSIsImlkIiwiY3JlYXRlQ2F0ZWdvcnkiLCJjYXRlZ29yeSIsInVsIiwiY2F0ZWdvcnlEYXRhIiwibGkiLCJicmVha3VwRm9ySGlnaGxpZ2h0ZXIiLCJob3ZlclN1Z2dlc3Rpb24iLCJjbGlja2VkU3VnZ2VzdGlvbiIsImZpbHRlckl0ZW0iLCJoaWRlSXRlbSIsInB1c2giLCJzZWxlY3QiLCJmb2N1cyIsImNsYXNzTmFtZSIsInJlcGxhY2UiLCJmYWJyaWNhdGUiLCJoaWRkZW4iLCJnZXRUZXh0Q2hpbGRyZW4iLCJwYXJlbnRFbGVtZW50IiwidGV4dENvbnRlbnQiLCJub2RlVmFsdWUiLCJjaGFyIiwiaW5zZXJ0QmVmb3JlIiwic3BhbkZvciIsInNwYW4iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJUZXh0IiwiaGlnaGxpZ2h0IiwibmVlZGxlIiwicndvcmQiLCJ3b3JkcyIsInNwbGl0IiwidyIsImVsZW1zIiwicXVlcnlTZWxlY3RvckFsbCIsImNoYXJzIiwic3RhcnRJbmRleCIsImJhbGFuY2UiLCJ3aG9sZSIsImZ1enp5IiwiY2xlYXJSZW1haW5kZXIiLCJtYXAiLCJ3b3JkIiwidGVtcEluZGV4IiwicmV0cnkiLCJpbml0IiwicHJldkluZGV4IiwiaSIsImluZGV4T2YiLCJmYWlsIiwic3BsaWNlIiwib24iLCJzaGlmdCIsInRvTG9jYWxlTG93ZXJDYXNlIiwib2ZmIiwiY2giLCJjbGFzc0xpc3QiLCJ0ZXh0cyIsIndhbGtlciIsImNyZWF0ZVRyZWVXYWxrZXIiLCJOb2RlRmlsdGVyIiwiU0hPV19URVhUIiwibm9kZSIsIm5leHROb2RlIiwiaXNUZXh0IiwiaWwiLCJpc0lucHV0IiwidmlzaWJsZSIsInRvZ2dsZXIiLCJlIiwibGVmdCIsIndoaWNoIiwibWV0YUtleSIsImN0cmxLZXkiLCJtb3ZlIiwidXAiLCJtb3ZlcyIsInRvdGFsIiwiZmluZENhdGVnb3J5IiwiZmlyc3RDaGlsZCIsImZpcnN0IiwibGFzdCIsIm5leHQiLCJwcmV2IiwiZmluZE5leHQiLCJzZWt0b3IiLCJtYXRjaGVzU2VsZWN0b3IiLCJmaW5kTGlzdCIsInNsZWVwIiwia2V5ZG93biIsInNob3duIiwia2V5Q29kZSIsInN0b3AiLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsInNob3dOb1Jlc3VsdHMiLCJoaWRlTm9SZXN1bHRzIiwibm9tYXRjaCIsImNvdW50Iiwid2Fsa0NhdGVnb3JpZXMiLCJwYXJ0aWFsIiwid2Fsa0NhdGVnb3J5IiwibmV4dFNpYmxpbmciLCJkZWZlcnJlZEZpbHRlcmluZ05vRW50ZXIiLCJkZWZlcnJlZFNob3ciLCJzZXRUaW1lb3V0IiwiYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQiLCJ0YXJnZXQiLCJwYXJlbnROb2RlIiwiaGlkZU9uQmx1ciIsImhpZGVPbkNsaWNrIiwib3AiLCJjYXJldCIsImNvbnRleHQiLCJhY3RpdmVFbGVtZW50IiwiY29udGFpbnMiLCJkaXYiLCJxIiwidG9Mb3dlckNhc2UiLCJsb29wYmFja1RvQW5jaG9yIiwicCIsImFuY2hvcmVkIiwic3Vic3RyIiwidGVzdCIsInBvc2l0aW9uIiwiY3VycmVudCIsInJpZ2h0IiwiZW5kIiwiYmVmb3JlIiwiRXJyb3IiLCJ0eXBlIiwiZm4iLCJnZXRBdHRyaWJ1dGUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQUNBLElBQU1BLGdCQUFnQixDQUF0QjtBQUNBLElBQU1DLFlBQVksRUFBbEI7QUFDQSxJQUFNQyxVQUFVLEVBQWhCO0FBQ0EsSUFBTUMsU0FBUyxFQUFmO0FBQ0EsSUFBTUMsV0FBVyxFQUFqQjtBQUNBLElBQU1DLFVBQVUsQ0FBaEI7QUFDQSxJQUFNQyxNQUFNQyxRQUFaO0FBQ0EsSUFBTUMsYUFBYUYsSUFBSUcsZUFBdkI7O0FBRUEsU0FBU0MsTUFBVCxDQUFpQkMsRUFBakIsRUFBbUM7QUFBQSxNQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQSxNQUUvQkMsVUFGK0IsR0FjN0JELE9BZDZCLENBRS9CQyxVQUYrQjtBQUFBLE1BRy9CQyxJQUgrQixHQWM3QkYsT0FkNkIsQ0FHL0JFLEdBSCtCO0FBQUEsTUFJL0JDLE1BSitCLEdBYzdC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QUFlLE9BQWYsSUFBMEJoRyxHQUFHZ0csT0FBSCxLQUFlLFVBQWhEO0FBQTZEOztBQUVyRixTQUFTekIsR0FBVCxDQUFjbU0sSUFBZCxFQUFvQnJILFNBQXBCLEVBQStCO0FBQzdCLE1BQU1ySixLQUFLTCxJQUFJc0ssYUFBSixDQUFrQnlHLElBQWxCLENBQVg7QUFDQTFRLEtBQUdxSixTQUFILEdBQWVBLFNBQWY7QUFDQSxTQUFPckosRUFBUDtBQUNEOztBQUVELFNBQVMwRSxLQUFULENBQWdCaU0sRUFBaEIsRUFBb0I7QUFBRSxTQUFPLFlBQVk7QUFBRTFCLGVBQVcwQixFQUFYLEVBQWUsQ0FBZjtBQUFvQixHQUF6QztBQUE0QztBQUNsRSxTQUFTMUosSUFBVCxDQUFlakgsRUFBZixFQUFtQmdDLEtBQW5CLEVBQTBCO0FBQUVoQyxLQUFHa0ssU0FBSCxHQUFlbEssR0FBRzJKLFdBQUgsR0FBaUIzSCxLQUFoQztBQUF3Qzs7QUFFcEUsU0FBU3FGLFVBQVQsQ0FBcUJySCxFQUFyQixFQUF5QjtBQUN2QixNQUFNZ0MsUUFBUWhDLEdBQUc0USxZQUFILENBQWdCLGlCQUFoQixDQUFkO0FBQ0EsTUFBSTVPLFVBQVUsT0FBZCxFQUF1QjtBQUNyQixXQUFPLEtBQVA7QUFDRDtBQUNELE1BQUlBLFVBQVUsTUFBZCxFQUFzQjtBQUNwQixXQUFPLElBQVA7QUFDRDtBQUNELE1BQUloQyxHQUFHMEosYUFBUCxFQUFzQjtBQUNwQixXQUFPckMsV0FBV3JILEdBQUcwSixhQUFkLENBQVA7QUFDRDtBQUNELFNBQU8sS0FBUDtBQUNEOztBQUVEbUgsT0FBT0MsT0FBUCxHQUFpQi9RLE1BQWpCIiwiZmlsZSI6ImhvcnNleS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHN1bSBmcm9tICdoYXNoLXN1bSc7XG5pbXBvcnQgc2VsbCBmcm9tICdzZWxsJztcbmltcG9ydCBzZWt0b3IgZnJvbSAnc2VrdG9yJztcbmltcG9ydCBlbWl0dGVyIGZyb20gJ2NvbnRyYS9lbWl0dGVyJztcbmltcG9ydCBidWxsc2V5ZSBmcm9tICdidWxsc2V5ZSc7XG5pbXBvcnQgY3Jvc3N2ZW50IGZyb20gJ2Nyb3NzdmVudCc7XG5pbXBvcnQgZnV6enlzZWFyY2ggZnJvbSAnZnV6enlzZWFyY2gnO1xuaW1wb3J0IGRlYm91bmNlIGZyb20gJ2xvZGFzaC9kZWJvdW5jZSc7XG5jb25zdCBLRVlfQkFDS1NQQUNFID0gODtcbmNvbnN0IEtFWV9FTlRFUiA9IDEzO1xuY29uc3QgS0VZX0VTQyA9IDI3O1xuY29uc3QgS0VZX1VQID0gMzg7XG5jb25zdCBLRVlfRE9XTiA9IDQwO1xuY29uc3QgS0VZX1RBQiA9IDk7XG5jb25zdCBkb2MgPSBkb2N1bWVudDtcbmNvbnN0IGRvY0VsZW1lbnQgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG5mdW5jdGlvbiBob3JzZXkgKGVsLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3Qge1xuICAgIHNldEFwcGVuZHMsXG4gICAgc2V0LFxuICAgIGZpbHRlcixcbiAgICBzb3VyY2UsXG4gICAgY2FjaGUgPSB7fSxcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcbiAgICByZW5kZXJJdGVtLFxuICAgIHJlbmRlckNhdGVnb3J5LFxuICAgIGJsYW5rU2VhcmNoLFxuICAgIGFwcGVuZFRvLFxuICAgIGFuY2hvcixcbiAgICBkZWJvdW5jZVxuICB9ID0gb3B0aW9ucztcbiAgY29uc3QgY2FjaGluZyA9IG9wdGlvbnMuY2FjaGUgIT09IGZhbHNlO1xuICBpZiAoIXNvdXJjZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHVzZXJHZXRUZXh0ID0gb3B0aW9ucy5nZXRUZXh0O1xuICBjb25zdCB1c2VyR2V0VmFsdWUgPSBvcHRpb25zLmdldFZhbHVlO1xuICBjb25zdCBnZXRUZXh0ID0gKFxuICAgIHR5cGVvZiB1c2VyR2V0VGV4dCA9PT0gJ3N0cmluZycgPyBkID0+IGRbdXNlckdldFRleHRdIDpcbiAgICB0eXBlb2YgdXNlckdldFRleHQgPT09ICdmdW5jdGlvbicgPyB1c2VyR2V0VGV4dCA6XG4gICAgZCA9PiBkLnRvU3RyaW5nKClcbiAgKTtcbiAgY29uc3QgZ2V0VmFsdWUgPSAoXG4gICAgdHlwZW9mIHVzZXJHZXRWYWx1ZSA9PT0gJ3N0cmluZycgPyBkID0+IGRbdXNlckdldFZhbHVlXSA6XG4gICAgdHlwZW9mIHVzZXJHZXRWYWx1ZSA9PT0gJ2Z1bmN0aW9uJyA/IHVzZXJHZXRWYWx1ZSA6XG4gICAgZCA9PiBkXG4gICk7XG5cbiAgbGV0IHByZXZpb3VzU3VnZ2VzdGlvbnMgPSBbXTtcbiAgbGV0IHByZXZpb3VzU2VsZWN0aW9uID0gbnVsbDtcbiAgY29uc3QgbGltaXQgPSBOdW1iZXIob3B0aW9ucy5saW1pdCkgfHwgSW5maW5pdHk7XG4gIGNvbnN0IGNvbXBsZXRlciA9IGF1dG9jb21wbGV0ZShlbCwge1xuICAgIHNvdXJjZTogc291cmNlRnVuY3Rpb24sXG4gICAgbGltaXQsXG4gICAgZ2V0VGV4dCxcbiAgICBnZXRWYWx1ZSxcbiAgICBzZXRBcHBlbmRzLFxuICAgIHByZWRpY3ROZXh0U2VhcmNoLFxuICAgIHJlbmRlckl0ZW0sXG4gICAgcmVuZGVyQ2F0ZWdvcnksXG4gICAgYXBwZW5kVG8sXG4gICAgYW5jaG9yLFxuICAgIG5vTWF0Y2hlcyxcbiAgICBub01hdGNoZXNUZXh0OiBvcHRpb25zLm5vTWF0Y2hlcyxcbiAgICBibGFua1NlYXJjaCxcbiAgICBkZWJvdW5jZSxcbiAgICBzZXQgKHMpIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzICE9PSB0cnVlKSB7XG4gICAgICAgIGVsLnZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBwcmV2aW91c1NlbGVjdGlvbiA9IHM7XG4gICAgICAoc2V0IHx8IGNvbXBsZXRlci5kZWZhdWx0U2V0dGVyKShnZXRUZXh0KHMpLCBzKTtcbiAgICAgIGNvbXBsZXRlci5lbWl0KCdhZnRlclNldCcpO1xuICAgIH0sXG4gICAgZmlsdGVyXG4gIH0pO1xuICByZXR1cm4gY29tcGxldGVyO1xuICBmdW5jdGlvbiBub01hdGNoZXMgKGRhdGEpIHtcbiAgICBpZiAoIW9wdGlvbnMubm9NYXRjaGVzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBkYXRhLnF1ZXJ5Lmxlbmd0aDtcbiAgfVxuICBmdW5jdGlvbiBzb3VyY2VGdW5jdGlvbiAoZGF0YSwgZG9uZSkge1xuICAgIGNvbnN0IHtxdWVyeSwgbGltaXR9ID0gZGF0YTtcbiAgICBpZiAoIW9wdGlvbnMuYmxhbmtTZWFyY2ggJiYgcXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICBkb25lKG51bGwsIFtdLCB0cnVlKTsgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY29tcGxldGVyKSB7XG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYmVmb3JlVXBkYXRlJyk7XG4gICAgfVxuICAgIGNvbnN0IGhhc2ggPSBzdW0ocXVlcnkpOyAvLyBmYXN0LCBjYXNlIGluc2Vuc2l0aXZlLCBwcmV2ZW50cyBjb2xsaXNpb25zXG4gICAgaWYgKGNhY2hpbmcpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gY2FjaGVbaGFzaF07XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBlbnRyeS5jcmVhdGVkLmdldFRpbWUoKTtcbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSBjYWNoZS5kdXJhdGlvbiB8fCA2MCAqIDYwICogMjQ7XG4gICAgICAgIGNvbnN0IGRpZmYgPSBkdXJhdGlvbiAqIDEwMDA7XG4gICAgICAgIGNvbnN0IGZyZXNoID0gbmV3IERhdGUoc3RhcnQgKyBkaWZmKSA+IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmIChmcmVzaCkge1xuICAgICAgICAgIGRvbmUobnVsbCwgZW50cnkuaXRlbXMuc2xpY2UoKSk7IHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc291cmNlRGF0YSA9IHtcbiAgICAgIHByZXZpb3VzU3VnZ2VzdGlvbnM6IHByZXZpb3VzU3VnZ2VzdGlvbnMuc2xpY2UoKSxcbiAgICAgIHByZXZpb3VzU2VsZWN0aW9uLFxuICAgICAgaW5wdXQ6IHF1ZXJ5LFxuICAgICAgcmVuZGVySXRlbSxcbiAgICAgIHJlbmRlckNhdGVnb3J5LFxuICAgICAgbGltaXRcbiAgICB9O1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMuc291cmNlKHNvdXJjZURhdGEsIHNvdXJjZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3VyY2VkKG51bGwsIG9wdGlvbnMuc291cmNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc291cmNlZCAoZXJyLCByZXN1bHQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0F1dG9jb21wbGV0ZSBzb3VyY2UgZXJyb3IuJywgZXJyLCBlbCk7XG4gICAgICAgIGRvbmUoZXJyLCBbXSk7XG4gICAgICB9XG4gICAgICBjb25zdCBpdGVtcyA9IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdCA6IFtdO1xuICAgICAgaWYgKGNhY2hpbmcpIHtcbiAgICAgICAgY2FjaGVbaGFzaF0gPSB7IGNyZWF0ZWQ6IG5ldyBEYXRlKCksIGl0ZW1zIH07XG4gICAgICB9XG4gICAgICBwcmV2aW91c1N1Z2dlc3Rpb25zID0gaXRlbXM7XG4gICAgICBkb25lKG51bGwsIGl0ZW1zLnNsaWNlKCkpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhdXRvY29tcGxldGUgKGVsLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgbyA9IG9wdGlvbnM7XG4gIGNvbnN0IHBhcmVudCA9IG8uYXBwZW5kVG8gfHwgZG9jLmJvZHk7XG4gIGNvbnN0IHtcbiAgICBnZXRUZXh0LFxuICAgIGdldFZhbHVlLFxuICAgIGZvcm0sXG4gICAgc291cmNlLFxuICAgIG5vTWF0Y2hlcyxcbiAgICBub01hdGNoZXNUZXh0LFxuICAgIGhpZ2hsaWdodGVyID0gdHJ1ZSxcbiAgICBoaWdobGlnaHRDb21wbGV0ZVdvcmRzID0gdHJ1ZSxcbiAgICByZW5kZXJJdGVtID0gZGVmYXVsdEl0ZW1SZW5kZXJlcixcbiAgICByZW5kZXJDYXRlZ29yeSA9IGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyLFxuICAgIHNldEFwcGVuZHNcbiAgfSA9IG87XG4gIGNvbnN0IGxpbWl0ID0gdHlwZW9mIG8ubGltaXQgPT09ICdudW1iZXInID8gby5saW1pdCA6IEluZmluaXR5O1xuICBjb25zdCB1c2VyRmlsdGVyID0gby5maWx0ZXIgfHwgZGVmYXVsdEZpbHRlcjtcbiAgY29uc3QgdXNlclNldCA9IG8uc2V0IHx8IGRlZmF1bHRTZXR0ZXI7XG4gIGNvbnN0IGNhdGVnb3JpZXMgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcmllcycpO1xuICBjb25zdCBjb250YWluZXIgPSB0YWcoJ2RpdicsICdzZXktY29udGFpbmVyJyk7XG4gIGNvbnN0IGRlZmVycmVkRmlsdGVyaW5nID0gZGVmZXIoZmlsdGVyaW5nKTtcbiAgY29uc3Qgc3RhdGUgPSB7IGNvdW50ZXI6IDAsIHF1ZXJ5OiBudWxsIH07XG4gIGxldCBjYXRlZ29yeU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCBzZWxlY3Rpb24gPSBudWxsO1xuICBsZXQgZXllO1xuICBsZXQgYXR0YWNobWVudCA9IGVsO1xuICBsZXQgbm9uZU1hdGNoO1xuICBsZXQgdGV4dElucHV0O1xuICBsZXQgYW55SW5wdXQ7XG4gIGxldCByYW5jaG9ybGVmdDtcbiAgbGV0IHJhbmNob3JyaWdodDtcbiAgbGV0IGxhc3RQcmVmaXggPSAnJztcbiAgY29uc3QgZGVib3VuY2VUaW1lID0gby5kZWJvdW5jZSB8fCAzMDA7XG4gIGNvbnN0IGRlYm91bmNlZExvYWRpbmcgPSBkZWJvdW5jZShsb2FkaW5nLCBkZWJvdW5jZVRpbWUpO1xuXG4gIGlmIChvLmF1dG9IaWRlT25CbHVyID09PSB2b2lkIDApIHsgby5hdXRvSGlkZU9uQmx1ciA9IHRydWU7IH1cbiAgaWYgKG8uYXV0b0hpZGVPbkNsaWNrID09PSB2b2lkIDApIHsgby5hdXRvSGlkZU9uQ2xpY2sgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9TaG93T25VcERvd24gPT09IHZvaWQgMCkgeyBvLmF1dG9TaG93T25VcERvd24gPSBlbC50YWdOYW1lID09PSAnSU5QVVQnOyB9XG4gIGlmIChvLmFuY2hvcikge1xuICAgIHJhbmNob3JsZWZ0ID0gbmV3IFJlZ0V4cCgnXicgKyBvLmFuY2hvcik7XG4gICAgcmFuY2hvcnJpZ2h0ID0gbmV3IFJlZ0V4cChvLmFuY2hvciArICckJyk7XG4gIH1cblxuICBsZXQgaGFzSXRlbXMgPSBmYWxzZTtcbiAgY29uc3QgYXBpID0gZW1pdHRlcih7XG4gICAgYW5jaG9yOiBvLmFuY2hvcixcbiAgICBjbGVhcixcbiAgICBzaG93LFxuICAgIGhpZGUsXG4gICAgdG9nZ2xlLFxuICAgIGRlc3Ryb3ksXG4gICAgcmVmcmVzaFBvc2l0aW9uLFxuICAgIGFwcGVuZFRleHQsXG4gICAgYXBwZW5kSFRNTCxcbiAgICBmaWx0ZXJBbmNob3JlZFRleHQsXG4gICAgZmlsdGVyQW5jaG9yZWRIVE1MLFxuICAgIGRlZmF1bHRBcHBlbmRUZXh0OiBhcHBlbmRUZXh0LFxuICAgIGRlZmF1bHRGaWx0ZXIsXG4gICAgZGVmYXVsdEl0ZW1SZW5kZXJlcixcbiAgICBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlcixcbiAgICBkZWZhdWx0U2V0dGVyLFxuICAgIHJldGFyZ2V0LFxuICAgIGF0dGFjaG1lbnQsXG4gICAgc291cmNlOiBbXVxuICB9KTtcblxuICByZXRhcmdldChlbCk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yaWVzKTtcbiAgaWYgKG5vTWF0Y2hlcyAmJiBub01hdGNoZXNUZXh0KSB7XG4gICAgbm9uZU1hdGNoID0gdGFnKCdkaXYnLCAnc2V5LWVtcHR5IHNleS1oaWRlJyk7XG4gICAgdGV4dChub25lTWF0Y2gsIG5vTWF0Y2hlc1RleHQpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub25lTWF0Y2gpO1xuICB9XG4gIHBhcmVudC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgbG9hZGVkKHNvdXJjZSwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcblxuICBmdW5jdGlvbiByZXRhcmdldCAoZWwpIHtcbiAgICBpbnB1dEV2ZW50cyh0cnVlKTtcbiAgICBhdHRhY2htZW50ID0gYXBpLmF0dGFjaG1lbnQgPSBlbDtcbiAgICB0ZXh0SW5wdXQgPSBhdHRhY2htZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgYXR0YWNobWVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnO1xuICAgIGFueUlucHV0ID0gdGV4dElucHV0IHx8IGlzRWRpdGFibGUoYXR0YWNobWVudCk7XG4gICAgaW5wdXRFdmVudHMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZnJlc2hQb3NpdGlvbiAoKSB7XG4gICAgaWYgKGV5ZSkgeyBleWUucmVmcmVzaCgpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkaW5nIChmb3JjZVNob3cpIHtcbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjcm9zc3ZlbnQucmVtb3ZlKGF0dGFjaG1lbnQsICdmb2N1cycsIGxvYWRpbmcpO1xuICAgIGNvbnN0IHF1ZXJ5ID0gcmVhZElucHV0KCk7XG4gICAgaWYgKHF1ZXJ5ID09PSBzdGF0ZS5xdWVyeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYXNJdGVtcyA9IGZhbHNlO1xuICAgIHN0YXRlLnF1ZXJ5ID0gcXVlcnk7XG5cbiAgICBjb25zdCBjb3VudGVyID0gKytzdGF0ZS5jb3VudGVyO1xuXG4gICAgc291cmNlKHsgcXVlcnksIGxpbWl0IH0sIHNvdXJjZWQpO1xuXG4gICAgZnVuY3Rpb24gc291cmNlZCAoZXJyLCByZXN1bHQsIGJsYW5rUXVlcnkpIHtcbiAgICAgIGlmIChzdGF0ZS5jb3VudGVyICE9PSBjb3VudGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvYWRlZChyZXN1bHQsIGZvcmNlU2hvdyk7XG4gICAgICBpZiAoZXJyIHx8IGJsYW5rUXVlcnkpIHtcbiAgICAgICAgaGFzSXRlbXMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkZWQgKGNhdGVnb3JpZXMsIGZvcmNlU2hvdykge1xuICAgIGNsZWFyKCk7XG4gICAgaGFzSXRlbXMgPSB0cnVlO1xuICAgIGFwaS5zb3VyY2UgPSBbXTtcbiAgICBjYXRlZ29yaWVzLmZvckVhY2goY2F0ID0+IGNhdC5saXN0LmZvckVhY2goc3VnZ2VzdGlvbiA9PiBhZGQoc3VnZ2VzdGlvbiwgY2F0KSkpO1xuICAgIGlmIChmb3JjZVNob3cpIHtcbiAgICAgIHNob3coKTtcbiAgICB9XG4gICAgZmlsdGVyaW5nKCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhciAoKSB7XG4gICAgdW5zZWxlY3QoKTtcbiAgICB3aGlsZSAoY2F0ZWdvcmllcy5sYXN0Q2hpbGQpIHtcbiAgICAgIGNhdGVnb3JpZXMucmVtb3ZlQ2hpbGQoY2F0ZWdvcmllcy5sYXN0Q2hpbGQpO1xuICAgIH1cbiAgICBjYXRlZ29yeU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgaGFzSXRlbXMgPSBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRJbnB1dCAoKSB7XG4gICAgcmV0dXJuICh0ZXh0SW5wdXQgPyBlbC52YWx1ZSA6IGVsLmlubmVySFRNTCkudHJpbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnkgKGRhdGEpIHtcbiAgICBpZiAoIWRhdGEuaWQpIHtcbiAgICAgIGRhdGEuaWQgPSAnZGVmYXVsdCc7XG4gICAgfVxuICAgIGlmICghY2F0ZWdvcnlNYXBbZGF0YS5pZF0pIHtcbiAgICAgIGNhdGVnb3J5TWFwW2RhdGEuaWRdID0gY3JlYXRlQ2F0ZWdvcnkoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhdGVnb3J5TWFwW2RhdGEuaWRdO1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhdGVnb3J5ICgpIHtcbiAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3J5Jyk7XG4gICAgICBjb25zdCB1bCA9IHRhZygndWwnLCAnc2V5LWxpc3QnKTtcbiAgICAgIHJlbmRlckNhdGVnb3J5KGNhdGVnb3J5LCBkYXRhKTtcbiAgICAgIGNhdGVnb3J5LmFwcGVuZENoaWxkKHVsKTtcbiAgICAgIGNhdGVnb3JpZXMuYXBwZW5kQ2hpbGQoY2F0ZWdvcnkpO1xuICAgICAgcmV0dXJuIHsgZGF0YSwgdWwgfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGQgKHN1Z2dlc3Rpb24sIGNhdGVnb3J5RGF0YSkge1xuICAgIGNvbnN0IGNhdCA9IGdldENhdGVnb3J5KGNhdGVnb3J5RGF0YSk7XG4gICAgY29uc3QgbGkgPSB0YWcoJ2xpJywgJ3NleS1pdGVtJyk7XG4gICAgcmVuZGVySXRlbShsaSwgc3VnZ2VzdGlvbik7XG4gICAgaWYgKGhpZ2hsaWdodGVyKSB7XG4gICAgICBicmVha3VwRm9ySGlnaGxpZ2h0ZXIobGkpO1xuICAgIH1cbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnbW91c2VlbnRlcicsIGhvdmVyU3VnZ2VzdGlvbik7XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ2NsaWNrJywgY2xpY2tlZFN1Z2dlc3Rpb24pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdob3JzZXktZmlsdGVyJywgZmlsdGVySXRlbSk7XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ2hvcnNleS1oaWRlJywgaGlkZUl0ZW0pO1xuICAgIGNhdC51bC5hcHBlbmRDaGlsZChsaSk7XG4gICAgYXBpLnNvdXJjZS5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgIHJldHVybiBsaTtcblxuICAgIGZ1bmN0aW9uIGhvdmVyU3VnZ2VzdGlvbiAoKSB7XG4gICAgICBzZWxlY3QobGkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsaWNrZWRTdWdnZXN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gZ2V0VGV4dChzdWdnZXN0aW9uKTtcbiAgICAgIHNldChzdWdnZXN0aW9uKTtcbiAgICAgIGhpZGUoKTtcbiAgICAgIGF0dGFjaG1lbnQuZm9jdXMoKTtcbiAgICAgIGxhc3RQcmVmaXggPSBvLnByZWRpY3ROZXh0U2VhcmNoICYmIG8ucHJlZGljdE5leHRTZWFyY2goe1xuICAgICAgICBpbnB1dDogaW5wdXQsXG4gICAgICAgIHNvdXJjZTogYXBpLnNvdXJjZS5zbGljZSgpLFxuICAgICAgICBzZWxlY3Rpb246IHN1Z2dlc3Rpb25cbiAgICAgIH0pIHx8ICcnO1xuICAgICAgaWYgKGxhc3RQcmVmaXgpIHtcbiAgICAgICAgZWwudmFsdWUgPSBsYXN0UHJlZml4O1xuICAgICAgICBlbC5zZWxlY3QoKTtcbiAgICAgICAgc2hvdygpO1xuICAgICAgICBmaWx0ZXJpbmcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJdGVtICgpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcmVhZElucHV0KCk7XG4gICAgICBpZiAoZmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKSkge1xuICAgICAgICBsaS5jbGFzc05hbWUgPSBsaS5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1oaWRlL2csICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUobGksICdob3JzZXktaGlkZScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVJdGVtICgpIHtcbiAgICAgIGlmICghaGlkZGVuKGxpKSkge1xuICAgICAgICBsaS5jbGFzc05hbWUgKz0gJyBzZXktaGlkZSc7XG4gICAgICAgIGlmIChzZWxlY3Rpb24gPT09IGxpKSB7XG4gICAgICAgICAgdW5zZWxlY3QoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJyZWFrdXBGb3JIaWdobGlnaHRlciAoZWwpIHtcbiAgICBnZXRUZXh0Q2hpbGRyZW4oZWwpLmZvckVhY2goZWwgPT4ge1xuICAgICAgY29uc3QgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgIGNvbnN0IHRleHQgPSBlbC50ZXh0Q29udGVudCB8fCBlbC5ub2RlVmFsdWUgfHwgJyc7XG4gICAgICBpZiAodGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgY2hhciBvZiB0ZXh0KSB7XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoc3BhbkZvcihjaGFyKSwgZWwpO1xuICAgICAgfVxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgIGZ1bmN0aW9uIHNwYW5Gb3IgKGNoYXIpIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gJ3NleS1jaGFyJztcbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHNwYW4uaW5uZXJUZXh0ID0gY2hhcjtcbiAgICAgICAgcmV0dXJuIHNwYW47XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHQgKGVsLCBuZWVkbGUpIHtcbiAgICBjb25zdCByd29yZCA9IC9bXFxzLC5fXFxbXFxde30oKS1dL2c7XG4gICAgY29uc3Qgd29yZHMgPSBuZWVkbGUuc3BsaXQocndvcmQpLmZpbHRlcih3ID0+IHcubGVuZ3RoKTtcbiAgICBjb25zdCBlbGVtcyA9IFsuLi5lbC5xdWVyeVNlbGVjdG9yQWxsKCcuc2V5LWNoYXInKV07XG4gICAgbGV0IGNoYXJzO1xuICAgIGxldCBzdGFydEluZGV4ID0gMDtcblxuICAgIGJhbGFuY2UoKTtcbiAgICBpZiAoaGlnaGxpZ2h0Q29tcGxldGVXb3Jkcykge1xuICAgICAgd2hvbGUoKTtcbiAgICB9XG4gICAgZnV6enkoKTtcbiAgICBjbGVhclJlbWFpbmRlcigpO1xuXG4gICAgZnVuY3Rpb24gYmFsYW5jZSAoKSB7XG4gICAgICBjaGFycyA9IGVsZW1zLm1hcChlbCA9PiBlbC5pbm5lclRleHQgfHwgZWwudGV4dENvbnRlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdob2xlICgpIHtcbiAgICAgIGZvciAobGV0IHdvcmQgb2Ygd29yZHMpIHtcbiAgICAgICAgbGV0IHRlbXBJbmRleCA9IHN0YXJ0SW5kZXg7XG4gICAgICAgIHJldHJ5OiB3aGlsZSAodGVtcEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIGxldCBpbml0ID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgcHJldkluZGV4ID0gdGVtcEluZGV4O1xuICAgICAgICAgIGZvciAobGV0IGNoYXIgb2Ygd29yZCkge1xuICAgICAgICAgICAgY29uc3QgaSA9IGNoYXJzLmluZGV4T2YoY2hhciwgcHJldkluZGV4ICsgMSk7XG4gICAgICAgICAgICBjb25zdCBmYWlsID0gaSA9PT0gLTEgfHwgKCFpbml0ICYmIHByZXZJbmRleCArIDEgIT09IGkpO1xuICAgICAgICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgICAgICAgaW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgICB0ZW1wSW5kZXggPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZhaWwpIHtcbiAgICAgICAgICAgICAgY29udGludWUgcmV0cnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2SW5kZXggPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBlbCBvZiBlbGVtcy5zcGxpY2UodGVtcEluZGV4LCAxICsgcHJldkluZGV4IC0gdGVtcEluZGV4KSkge1xuICAgICAgICAgICAgb24oZWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBiYWxhbmNlKCk7XG4gICAgICAgICAgbmVlZGxlID0gbmVlZGxlLnJlcGxhY2Uod29yZCwgJycpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnV6enkgKCkge1xuICAgICAgZm9yIChsZXQgaW5wdXQgb2YgbmVlZGxlKSB7XG4gICAgICAgIHdoaWxlIChlbGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgZWwgPSBlbGVtcy5zaGlmdCgpO1xuICAgICAgICAgIGlmICgoZWwuaW5uZXJUZXh0IHx8IGVsLnRleHRDb250ZW50IHx8ICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpID09PSBpbnB1dC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBvbihlbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2ZmKGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhclJlbWFpbmRlciAoKSB7XG4gICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICAgIG9mZihlbGVtcy5zaGlmdCgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbiAoY2gpIHtcbiAgICAgIGNoLmNsYXNzTGlzdC5hZGQoJ3NleS1jaGFyLWhpZ2hsaWdodCcpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvZmYgKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUZXh0Q2hpbGRyZW4gKGVsKSB7XG4gICAgY29uc3QgdGV4dHMgPSBbXTtcbiAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpO1xuICAgIGxldCBub2RlO1xuICAgIHdoaWxlIChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgIHRleHRzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldCAodmFsdWUpIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIHJldHVybiAoaXNUZXh0KCkgPyBhcGkuYXBwZW5kVGV4dCA6IGFwaS5hcHBlbmRIVE1MKShnZXRWYWx1ZSh2YWx1ZSkpO1xuICAgIH1cbiAgICB1c2VyU2V0KHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlciAodmFsdWUsIHN1Z2dlc3Rpb24pIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIGNvbnN0IGlsID0gKGlzVGV4dCgpID8gYXBpLmZpbHRlckFuY2hvcmVkVGV4dCA6IGFwaS5maWx0ZXJBbmNob3JlZEhUTUwpKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgICAgIHJldHVybiBpbCA/IHVzZXJGaWx0ZXIoaWwuaW5wdXQsIGlsLnN1Z2dlc3Rpb24pIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB1c2VyRmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzVGV4dCAoKSB7IHJldHVybiBpc0lucHV0KGF0dGFjaG1lbnQpOyB9XG4gIGZ1bmN0aW9uIHZpc2libGUgKCkgeyByZXR1cm4gY29udGFpbmVyLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktc2hvdycpICE9PSAtMTsgfVxuICBmdW5jdGlvbiBoaWRkZW4gKGxpKSB7IHJldHVybiBsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSAhPT0gLTE7IH1cblxuICBmdW5jdGlvbiBzaG93ICgpIHtcbiAgICBleWUucmVmcmVzaCgpO1xuICAgIGlmICghdmlzaWJsZSgpKSB7XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgc2V5LXNob3cnO1xuICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LXNob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVyIChlKSB7XG4gICAgY29uc3QgbGVmdCA9IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5O1xuICAgIGlmIChsZWZ0ID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuOyAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgaG9uZXN0IHRvIGdvZCBsZWZ0LWNsaWNrc1xuICAgIH1cbiAgICB0b2dnbGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZSAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHNob3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdCAobGkpIHtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGlmIChsaSkge1xuICAgICAgc2VsZWN0aW9uID0gbGk7XG4gICAgICBzZWxlY3Rpb24uY2xhc3NOYW1lICs9ICcgc2V5LXNlbGVjdGVkJztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1bnNlbGVjdCAoKSB7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSA9IHNlbGVjdGlvbi5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zZWxlY3RlZC9nLCAnJyk7XG4gICAgICBzZWxlY3Rpb24gPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUgKHVwLCBtb3Zlcykge1xuICAgIGNvbnN0IHRvdGFsID0gYXBpLnNvdXJjZS5sZW5ndGg7XG4gICAgaWYgKHRvdGFsID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb3ZlcyA+IHRvdGFsKSB7XG4gICAgICB1bnNlbGVjdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjYXQgPSBmaW5kQ2F0ZWdvcnkoc2VsZWN0aW9uKSB8fCBjYXRlZ29yaWVzLmZpcnN0Q2hpbGQ7XG4gICAgY29uc3QgZmlyc3QgPSB1cCA/ICdsYXN0Q2hpbGQnIDogJ2ZpcnN0Q2hpbGQnO1xuICAgIGNvbnN0IGxhc3QgPSB1cCA/ICdmaXJzdENoaWxkJyA6ICdsYXN0Q2hpbGQnO1xuICAgIGNvbnN0IG5leHQgPSB1cCA/ICdwcmV2aW91c1NpYmxpbmcnIDogJ25leHRTaWJsaW5nJztcbiAgICBjb25zdCBwcmV2ID0gdXAgPyAnbmV4dFNpYmxpbmcnIDogJ3ByZXZpb3VzU2libGluZyc7XG4gICAgY29uc3QgbGkgPSBmaW5kTmV4dCgpO1xuICAgIHNlbGVjdChsaSk7XG5cbiAgICBpZiAoaGlkZGVuKGxpKSkge1xuICAgICAgbW92ZSh1cCwgbW92ZXMgPyBtb3ZlcyArIDEgOiAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2F0ZWdvcnkgKGVsKSB7XG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgaWYgKHNla3Rvci5tYXRjaGVzU2VsZWN0b3IoZWwucGFyZW50RWxlbWVudCwgJy5zZXktY2F0ZWdvcnknKSkge1xuICAgICAgICAgIHJldHVybiBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmROZXh0ICgpIHtcbiAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbltuZXh0XSkge1xuICAgICAgICAgIHJldHVybiBzZWxlY3Rpb25bbmV4dF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhdFtuZXh0XSAmJiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XSkge1xuICAgICAgICAgIHJldHVybiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdGVnb3JpZXNbZmlyc3RdKVtmaXJzdF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgZXllLnNsZWVwKCk7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zaG93L2csICcnKTtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1oaWRlJyk7XG4gICAgaWYgKGVsLnZhbHVlID09PSBsYXN0UHJlZml4KSB7XG4gICAgICBlbC52YWx1ZSA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGtleWRvd24gKGUpIHtcbiAgICBjb25zdCBzaG93biA9IHZpc2libGUoKTtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0RPV04pIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfVVApIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUodHJ1ZSk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0JBQ0tTUEFDRSkge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzaG93bikge1xuICAgICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoc2VsZWN0aW9uLCAnY2xpY2snKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IEtFWV9FU0MpIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgICBzdG9wKGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3AgKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QuYWRkKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcmluZyAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVib3VuY2VkTG9hZGluZyh0cnVlKTtcbiAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktZmlsdGVyJyk7XG4gICAgY29uc3QgdmFsdWUgPSByZWFkSW5wdXQoKTtcbiAgICBpZiAoIW8uYmxhbmtTZWFyY2ggJiYgIXZhbHVlKSB7XG4gICAgICBoaWRlKCk7IHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgbm9tYXRjaCA9IG5vTWF0Y2hlcyh7IHF1ZXJ5OiB2YWx1ZSB9KTtcbiAgICBsZXQgY291bnQgPSB3YWxrQ2F0ZWdvcmllcygpO1xuICAgIGlmIChjb3VudCA9PT0gMCAmJiBub21hdGNoICYmIGhhc0l0ZW1zKSB7XG4gICAgICBzaG93Tm9SZXN1bHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVOb1Jlc3VsdHMoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24pIHtcbiAgICAgIG1vdmUoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24gJiYgIW5vbWF0Y2gpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gd2Fsa0NhdGVnb3JpZXMgKCkge1xuICAgICAgbGV0IGNhdGVnb3J5ID0gY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChjYXRlZ29yeSkge1xuICAgICAgICBjb25zdCBsaXN0ID0gZmluZExpc3QoY2F0ZWdvcnkpO1xuICAgICAgICBjb25zdCBwYXJ0aWFsID0gd2Fsa0NhdGVnb3J5KGxpc3QpO1xuICAgICAgICBpZiAocGFydGlhbCA9PT0gMCkge1xuICAgICAgICAgIGNhdGVnb3J5LmNsYXNzTGlzdC5hZGQoJ3NleS1oaWRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudCArPSBwYXJ0aWFsO1xuICAgICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcnkgKHVsKSB7XG4gICAgICBsZXQgbGkgPSB1bC5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChsaSkge1xuICAgICAgICBpZiAoY291bnQgPj0gbGltaXQpIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWZpbHRlcicpO1xuICAgICAgICAgIGlmIChsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcbiAgICAgICAgICAgICAgaGlnaGxpZ2h0KGxpLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpID0gbGkubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWZlcnJlZEZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRTaG93IChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUiB8fCB3aGljaCA9PT0gS0VZX1RBQikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KHNob3csIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQgKGUpIHtcbiAgICBsZXQgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgaWYgKHRhcmdldCA9PT0gYXR0YWNobWVudCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lciB8fCB0YXJnZXQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25CbHVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25DbGljayAoZSkge1xuICAgIGlmIChhdXRvY29tcGxldGVFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbnB1dEV2ZW50cyAocmVtb3ZlKSB7XG4gICAgY29uc3Qgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGlmIChleWUpIHtcbiAgICAgIGV5ZS5kZXN0cm95KCk7XG4gICAgICBleWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoIXJlbW92ZSkge1xuICAgICAgZXllID0gYnVsbHNleWUoY29udGFpbmVyLCBhdHRhY2htZW50LCB7XG4gICAgICAgIGNhcmV0OiBhbnlJbnB1dCAmJiBhdHRhY2htZW50LnRhZ05hbWUgIT09ICdJTlBVVCcsXG4gICAgICAgIGNvbnRleHQ6IG8uYXBwZW5kVG9cbiAgICAgIH0pO1xuICAgICAgaWYgKCF2aXNpYmxlKCkpIHsgZXllLnNsZWVwKCk7IH1cbiAgICB9XG4gICAgaWYgKHJlbW92ZSB8fCAoYW55SW5wdXQgJiYgZG9jLmFjdGl2ZUVsZW1lbnQgIT09IGF0dGFjaG1lbnQpKSB7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdmb2N1cycsIGxvYWRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkaW5nKCk7XG4gICAgfVxuICAgIGlmIChhbnlJbnB1dCkge1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZFNob3cpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZEZpbHRlcmluZyk7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywgZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ3Bhc3RlJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGtleWRvd24pO1xuICAgICAgaWYgKG8uYXV0b0hpZGVPbkJsdXIpIHsgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGhpZGVPbkJsdXIpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2NsaWNrJywgdG9nZ2xlcik7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGRvY0VsZW1lbnQsICdrZXlkb3duJywga2V5ZG93bik7XG4gICAgfVxuICAgIGlmIChvLmF1dG9IaWRlT25DbGljaykgeyBjcm9zc3ZlbnRbb3BdKGRvYywgJ2NsaWNrJywgaGlkZU9uQ2xpY2spOyB9XG4gICAgaWYgKGZvcm0pIHsgY3Jvc3N2ZW50W29wXShmb3JtLCAnc3VibWl0JywgaGlkZSk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGlmIChwYXJlbnQuY29udGFpbnMoY29udGFpbmVyKSkgeyBwYXJlbnQucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFNldHRlciAodmFsdWUpIHtcbiAgICBpZiAodGV4dElucHV0KSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyA9PT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnZhbHVlID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XG4gICAgICAgIGVsLmlubmVySFRNTCArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRJdGVtUmVuZGVyZXIgKGxpLCBzdWdnZXN0aW9uKSB7XG4gICAgdGV4dChsaSwgZ2V0VGV4dChzdWdnZXN0aW9uKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlciAoZGl2LCBkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgIT09ICdkZWZhdWx0Jykge1xuICAgICAgY29uc3QgaWQgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcnktaWQnKTtcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChpZCk7XG4gICAgICB0ZXh0KGlkLCBkYXRhLmlkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0RmlsdGVyIChxLCBzdWdnZXN0aW9uKSB7XG4gICAgY29uc3QgbmVlZGxlID0gcS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHRleHQgPSBnZXRUZXh0KHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmIChmdXp6eXNlYXJjaChuZWVkbGUsIHRleHQudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmdXp6eXNlYXJjaChuZWVkbGUsIHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9vcGJhY2tUb0FuY2hvciAodGV4dCwgcCkge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBsZXQgYW5jaG9yZWQgPSBmYWxzZTtcbiAgICBsZXQgc3RhcnQgPSBwLnN0YXJ0O1xuICAgIHdoaWxlIChhbmNob3JlZCA9PT0gZmFsc2UgJiYgc3RhcnQgPj0gMCkge1xuICAgICAgcmVzdWx0ID0gdGV4dC5zdWJzdHIoc3RhcnQgLSAxLCBwLnN0YXJ0IC0gc3RhcnQgKyAxKTtcbiAgICAgIGFuY2hvcmVkID0gcmFuY2hvcmxlZnQudGVzdChyZXN1bHQpO1xuICAgICAgc3RhcnQtLTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQ6IGFuY2hvcmVkID8gcmVzdWx0IDogbnVsbCxcbiAgICAgIHN0YXJ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkVGV4dCAocSwgc3VnZ2VzdGlvbikge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gc2VsbChlbCk7XG4gICAgY29uc3QgaW5wdXQgPSBsb29wYmFja1RvQW5jaG9yKHEsIHBvc2l0aW9uKS50ZXh0O1xuICAgIGlmIChpbnB1dCkge1xuICAgICAgcmV0dXJuIHsgaW5wdXQsIHN1Z2dlc3Rpb24gfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRUZXh0ICh2YWx1ZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBlbC52YWx1ZTtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHNlbGwoZWwpO1xuICAgIGNvbnN0IGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihjdXJyZW50LCBwb3NpdGlvbik7XG4gICAgY29uc3QgbGVmdCA9IGN1cnJlbnQuc3Vic3RyKDAsIGlucHV0LnN0YXJ0KTtcbiAgICBjb25zdCByaWdodCA9IGN1cnJlbnQuc3Vic3RyKGlucHV0LnN0YXJ0ICsgaW5wdXQudGV4dC5sZW5ndGggKyAocG9zaXRpb24uZW5kIC0gcG9zaXRpb24uc3RhcnQpKTtcbiAgICBjb25zdCBiZWZvcmUgPSBsZWZ0ICsgdmFsdWUgKyAnICc7XG5cbiAgICBlbC52YWx1ZSA9IGJlZm9yZSArIHJpZ2h0O1xuICAgIHNlbGwoZWwsIHsgc3RhcnQ6IGJlZm9yZS5sZW5ndGgsIGVuZDogYmVmb3JlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkSFRNTCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEhUTUwgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW5jaG9yaW5nIGluIGVkaXRhYmxlIGVsZW1lbnRzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQuJyk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kTGlzdCAoY2F0ZWdvcnkpIHsgcmV0dXJuIHNla3RvcignLnNleS1saXN0JywgY2F0ZWdvcnkpWzBdOyB9XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQgKGVsKSB7IHJldHVybiBlbC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQSc7IH1cblxuZnVuY3Rpb24gdGFnICh0eXBlLCBjbGFzc05hbWUpIHtcbiAgY29uc3QgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGRlZmVyIChmbikgeyByZXR1cm4gZnVuY3Rpb24gKCkgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTsgfVxuZnVuY3Rpb24gdGV4dCAoZWwsIHZhbHVlKSB7IGVsLmlubmVyVGV4dCA9IGVsLnRleHRDb250ZW50ID0gdmFsdWU7IH1cblxuZnVuY3Rpb24gaXNFZGl0YWJsZSAoZWwpIHtcbiAgY29uc3QgdmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnRFZGl0YWJsZScpO1xuICBpZiAodmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHZhbHVlID09PSAndHJ1ZScpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoZWwucGFyZW50RWxlbWVudCkge1xuICAgIHJldHVybiBpc0VkaXRhYmxlKGVsLnBhcmVudEVsZW1lbnQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob3JzZXk7XG4iXX0=
},{"bullseye":"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\bullseye.js","contra/emitter":"J:\\Dev\\Work\\horsey\\node_modules\\contra\\emitter.js","crossvent":"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\crossvent.js","fuzzysearch":"J:\\Dev\\Work\\horsey\\node_modules\\fuzzysearch\\index.js","hash-sum":"J:\\Dev\\Work\\horsey\\node_modules\\hash-sum\\hash-sum.js","lodash/debounce":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\debounce.js","sektor":"J:\\Dev\\Work\\horsey\\node_modules\\sektor\\src\\sektor.js","sell":"J:\\Dev\\Work\\horsey\\node_modules\\sell\\sell.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\atoa\\atoa.js":[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\bullseye.js":[function(require,module,exports){
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

},{"./tailormade":"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\tailormade.js","./throttle":"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\throttle.js","crossvent":"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\crossvent.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\tailormade.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9idWxsc2V5ZS90YWlsb3JtYWRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIHNlbGwgPSByZXF1aXJlKCdzZWxsJyk7XG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgc2VsZWNjaW9uID0gcmVxdWlyZSgnc2VsZWNjaW9uJyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG52YXIgZ2V0U2VsZWN0aW9uID0gc2VsZWNjaW9uLmdldDtcbnZhciBwcm9wcyA9IFtcbiAgJ2RpcmVjdGlvbicsXG4gICdib3hTaXppbmcnLFxuICAnd2lkdGgnLFxuICAnaGVpZ2h0JyxcbiAgJ292ZXJmbG93WCcsXG4gICdvdmVyZmxvd1knLFxuICAnYm9yZGVyVG9wV2lkdGgnLFxuICAnYm9yZGVyUmlnaHRXaWR0aCcsXG4gICdib3JkZXJCb3R0b21XaWR0aCcsXG4gICdib3JkZXJMZWZ0V2lkdGgnLFxuICAncGFkZGluZ1RvcCcsXG4gICdwYWRkaW5nUmlnaHQnLFxuICAncGFkZGluZ0JvdHRvbScsXG4gICdwYWRkaW5nTGVmdCcsXG4gICdmb250U3R5bGUnLFxuICAnZm9udFZhcmlhbnQnLFxuICAnZm9udFdlaWdodCcsXG4gICdmb250U3RyZXRjaCcsXG4gICdmb250U2l6ZScsXG4gICdmb250U2l6ZUFkanVzdCcsXG4gICdsaW5lSGVpZ2h0JyxcbiAgJ2ZvbnRGYW1pbHknLFxuICAndGV4dEFsaWduJyxcbiAgJ3RleHRUcmFuc2Zvcm0nLFxuICAndGV4dEluZGVudCcsXG4gICd0ZXh0RGVjb3JhdGlvbicsXG4gICdsZXR0ZXJTcGFjaW5nJyxcbiAgJ3dvcmRTcGFjaW5nJ1xuXTtcbnZhciB3aW4gPSBnbG9iYWw7XG52YXIgZG9jID0gZG9jdW1lbnQ7XG52YXIgZmYgPSB3aW4ubW96SW5uZXJTY3JlZW5YICE9PSBudWxsICYmIHdpbi5tb3pJbm5lclNjcmVlblggIT09IHZvaWQgMDtcblxuZnVuY3Rpb24gdGFpbG9ybWFkZSAoZWwsIG9wdGlvbnMpIHtcbiAgdmFyIHRleHRJbnB1dCA9IGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbiAgdmFyIHRocm90dGxlZFJlZnJlc2ggPSB0aHJvdHRsZShyZWZyZXNoLCAzMCk7XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcblxuICBiaW5kKCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZWFkOiByZWFkUG9zaXRpb24sXG4gICAgcmVmcmVzaDogdGhyb3R0bGVkUmVmcmVzaCxcbiAgICBkZXN0cm95OiBkZXN0cm95XG4gIH07XG5cbiAgZnVuY3Rpb24gbm9vcCAoKSB7fVxuICBmdW5jdGlvbiByZWFkUG9zaXRpb24gKCkgeyByZXR1cm4gKHRleHRJbnB1dCA/IGNvb3Jkc1RleHQgOiBjb29yZHNIVE1MKSgpOyB9XG5cbiAgZnVuY3Rpb24gcmVmcmVzaCAoKSB7XG4gICAgaWYgKG8uc2xlZXBpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIChvLnVwZGF0ZSB8fCBub29wKShyZWFkUG9zaXRpb24oKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb29yZHNUZXh0ICgpIHtcbiAgICB2YXIgcCA9IHNlbGwoZWwpO1xuICAgIHZhciBjb250ZXh0ID0gcHJlcGFyZSgpO1xuICAgIHZhciByZWFkaW5ncyA9IHJlYWRUZXh0Q29vcmRzKGNvbnRleHQsIHAuc3RhcnQpO1xuICAgIGRvYy5ib2R5LnJlbW92ZUNoaWxkKGNvbnRleHQubWlycm9yKTtcbiAgICByZXR1cm4gcmVhZGluZ3M7XG4gIH1cblxuICBmdW5jdGlvbiBjb29yZHNIVE1MICgpIHtcbiAgICB2YXIgc2VsID0gZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKHNlbC5yYW5nZUNvdW50KSB7XG4gICAgICB2YXIgcmFuZ2UgPSBzZWwuZ2V0UmFuZ2VBdCgwKTtcbiAgICAgIHZhciBuZWVkc1RvV29ya0Fyb3VuZE5ld2xpbmVCdWcgPSByYW5nZS5zdGFydENvbnRhaW5lci5ub2RlTmFtZSA9PT0gJ1AnICYmIHJhbmdlLnN0YXJ0T2Zmc2V0ID09PSAwO1xuICAgICAgaWYgKG5lZWRzVG9Xb3JrQXJvdW5kTmV3bGluZUJ1Zykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm9mZnNldExlZnQsXG4gICAgICAgICAgeTogcmFuZ2Uuc3RhcnRDb250YWluZXIub2Zmc2V0VG9wLFxuICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAocmFuZ2UuZ2V0Q2xpZW50UmVjdHMpIHtcbiAgICAgICAgdmFyIHJlY3RzID0gcmFuZ2UuZ2V0Q2xpZW50UmVjdHMoKTtcbiAgICAgICAgaWYgKHJlY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcmVjdHNbMF0ubGVmdCxcbiAgICAgICAgICAgIHk6IHJlY3RzWzBdLnRvcCxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB4OiAwLCB5OiAwIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVGV4dENvb3JkcyAoY29udGV4dCwgcCkge1xuICAgIHZhciByZXN0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgbWlycm9yID0gY29udGV4dC5taXJyb3I7XG4gICAgdmFyIGNvbXB1dGVkID0gY29udGV4dC5jb21wdXRlZDtcblxuICAgIHdyaXRlKG1pcnJvciwgcmVhZChlbCkuc3Vic3RyaW5nKDAsIHApKTtcblxuICAgIGlmIChlbC50YWdOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICBtaXJyb3IudGV4dENvbnRlbnQgPSBtaXJyb3IudGV4dENvbnRlbnQucmVwbGFjZSgvXFxzL2csICdcXHUwMGEwJyk7XG4gICAgfVxuXG4gICAgd3JpdGUocmVzdCwgcmVhZChlbCkuc3Vic3RyaW5nKHApIHx8ICcuJyk7XG5cbiAgICBtaXJyb3IuYXBwZW5kQ2hpbGQocmVzdCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVzdC5vZmZzZXRMZWZ0ICsgcGFyc2VJbnQoY29tcHV0ZWRbJ2JvcmRlckxlZnRXaWR0aCddKSxcbiAgICAgIHk6IHJlc3Qub2Zmc2V0VG9wICsgcGFyc2VJbnQoY29tcHV0ZWRbJ2JvcmRlclRvcFdpZHRoJ10pXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGVsKSB7XG4gICAgcmV0dXJuIHRleHRJbnB1dCA/IGVsLnZhbHVlIDogZWwuaW5uZXJIVE1MO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJlcGFyZSAoKSB7XG4gICAgdmFyIGNvbXB1dGVkID0gd2luLmdldENvbXB1dGVkU3R5bGUgPyBnZXRDb21wdXRlZFN0eWxlKGVsKSA6IGVsLmN1cnJlbnRTdHlsZTtcbiAgICB2YXIgbWlycm9yID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzdHlsZSA9IG1pcnJvci5zdHlsZTtcblxuICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKG1pcnJvcik7XG5cbiAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ0lOUFVUJykge1xuICAgICAgc3R5bGUud29yZFdyYXAgPSAnYnJlYWstd29yZCc7XG4gICAgfVxuICAgIHN0eWxlLndoaXRlU3BhY2UgPSAncHJlLXdyYXAnO1xuICAgIHN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgcHJvcHMuZm9yRWFjaChjb3B5KTtcblxuICAgIGlmIChmZikge1xuICAgICAgc3R5bGUud2lkdGggPSBwYXJzZUludChjb21wdXRlZC53aWR0aCkgLSAyICsgJ3B4JztcbiAgICAgIGlmIChlbC5zY3JvbGxIZWlnaHQgPiBwYXJzZUludChjb21wdXRlZC5oZWlnaHQpKSB7XG4gICAgICAgIHN0eWxlLm92ZXJmbG93WSA9ICdzY3JvbGwnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgIH1cbiAgICByZXR1cm4geyBtaXJyb3I6IG1pcnJvciwgY29tcHV0ZWQ6IGNvbXB1dGVkIH07XG5cbiAgICBmdW5jdGlvbiBjb3B5IChwcm9wKSB7XG4gICAgICBzdHlsZVtwcm9wXSA9IGNvbXB1dGVkW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlIChlbCwgdmFsdWUpIHtcbiAgICBpZiAodGV4dElucHV0KSB7XG4gICAgICBlbC50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBiaW5kIChyZW1vdmUpIHtcbiAgICB2YXIgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdrZXlkb3duJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2tleXVwJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2lucHV0JywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ3Bhc3RlJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2NoYW5nZScsIHRocm90dGxlZFJlZnJlc2gpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgYmluZCh0cnVlKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRhaWxvcm1hZGU7XG4iXX0=
},{"./throttle":"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\throttle.js","crossvent":"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\crossvent.js","seleccion":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\seleccion.js","sell":"J:\\Dev\\Work\\horsey\\node_modules\\sell\\sell.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\bullseye\\throttle.js":[function(require,module,exports){
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

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\contra\\debounce.js":[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":"J:\\Dev\\Work\\horsey\\node_modules\\ticky\\ticky-browser.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\contra\\emitter.js":[function(require,module,exports){
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

},{"./debounce":"J:\\Dev\\Work\\horsey\\node_modules\\contra\\debounce.js","atoa":"J:\\Dev\\Work\\horsey\\node_modules\\atoa\\atoa.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\crossvent.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9jcm9zc3ZlbnQvc3JjL2Nyb3NzdmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBjdXN0b21FdmVudCA9IHJlcXVpcmUoJ2N1c3RvbS1ldmVudCcpO1xudmFyIGV2ZW50bWFwID0gcmVxdWlyZSgnLi9ldmVudG1hcCcpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBsaXN0ZW5lciA9IHVud3JhcChlbCwgdHlwZSwgZm4pO1xuICBpZiAobGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUsIG1vZGVsKSB7XG4gIHZhciBlID0gZXZlbnRtYXAuaW5kZXhPZih0eXBlKSA9PT0gLTEgPyBtYWtlQ3VzdG9tRXZlbnQoKSA6IG1ha2VDbGFzc2ljRXZlbnQoKTtcbiAgaWYgKGVsLmRpc3BhdGNoRXZlbnQpIHtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUNsYXNzaWNFdmVudCAoKSB7XG4gICAgdmFyIGU7XG4gICAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiBlO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDdXN0b21FdmVudCAoKSB7XG4gICAgcmV0dXJuIG5ldyBjdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogbW9kZWwgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZS53aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG4iXX0=
},{"./eventmap":"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\eventmap.js","custom-event":"J:\\Dev\\Work\\horsey\\node_modules\\custom-event\\index.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\crossvent\\src\\eventmap.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9jcm9zc3ZlbnQvc3JjL2V2ZW50bWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBldmVudG1hcCA9IFtdO1xudmFyIGV2ZW50bmFtZSA9ICcnO1xudmFyIHJvbiA9IC9eb24vO1xuXG5mb3IgKGV2ZW50bmFtZSBpbiBnbG9iYWwpIHtcbiAgaWYgKHJvbi50ZXN0KGV2ZW50bmFtZSkpIHtcbiAgICBldmVudG1hcC5wdXNoKGV2ZW50bmFtZS5zbGljZSgyKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudG1hcDtcbiJdfQ==
},{}],"J:\\Dev\\Work\\horsey\\node_modules\\custom-event\\index.js":[function(require,module,exports){
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
'function' === typeof document.createEvent ? function CustomEvent (type, params) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9jdXN0b20tZXZlbnQvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBOYXRpdmVDdXN0b21FdmVudCA9IGdsb2JhbC5DdXN0b21FdmVudDtcblxuZnVuY3Rpb24gdXNlTmF0aXZlICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcCA9IG5ldyBOYXRpdmVDdXN0b21FdmVudCgnY2F0JywgeyBkZXRhaWw6IHsgZm9vOiAnYmFyJyB9IH0pO1xuICAgIHJldHVybiAgJ2NhdCcgPT09IHAudHlwZSAmJiAnYmFyJyA9PT0gcC5kZXRhaWwuZm9vO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyb3NzLWJyb3dzZXIgYEN1c3RvbUV2ZW50YCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQuQ3VzdG9tRXZlbnRcbiAqXG4gKiBAcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VOYXRpdmUoKSA/IE5hdGl2ZUN1c3RvbUV2ZW50IDpcblxuLy8gSUUgPj0gOVxuJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID8gZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgfSBlbHNlIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIHZvaWQgMCk7XG4gIH1cbiAgcmV0dXJuIGU7XG59IDpcblxuLy8gSUUgPD0gOFxuZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gIGUudHlwZSA9IHR5cGU7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmJ1YmJsZXMgPSBCb29sZWFuKHBhcmFtcy5idWJibGVzKTtcbiAgICBlLmNhbmNlbGFibGUgPSBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKTtcbiAgICBlLmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gIH0gZWxzZSB7XG4gICAgZS5idWJibGVzID0gZmFsc2U7XG4gICAgZS5jYW5jZWxhYmxlID0gZmFsc2U7XG4gICAgZS5kZXRhaWwgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iXX0=
},{}],"J:\\Dev\\Work\\horsey\\node_modules\\fuzzysearch\\index.js":[function(require,module,exports){
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

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\hash-sum\\hash-sum.js":[function(require,module,exports){
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
  if (typeof value === 'object') {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, '[Circular]' + key);
    }
    seen.push(value);
    return foldObject(hash, value, seen);
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

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\debounce.js":[function(require,module,exports){
var isObject = require('./isObject'),
    now = require('./now'),
    toNumber = require('./toNumber');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide an options object to indicate whether `func` should be invoked on
 * the leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent calls
 * to the debounced function return the result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the debounced function is
 * invoked more than once during the `wait` timeout.
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
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
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

},{"./isObject":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObject.js","./now":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\now.js","./toNumber":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\toNumber.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isFunction.js":[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"./isObject":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObject.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObject.js":[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObjectLike.js":[function(require,module,exports){
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
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isSymbol.js":[function(require,module,exports){
var isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

module.exports = isSymbol;

},{"./isObjectLike":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObjectLike.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\now.js":[function(require,module,exports){
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
function now() {
  return Date.now();
}

module.exports = now;

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\toNumber.js":[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObject = require('./isObject'),
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
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
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

},{"./isFunction":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isFunction.js","./isObject":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isObject.js","./isSymbol":"J:\\Dev\\Work\\horsey\\node_modules\\lodash\\isSymbol.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\sektor\\src\\sektor.js":[function(require,module,exports){
(function (global){
'use strict';

var expando = 'sektor-' + Date.now();
var rsiblings = /[+~]/;
var document = global.document;
var del = document.documentElement || {};
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWt0b3Ivc3JjL3Nla3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBleHBhbmRvID0gJ3Nla3Rvci0nICsgRGF0ZS5ub3coKTtcbnZhciByc2libGluZ3MgPSAvWyt+XS87XG52YXIgZG9jdW1lbnQgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgZGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHt9O1xudmFyIG1hdGNoID0gKFxuICBkZWwubWF0Y2hlcyB8fFxuICBkZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm9NYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIG5ldmVyXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNla3Rvcjtcblxuc2VrdG9yLm1hdGNoZXMgPSBtYXRjaGVzO1xuc2VrdG9yLm1hdGNoZXNTZWxlY3RvciA9IG1hdGNoZXNTZWxlY3RvcjtcblxuZnVuY3Rpb24gcXNhIChzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgZXhpc3RlZCwgaWQsIHByZWZpeCwgcHJlZml4ZWQsIGFkYXB0ZXIsIGhhY2sgPSBjb250ZXh0ICE9PSBkb2N1bWVudDtcbiAgaWYgKGhhY2spIHsgLy8gaWQgaGFjayBmb3IgY29udGV4dC1yb290ZWQgcXVlcmllc1xuICAgIGV4aXN0ZWQgPSBjb250ZXh0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICBpZCA9IGV4aXN0ZWQgfHwgZXhwYW5kbztcbiAgICBwcmVmaXggPSAnIycgKyBpZCArICcgJztcbiAgICBwcmVmaXhlZCA9IHByZWZpeCArIHNlbGVjdG9yLnJlcGxhY2UoLywvZywgJywnICsgcHJlZml4KTtcbiAgICBhZGFwdGVyID0gcnNpYmxpbmdzLnRlc3Qoc2VsZWN0b3IpICYmIGNvbnRleHQucGFyZW50Tm9kZTtcbiAgICBpZiAoIWV4aXN0ZWQpIHsgY29udGV4dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpOyB9XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gKGFkYXB0ZXIgfHwgY29udGV4dCkucXVlcnlTZWxlY3RvckFsbChwcmVmaXhlZCB8fCBzZWxlY3Rvcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGV4aXN0ZWQgPT09IG51bGwpIHsgY29udGV4dC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZWt0b3IgKHNlbGVjdG9yLCBjdHgsIGNvbGxlY3Rpb24sIHNlZWQpIHtcbiAgdmFyIGVsZW1lbnQ7XG4gIHZhciBjb250ZXh0ID0gY3R4IHx8IGRvY3VtZW50O1xuICB2YXIgcmVzdWx0cyA9IGNvbGxlY3Rpb24gfHwgW107XG4gIHZhciBpID0gMDtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBpZiAoY29udGV4dC5ub2RlVHlwZSAhPT0gMSAmJiBjb250ZXh0Lm5vZGVUeXBlICE9PSA5KSB7XG4gICAgcmV0dXJuIFtdOyAvLyBiYWlsIGlmIGNvbnRleHQgaXMgbm90IGFuIGVsZW1lbnQgb3IgZG9jdW1lbnRcbiAgfVxuICBpZiAoc2VlZCkge1xuICAgIHdoaWxlICgoZWxlbWVudCA9IHNlZWRbaSsrXSkpIHtcbiAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIHFzYShzZWxlY3RvciwgY29udGV4dCkpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzIChzZWxlY3RvciwgZWxlbWVudHMpIHtcbiAgcmV0dXJuIHNla3RvcihzZWxlY3RvciwgbnVsbCwgbnVsbCwgZWxlbWVudHMpO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IgKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gIHJldHVybiBtYXRjaC5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gbmV2ZXIgKCkgeyByZXR1cm4gZmFsc2U7IH1cbiJdfQ==
},{}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelection.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL2dldFNlbGVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb247XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGdldFNlbGVjdGlvblJhdyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uUmF3Jyk7XG52YXIgZ2V0U2VsZWN0aW9uTnVsbE9wID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25OdWxsT3AnKTtcbnZhciBnZXRTZWxlY3Rpb25TeW50aGV0aWMgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblN5bnRoZXRpYycpO1xudmFyIGlzSG9zdCA9IHJlcXVpcmUoJy4vaXNIb3N0Jyk7XG5pZiAoaXNIb3N0Lm1ldGhvZChnbG9iYWwsICdnZXRTZWxlY3Rpb24nKSkge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25SYXc7XG59IGVsc2UgaWYgKHR5cGVvZiBkb2Muc2VsZWN0aW9uID09PSAnb2JqZWN0JyAmJiBkb2Muc2VsZWN0aW9uKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblN5bnRoZXRpYztcbn0gZWxzZSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbk51bGxPcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iXX0=
},{"./getSelectionNullOp":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionNullOp.js","./getSelectionRaw":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionRaw.js","./getSelectionSynthetic":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionSynthetic.js","./isHost":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\isHost.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionNullOp.js":[function(require,module,exports){
'use strict';

function noop () {}

function getSelectionNullOp () {
  return {
    removeAllRanges: noop,
    addRange: noop
  };
}

module.exports = getSelectionNullOp;

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionRaw.js":[function(require,module,exports){
(function (global){
'use strict';

function getSelectionRaw () {
  return global.getSelection();
}

module.exports = getSelectionRaw;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL2dldFNlbGVjdGlvblJhdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25SYXcgKCkge1xuICByZXR1cm4gZ2xvYmFsLmdldFNlbGVjdGlvbigpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFNlbGVjdGlvblJhdztcbiJdfQ==
},{}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelectionSynthetic.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL2dldFNlbGVjdGlvblN5bnRoZXRpYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG52YXIgR2V0U2VsZWN0aW9uUHJvdG8gPSBHZXRTZWxlY3Rpb24ucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBHZXRTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciByYW5nZSA9IHNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuXG4gIHRoaXMuX3NlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgdGhpcy5fcmFuZ2VzID0gW107XG5cbiAgaWYgKHNlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbGYpO1xuICB9IGVsc2UgaWYgKGlzVGV4dFJhbmdlKHJhbmdlKSkge1xuICAgIHVwZGF0ZUZyb21UZXh0UmFuZ2Uoc2VsZiwgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbGYpO1xuICB9XG59XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZUFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRleHRSYW5nZTtcbiAgdHJ5IHtcbiAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgIT09ICdOb25lJykge1xuICAgICAgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgIHRleHRSYW5nZS5zZWxlY3QoKTtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5lbXB0eSgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uYWRkUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZSk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShyYW5nZSkuc2VsZWN0KCk7XG4gICAgdGhpcy5fcmFuZ2VzWzBdID0gcmFuZ2U7XG4gICAgdGhpcy5yYW5nZUNvdW50ID0gMTtcbiAgICB0aGlzLmlzQ29sbGFwc2VkID0gdGhpcy5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZSh0aGlzLCByYW5nZSwgZmFsc2UpO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRSYW5nZXMgPSBmdW5jdGlvbiAocmFuZ2VzKSB7XG4gIHRoaXMucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHZhciByYW5nZUNvdW50ID0gcmFuZ2VzLmxlbmd0aDtcbiAgaWYgKHJhbmdlQ291bnQgPiAxKSB7XG4gICAgY3JlYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZXMpO1xuICB9IGVsc2UgaWYgKHJhbmdlQ291bnQpIHtcbiAgICB0aGlzLmFkZFJhbmdlKHJhbmdlc1swXSk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldFJhbmdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnJhbmdlQ291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFJhbmdlQXQoKTogaW5kZXggb3V0IG9mIGJvdW5kcycpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9yYW5nZXNbaW5kZXhdLmNsb25lUmFuZ2UoKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8ucmVtb3ZlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnQ29udHJvbCcpIHtcbiAgICByZW1vdmVSYW5nZU1hbnVhbGx5KHRoaXMsIHJhbmdlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHRoaXMuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgcmFuZ2VFbGVtZW50ID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZSk7XG4gIHZhciBuZXdDb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICB2YXIgZWw7XG4gIHZhciByZW1vdmVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGNvbnRyb2xSYW5nZS5pdGVtKGkpO1xuICAgIGlmIChlbCAhPT0gcmFuZ2VFbGVtZW50IHx8IHJlbW92ZWQpIHtcbiAgICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgbmV3Q29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZWFjaFJhbmdlID0gZnVuY3Rpb24gKGZuLCByZXR1cm5WYWx1ZSkge1xuICB2YXIgaSA9IDA7XG4gIHZhciBsZW4gPSB0aGlzLl9yYW5nZXMubGVuZ3RoO1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoZm4odGhpcy5nZXRSYW5nZUF0KGkpKSkge1xuICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZ2V0QWxsUmFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmFuZ2VzID0gW107XG4gIHRoaXMuZWFjaFJhbmdlKGZ1bmN0aW9uIChyYW5nZSkge1xuICAgIHJhbmdlcy5wdXNoKHJhbmdlKTtcbiAgfSk7XG4gIHJldHVybiByYW5nZXM7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRTaW5nbGVSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB0aGlzLmFkZFJhbmdlKHJhbmdlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2VzKSB7XG4gIHZhciBjb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICBmb3IgKHZhciBpID0gMCwgZWwsIGxlbiA9IHJhbmdlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGVsID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZXNbaV0pO1xuICAgIHRyeSB7XG4gICAgICBjb250cm9sUmFuZ2UuYWRkKGVsKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFJhbmdlcygpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICAgIH1cbiAgfVxuICBjb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmFuZ2VNYW51YWxseSAoc2VsLCByYW5nZSkge1xuICB2YXIgcmFuZ2VzID0gc2VsLmdldEFsbFJhbmdlcygpO1xuICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzU2FtZVJhbmdlKHJhbmdlLCByYW5nZXNbaV0pKSB7XG4gICAgICBzZWwuYWRkUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWwucmFuZ2VDb3VudCkge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGFuY2hvclByZWZpeCA9ICdzdGFydCc7XG4gIHZhciBmb2N1c1ByZWZpeCA9ICdlbmQnO1xuICBzZWwuYW5jaG9yTm9kZSA9IHJhbmdlW2FuY2hvclByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHJhbmdlW2FuY2hvclByZWZpeCArICdPZmZzZXQnXTtcbiAgc2VsLmZvY3VzTm9kZSA9IHJhbmdlW2ZvY3VzUHJlZml4ICsgJ0NvbnRhaW5lciddO1xuICBzZWwuZm9jdXNPZmZzZXQgPSByYW5nZVtmb2N1c1ByZWZpeCArICdPZmZzZXQnXTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW1wdHlTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuYW5jaG9yTm9kZSA9IHNlbC5mb2N1c05vZGUgPSBudWxsO1xuICBzZWwuYW5jaG9yT2Zmc2V0ID0gc2VsLmZvY3VzT2Zmc2V0ID0gMDtcbiAgc2VsLnJhbmdlQ291bnQgPSAwO1xuICBzZWwuaXNDb2xsYXBzZWQgPSB0cnVlO1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiByYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudCAocmFuZ2VOb2Rlcykge1xuICBpZiAoIXJhbmdlTm9kZXMubGVuZ3RoIHx8IHJhbmdlTm9kZXNbMF0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IHJhbmdlTm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzQW5jZXN0b3JPZihyYW5nZU5vZGVzWzBdLCByYW5nZU5vZGVzW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZSAocmFuZ2UpIHtcbiAgdmFyIG5vZGVzID0gcmFuZ2UuZ2V0Tm9kZXMoKTtcbiAgaWYgKCFyYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudChub2RlcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UoKTogcmFuZ2UgZGlkIG5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gbm9kZXNbMF07XG59XG5cbmZ1bmN0aW9uIGlzVGV4dFJhbmdlIChyYW5nZSkge1xuICByZXR1cm4gcmFuZ2UgJiYgcmFuZ2UudGV4dCAhPT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tVGV4dFJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHNlbC5fcmFuZ2VzID0gW3JhbmdlXTtcbiAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2Uoc2VsLCByYW5nZSwgZmFsc2UpO1xuICBzZWwucmFuZ2VDb3VudCA9IDE7XG4gIHNlbC5pc0NvbGxhcHNlZCA9IHJhbmdlLmNvbGxhcHNlZDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29udHJvbFNlbGVjdGlvbiAoc2VsKSB7XG4gIHNlbC5fcmFuZ2VzLmxlbmd0aCA9IDA7XG4gIGlmIChzZWwuX3NlbGVjdGlvbi50eXBlID09PSAnTm9uZScpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250cm9sUmFuZ2UgPSBzZWwuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgIGlmIChpc1RleHRSYW5nZShjb250cm9sUmFuZ2UpKSB7XG4gICAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbCwgY29udHJvbFJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsLnJhbmdlQ291bnQgPSBjb250cm9sUmFuZ2UubGVuZ3RoO1xuICAgICAgdmFyIHJhbmdlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VDb3VudDsgKytpKSB7XG4gICAgICAgIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGUoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgICAgICBzZWwuX3Jhbmdlcy5wdXNoKHJhbmdlKTtcbiAgICAgIH1cbiAgICAgIHNlbC5pc0NvbGxhcHNlZCA9IHNlbC5yYW5nZUNvdW50ID09PSAxICYmIHNlbC5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICAgIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgc2VsLl9yYW5nZXNbc2VsLnJhbmdlQ291bnQgLSAxXSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbiAoc2VsLCByYW5nZSkge1xuICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICB9XG4gIHRyeSB7XG4gICAgbmV3Q29udHJvbFJhbmdlLmFkZChyYW5nZUVsZW1lbnQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRSYW5nZSgpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWwpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVSYW5nZSAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIChcbiAgICBsZWZ0LnN0YXJ0Q29udGFpbmVyID09PSByaWdodC5zdGFydENvbnRhaW5lciAmJlxuICAgIGxlZnQuc3RhcnRPZmZzZXQgPT09IHJpZ2h0LnN0YXJ0T2Zmc2V0ICYmXG4gICAgbGVmdC5lbmRDb250YWluZXIgPT09IHJpZ2h0LmVuZENvbnRhaW5lciAmJlxuICAgIGxlZnQuZW5kT2Zmc2V0ID09PSByaWdodC5lbmRPZmZzZXRcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNBbmNlc3Rvck9mIChhbmNlc3RvciwgZGVzY2VuZGFudCkge1xuICB2YXIgbm9kZSA9IGRlc2NlbmRhbnQ7XG4gIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlID09PSBhbmNlc3Rvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEdldFNlbGVjdGlvbihnbG9iYWwuZG9jdW1lbnQuc2VsZWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iXX0=
},{"./rangeToTextRange":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\rangeToTextRange.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\isHost.js":[function(require,module,exports){
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

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\rangeToTextRange.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL3JhbmdlVG9UZXh0UmFuZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xuXG5mdW5jdGlvbiByYW5nZVRvVGV4dFJhbmdlIChwKSB7XG4gIGlmIChwLmNvbGxhcHNlZCkge1xuICAgIHJldHVybiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuc3RhcnRDb250YWluZXIsIG9mZnNldDogcC5zdGFydE9mZnNldCB9LCB0cnVlKTtcbiAgfVxuICB2YXIgc3RhcnRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB2YXIgZW5kUmFuZ2UgPSBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuZW5kQ29udGFpbmVyLCBvZmZzZXQ6IHAuZW5kT2Zmc2V0IH0sIGZhbHNlKTtcbiAgdmFyIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnU3RhcnRUb1N0YXJ0Jywgc3RhcnRSYW5nZSk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnRW5kVG9FbmQnLCBlbmRSYW5nZSk7XG4gIHJldHVybiB0ZXh0UmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyRGF0YU5vZGUgKG5vZGUpIHtcbiAgdmFyIHQgPSBub2RlLm5vZGVUeXBlO1xuICByZXR1cm4gdCA9PT0gMyB8fCB0ID09PSA0IHx8IHQgPT09IDggO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSAocCwgc3RhcnRpbmcpIHtcbiAgdmFyIGJvdW5kO1xuICB2YXIgcGFyZW50O1xuICB2YXIgb2Zmc2V0ID0gcC5vZmZzZXQ7XG4gIHZhciB3b3JraW5nTm9kZTtcbiAgdmFyIGNoaWxkTm9kZXM7XG4gIHZhciByYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHZhciBkYXRhID0gaXNDaGFyYWN0ZXJEYXRhTm9kZShwLm5vZGUpO1xuXG4gIGlmIChkYXRhKSB7XG4gICAgYm91bmQgPSBwLm5vZGU7XG4gICAgcGFyZW50ID0gYm91bmQucGFyZW50Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZE5vZGVzID0gcC5ub2RlLmNoaWxkTm9kZXM7XG4gICAgYm91bmQgPSBvZmZzZXQgPCBjaGlsZE5vZGVzLmxlbmd0aCA/IGNoaWxkTm9kZXNbb2Zmc2V0XSA6IG51bGw7XG4gICAgcGFyZW50ID0gcC5ub2RlO1xuICB9XG5cbiAgd29ya2luZ05vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB3b3JraW5nTm9kZS5pbm5lckhUTUwgPSAnJiNmZWZmOyc7XG5cbiAgaWYgKGJvdW5kKSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZSh3b3JraW5nTm9kZSwgYm91bmQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh3b3JraW5nTm9kZSk7XG4gIH1cblxuICByYW5nZS5tb3ZlVG9FbGVtZW50VGV4dCh3b3JraW5nTm9kZSk7XG4gIHJhbmdlLmNvbGxhcHNlKCFzdGFydGluZyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh3b3JraW5nTm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICByYW5nZVtzdGFydGluZyA/ICdtb3ZlU3RhcnQnIDogJ21vdmVFbmQnXSgnY2hhcmFjdGVyJywgb2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gcmFuZ2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZ2VUb1RleHRSYW5nZTtcbiJdfQ==
},{}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\seleccion.js":[function(require,module,exports){
'use strict';

var getSelection = require('./getSelection');
var setSelection = require('./setSelection');

module.exports = {
  get: getSelection,
  set: setSelection
};

},{"./getSelection":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelection.js","./setSelection":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\setSelection.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\setSelection.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL3NldFNlbGVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvbicpO1xudmFyIHJhbmdlVG9UZXh0UmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlVG9UZXh0UmFuZ2UnKTtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG5cbmZ1bmN0aW9uIHNldFNlbGVjdGlvbiAocCkge1xuICBpZiAoZG9jLmNyZWF0ZVJhbmdlKSB7XG4gICAgbW9kZXJuU2VsZWN0aW9uKCk7XG4gIH0gZWxzZSB7XG4gICAgb2xkU2VsZWN0aW9uKCk7XG4gIH1cblxuICBmdW5jdGlvbiBtb2Rlcm5TZWxlY3Rpb24gKCkge1xuICAgIHZhciBzZWwgPSBnZXRTZWxlY3Rpb24oKTtcbiAgICB2YXIgcmFuZ2UgPSBkb2MuY3JlYXRlUmFuZ2UoKTtcbiAgICBpZiAoIXAuc3RhcnRDb250YWluZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHAuZW5kQ29udGFpbmVyKSB7XG4gICAgICByYW5nZS5zZXRFbmQocC5lbmRDb250YWluZXIsIHAuZW5kT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZ2Uuc2V0RW5kKHAuc3RhcnRDb250YWluZXIsIHAuc3RhcnRPZmZzZXQpO1xuICAgIH1cbiAgICByYW5nZS5zZXRTdGFydChwLnN0YXJ0Q29udGFpbmVyLCBwLnN0YXJ0T2Zmc2V0KTtcbiAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9sZFNlbGVjdGlvbiAoKSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShwKS5zZWxlY3QoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldFNlbGVjdGlvbjtcbiJdfQ==
},{"./getSelection":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\getSelection.js","./rangeToTextRange":"J:\\Dev\\Work\\horsey\\node_modules\\seleccion\\src\\rangeToTextRange.js"}],"J:\\Dev\\Work\\horsey\\node_modules\\sell\\sell.js":[function(require,module,exports){
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

},{}],"J:\\Dev\\Work\\horsey\\node_modules\\ticky\\ticky-browser.js":[function(require,module,exports){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
},{}]},{},["J:\\Dev\\Work\\horsey\\horsey.js"])("J:\\Dev\\Work\\horsey\\horsey.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcd2F0Y2hpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImhvcnNleS5qcyIsIm5vZGVfbW9kdWxlc1xcYXRvYVxcYXRvYS5qcyIsIm5vZGVfbW9kdWxlc1xcYnVsbHNleWVcXGJ1bGxzZXllLmpzIiwibm9kZV9tb2R1bGVzXFxidWxsc2V5ZVxcdGFpbG9ybWFkZS5qcyIsIm5vZGVfbW9kdWxlc1xcYnVsbHNleWVcXHRocm90dGxlLmpzIiwibm9kZV9tb2R1bGVzXFxjb250cmFcXGRlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzXFxjb250cmFcXGVtaXR0ZXIuanMiLCJub2RlX21vZHVsZXNcXGNyb3NzdmVudFxcc3JjXFxjcm9zc3ZlbnQuanMiLCJub2RlX21vZHVsZXNcXGNyb3NzdmVudFxcc3JjXFxldmVudG1hcC5qcyIsIm5vZGVfbW9kdWxlc1xcY3VzdG9tLWV2ZW50XFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xcZnV6enlzZWFyY2hcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxoYXNoLXN1bVxcaGFzaC1zdW0uanMiLCJub2RlX21vZHVsZXNcXGxvZGFzaFxcZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXNcXGxvZGFzaFxcaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlc1xcbG9kYXNoXFxpc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlc1xcbG9kYXNoXFxpc09iamVjdExpa2UuanMiLCJub2RlX21vZHVsZXNcXGxvZGFzaFxcaXNTeW1ib2wuanMiLCJub2RlX21vZHVsZXNcXGxvZGFzaFxcbm93LmpzIiwibm9kZV9tb2R1bGVzXFxsb2Rhc2hcXHRvTnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzXFxzZWt0b3JcXHNyY1xcc2VrdG9yLmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xcZ2V0U2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xcZ2V0U2VsZWN0aW9uTnVsbE9wLmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xcZ2V0U2VsZWN0aW9uUmF3LmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xcZ2V0U2VsZWN0aW9uU3ludGhldGljLmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xcaXNIb3N0LmpzIiwibm9kZV9tb2R1bGVzXFxzZWxlY2Npb25cXHNyY1xccmFuZ2VUb1RleHRSYW5nZS5qcyIsIm5vZGVfbW9kdWxlc1xcc2VsZWNjaW9uXFxzcmNcXHNlbGVjY2lvbi5qcyIsIm5vZGVfbW9kdWxlc1xcc2VsZWNjaW9uXFxzcmNcXHNldFNlbGVjdGlvbi5qcyIsIm5vZGVfbW9kdWxlc1xcc2VsbFxcc2VsbC5qcyIsIm5vZGVfbW9kdWxlc1xcdGlja3lcXHRpY2t5LWJyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1aUNBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaGFzaFN1bSA9IHJlcXVpcmUoJ2hhc2gtc3VtJyk7XG5cbnZhciBfaGFzaFN1bTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9oYXNoU3VtKTtcblxudmFyIF9zZWxsID0gcmVxdWlyZSgnc2VsbCcpO1xuXG52YXIgX3NlbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc2VsbCk7XG5cbnZhciBfc2VrdG9yID0gcmVxdWlyZSgnc2VrdG9yJyk7XG5cbnZhciBfc2VrdG9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3Nla3Rvcik7XG5cbnZhciBfZW1pdHRlciA9IHJlcXVpcmUoJ2NvbnRyYS9lbWl0dGVyJyk7XG5cbnZhciBfZW1pdHRlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9lbWl0dGVyKTtcblxudmFyIF9idWxsc2V5ZSA9IHJlcXVpcmUoJ2J1bGxzZXllJyk7XG5cbnZhciBfYnVsbHNleWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYnVsbHNleWUpO1xuXG52YXIgX2Nyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpO1xuXG52YXIgX2Nyb3NzdmVudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcm9zc3ZlbnQpO1xuXG52YXIgX2Z1enp5c2VhcmNoID0gcmVxdWlyZSgnZnV6enlzZWFyY2gnKTtcblxudmFyIF9mdXp6eXNlYXJjaDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mdXp6eXNlYXJjaCk7XG5cbnZhciBfZGVib3VuY2UgPSByZXF1aXJlKCdsb2Rhc2gvZGVib3VuY2UnKTtcblxudmFyIF9kZWJvdW5jZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWJvdW5jZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7IGFycjJbaV0gPSBhcnJbaV07IH0gcmV0dXJuIGFycjI7IH0gZWxzZSB7IHJldHVybiBBcnJheS5mcm9tKGFycik7IH0gfVxuXG52YXIgS0VZX0JBQ0tTUEFDRSA9IDg7XG52YXIgS0VZX0VOVEVSID0gMTM7XG52YXIgS0VZX0VTQyA9IDI3O1xudmFyIEtFWV9VUCA9IDM4O1xudmFyIEtFWV9ET1dOID0gNDA7XG52YXIgS0VZX1RBQiA9IDk7XG52YXIgZG9jID0gZG9jdW1lbnQ7XG52YXIgZG9jRWxlbWVudCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbmZ1bmN0aW9uIGhvcnNleShlbCkge1xuICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gIHZhciBzZXRBcHBlbmRzID0gb3B0aW9ucy5zZXRBcHBlbmRzLFxuICAgICAgX3NldCA9IG9wdGlvbnMuc2V0LFxuICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXIsXG4gICAgICBzb3VyY2UgPSBvcHRpb25zLnNvdXJjZSxcbiAgICAgIF9vcHRpb25zJGNhY2hlID0gb3B0aW9ucy5jYWNoZSxcbiAgICAgIGNhY2hlID0gX29wdGlvbnMkY2FjaGUgPT09IHVuZGVmaW5lZCA/IHt9IDogX29wdGlvbnMkY2FjaGUsXG4gICAgICBwcmVkaWN0TmV4dFNlYXJjaCA9IG9wdGlvbnMucHJlZGljdE5leHRTZWFyY2gsXG4gICAgICByZW5kZXJJdGVtID0gb3B0aW9ucy5yZW5kZXJJdGVtLFxuICAgICAgcmVuZGVyQ2F0ZWdvcnkgPSBvcHRpb25zLnJlbmRlckNhdGVnb3J5LFxuICAgICAgYmxhbmtTZWFyY2ggPSBvcHRpb25zLmJsYW5rU2VhcmNoLFxuICAgICAgYXBwZW5kVG8gPSBvcHRpb25zLmFwcGVuZFRvLFxuICAgICAgYW5jaG9yID0gb3B0aW9ucy5hbmNob3IsXG4gICAgICBkZWJvdW5jZSA9IG9wdGlvbnMuZGVib3VuY2U7XG5cbiAgdmFyIGNhY2hpbmcgPSBvcHRpb25zLmNhY2hlICE9PSBmYWxzZTtcbiAgaWYgKCFzb3VyY2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgdXNlckdldFRleHQgPSBvcHRpb25zLmdldFRleHQ7XG4gIHZhciB1c2VyR2V0VmFsdWUgPSBvcHRpb25zLmdldFZhbHVlO1xuICB2YXIgZ2V0VGV4dCA9IHR5cGVvZiB1c2VyR2V0VGV4dCA9PT0gJ3N0cmluZycgPyBmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkW3VzZXJHZXRUZXh0XTtcbiAgfSA6IHR5cGVvZiB1c2VyR2V0VGV4dCA9PT0gJ2Z1bmN0aW9uJyA/IHVzZXJHZXRUZXh0IDogZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b1N0cmluZygpO1xuICB9O1xuICB2YXIgZ2V0VmFsdWUgPSB0eXBlb2YgdXNlckdldFZhbHVlID09PSAnc3RyaW5nJyA/IGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGRbdXNlckdldFZhbHVlXTtcbiAgfSA6IHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdmdW5jdGlvbicgPyB1c2VyR2V0VmFsdWUgOiBmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkO1xuICB9O1xuXG4gIHZhciBwcmV2aW91c1N1Z2dlc3Rpb25zID0gW107XG4gIHZhciBwcmV2aW91c1NlbGVjdGlvbiA9IG51bGw7XG4gIHZhciBsaW1pdCA9IE51bWJlcihvcHRpb25zLmxpbWl0KSB8fCBJbmZpbml0eTtcbiAgdmFyIGNvbXBsZXRlciA9IGF1dG9jb21wbGV0ZShlbCwge1xuICAgIHNvdXJjZTogc291cmNlRnVuY3Rpb24sXG4gICAgbGltaXQ6IGxpbWl0LFxuICAgIGdldFRleHQ6IGdldFRleHQsXG4gICAgZ2V0VmFsdWU6IGdldFZhbHVlLFxuICAgIHNldEFwcGVuZHM6IHNldEFwcGVuZHMsXG4gICAgcHJlZGljdE5leHRTZWFyY2g6IHByZWRpY3ROZXh0U2VhcmNoLFxuICAgIHJlbmRlckl0ZW06IHJlbmRlckl0ZW0sXG4gICAgcmVuZGVyQ2F0ZWdvcnk6IHJlbmRlckNhdGVnb3J5LFxuICAgIGFwcGVuZFRvOiBhcHBlbmRUbyxcbiAgICBhbmNob3I6IGFuY2hvcixcbiAgICBub01hdGNoZXM6IG5vTWF0Y2hlcyxcbiAgICBub01hdGNoZXNUZXh0OiBvcHRpb25zLm5vTWF0Y2hlcyxcbiAgICBibGFua1NlYXJjaDogYmxhbmtTZWFyY2gsXG4gICAgZGVib3VuY2U6IGRlYm91bmNlLFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHMpIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzICE9PSB0cnVlKSB7XG4gICAgICAgIGVsLnZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBwcmV2aW91c1NlbGVjdGlvbiA9IHM7XG4gICAgICAoX3NldCB8fCBjb21wbGV0ZXIuZGVmYXVsdFNldHRlcikoZ2V0VGV4dChzKSwgcyk7XG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYWZ0ZXJTZXQnKTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmaWx0ZXJcbiAgfSk7XG4gIHJldHVybiBjb21wbGV0ZXI7XG4gIGZ1bmN0aW9uIG5vTWF0Y2hlcyhkYXRhKSB7XG4gICAgaWYgKCFvcHRpb25zLm5vTWF0Y2hlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5xdWVyeS5sZW5ndGg7XG4gIH1cbiAgZnVuY3Rpb24gc291cmNlRnVuY3Rpb24oZGF0YSwgZG9uZSkge1xuICAgIHZhciBxdWVyeSA9IGRhdGEucXVlcnksXG4gICAgICAgIGxpbWl0ID0gZGF0YS5saW1pdDtcblxuICAgIGlmICghb3B0aW9ucy5ibGFua1NlYXJjaCAmJiBxdWVyeS5sZW5ndGggPT09IDApIHtcbiAgICAgIGRvbmUobnVsbCwgW10sIHRydWUpO3JldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbXBsZXRlcikge1xuICAgICAgY29tcGxldGVyLmVtaXQoJ2JlZm9yZVVwZGF0ZScpO1xuICAgIH1cbiAgICB2YXIgaGFzaCA9ICgwLCBfaGFzaFN1bTIuZGVmYXVsdCkocXVlcnkpOyAvLyBmYXN0LCBjYXNlIGluc2Vuc2l0aXZlLCBwcmV2ZW50cyBjb2xsaXNpb25zXG4gICAgaWYgKGNhY2hpbmcpIHtcbiAgICAgIHZhciBlbnRyeSA9IGNhY2hlW2hhc2hdO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIHZhciBzdGFydCA9IGVudHJ5LmNyZWF0ZWQuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBjYWNoZS5kdXJhdGlvbiB8fCA2MCAqIDYwICogMjQ7XG4gICAgICAgIHZhciBkaWZmID0gZHVyYXRpb24gKiAxMDAwO1xuICAgICAgICB2YXIgZnJlc2ggPSBuZXcgRGF0ZShzdGFydCArIGRpZmYpID4gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKGZyZXNoKSB7XG4gICAgICAgICAgZG9uZShudWxsLCBlbnRyeS5pdGVtcy5zbGljZSgpKTtyZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNvdXJjZURhdGEgPSB7XG4gICAgICBwcmV2aW91c1N1Z2dlc3Rpb25zOiBwcmV2aW91c1N1Z2dlc3Rpb25zLnNsaWNlKCksXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbjogcHJldmlvdXNTZWxlY3Rpb24sXG4gICAgICBpbnB1dDogcXVlcnksXG4gICAgICByZW5kZXJJdGVtOiByZW5kZXJJdGVtLFxuICAgICAgcmVuZGVyQ2F0ZWdvcnk6IHJlbmRlckNhdGVnb3J5LFxuICAgICAgbGltaXQ6IGxpbWl0XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLnNvdXJjZShzb3VyY2VEYXRhLCBzb3VyY2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc291cmNlZChudWxsLCBvcHRpb25zLnNvdXJjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvdXJjZWQoZXJyLCByZXN1bHQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0F1dG9jb21wbGV0ZSBzb3VyY2UgZXJyb3IuJywgZXJyLCBlbCk7XG4gICAgICAgIGRvbmUoZXJyLCBbXSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlbXMgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQgOiBbXTtcbiAgICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICAgIGNhY2hlW2hhc2hdID0geyBjcmVhdGVkOiBuZXcgRGF0ZSgpLCBpdGVtczogaXRlbXMgfTtcbiAgICAgIH1cbiAgICAgIHByZXZpb3VzU3VnZ2VzdGlvbnMgPSBpdGVtcztcbiAgICAgIGRvbmUobnVsbCwgaXRlbXMuc2xpY2UoKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGF1dG9jb21wbGV0ZShlbCkge1xuICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cbiAgdmFyIG8gPSBvcHRpb25zO1xuICB2YXIgcGFyZW50ID0gby5hcHBlbmRUbyB8fCBkb2MuYm9keTtcbiAgdmFyIGdldFRleHQgPSBvLmdldFRleHQsXG4gICAgICBnZXRWYWx1ZSA9IG8uZ2V0VmFsdWUsXG4gICAgICBmb3JtID0gby5mb3JtLFxuICAgICAgc291cmNlID0gby5zb3VyY2UsXG4gICAgICBub01hdGNoZXMgPSBvLm5vTWF0Y2hlcyxcbiAgICAgIG5vTWF0Y2hlc1RleHQgPSBvLm5vTWF0Y2hlc1RleHQsXG4gICAgICBfbyRoaWdobGlnaHRlciA9IG8uaGlnaGxpZ2h0ZXIsXG4gICAgICBoaWdobGlnaHRlciA9IF9vJGhpZ2hsaWdodGVyID09PSB1bmRlZmluZWQgPyB0cnVlIDogX28kaGlnaGxpZ2h0ZXIsXG4gICAgICBfbyRoaWdobGlnaHRDb21wbGV0ZVcgPSBvLmhpZ2hsaWdodENvbXBsZXRlV29yZHMsXG4gICAgICBoaWdobGlnaHRDb21wbGV0ZVdvcmRzID0gX28kaGlnaGxpZ2h0Q29tcGxldGVXID09PSB1bmRlZmluZWQgPyB0cnVlIDogX28kaGlnaGxpZ2h0Q29tcGxldGVXLFxuICAgICAgX28kcmVuZGVySXRlbSA9IG8ucmVuZGVySXRlbSxcbiAgICAgIHJlbmRlckl0ZW0gPSBfbyRyZW5kZXJJdGVtID09PSB1bmRlZmluZWQgPyBkZWZhdWx0SXRlbVJlbmRlcmVyIDogX28kcmVuZGVySXRlbSxcbiAgICAgIF9vJHJlbmRlckNhdGVnb3J5ID0gby5yZW5kZXJDYXRlZ29yeSxcbiAgICAgIHJlbmRlckNhdGVnb3J5ID0gX28kcmVuZGVyQ2F0ZWdvcnkgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyIDogX28kcmVuZGVyQ2F0ZWdvcnksXG4gICAgICBzZXRBcHBlbmRzID0gby5zZXRBcHBlbmRzO1xuXG4gIHZhciBsaW1pdCA9IHR5cGVvZiBvLmxpbWl0ID09PSAnbnVtYmVyJyA/IG8ubGltaXQgOiBJbmZpbml0eTtcbiAgdmFyIHVzZXJGaWx0ZXIgPSBvLmZpbHRlciB8fCBkZWZhdWx0RmlsdGVyO1xuICB2YXIgdXNlclNldCA9IG8uc2V0IHx8IGRlZmF1bHRTZXR0ZXI7XG4gIHZhciBjYXRlZ29yaWVzID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3JpZXMnKTtcbiAgdmFyIGNvbnRhaW5lciA9IHRhZygnZGl2JywgJ3NleS1jb250YWluZXInKTtcbiAgdmFyIGRlZmVycmVkRmlsdGVyaW5nID0gZGVmZXIoZmlsdGVyaW5nKTtcbiAgdmFyIHN0YXRlID0geyBjb3VudGVyOiAwLCBxdWVyeTogbnVsbCB9O1xuICB2YXIgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2YXIgc2VsZWN0aW9uID0gbnVsbDtcbiAgdmFyIGV5ZSA9IHZvaWQgMDtcbiAgdmFyIGF0dGFjaG1lbnQgPSBlbDtcbiAgdmFyIG5vbmVNYXRjaCA9IHZvaWQgMDtcbiAgdmFyIHRleHRJbnB1dCA9IHZvaWQgMDtcbiAgdmFyIGFueUlucHV0ID0gdm9pZCAwO1xuICB2YXIgcmFuY2hvcmxlZnQgPSB2b2lkIDA7XG4gIHZhciByYW5jaG9ycmlnaHQgPSB2b2lkIDA7XG4gIHZhciBsYXN0UHJlZml4ID0gJyc7XG4gIHZhciBkZWJvdW5jZVRpbWUgPSBvLmRlYm91bmNlIHx8IDMwMDtcbiAgdmFyIGRlYm91bmNlZExvYWRpbmcgPSAoMCwgX2RlYm91bmNlMi5kZWZhdWx0KShsb2FkaW5nLCBkZWJvdW5jZVRpbWUpO1xuXG4gIGlmIChvLmF1dG9IaWRlT25CbHVyID09PSB2b2lkIDApIHtcbiAgICBvLmF1dG9IaWRlT25CbHVyID0gdHJ1ZTtcbiAgfVxuICBpZiAoby5hdXRvSGlkZU9uQ2xpY2sgPT09IHZvaWQgMCkge1xuICAgIG8uYXV0b0hpZGVPbkNsaWNrID0gdHJ1ZTtcbiAgfVxuICBpZiAoby5hdXRvU2hvd09uVXBEb3duID09PSB2b2lkIDApIHtcbiAgICBvLmF1dG9TaG93T25VcERvd24gPSBlbC50YWdOYW1lID09PSAnSU5QVVQnO1xuICB9XG4gIGlmIChvLmFuY2hvcikge1xuICAgIHJhbmNob3JsZWZ0ID0gbmV3IFJlZ0V4cCgnXicgKyBvLmFuY2hvcik7XG4gICAgcmFuY2hvcnJpZ2h0ID0gbmV3IFJlZ0V4cChvLmFuY2hvciArICckJyk7XG4gIH1cblxuICB2YXIgaGFzSXRlbXMgPSBmYWxzZTtcbiAgdmFyIGFwaSA9ICgwLCBfZW1pdHRlcjIuZGVmYXVsdCkoe1xuICAgIGFuY2hvcjogby5hbmNob3IsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHNob3c6IHNob3csXG4gICAgaGlkZTogaGlkZSxcbiAgICB0b2dnbGU6IHRvZ2dsZSxcbiAgICBkZXN0cm95OiBkZXN0cm95LFxuICAgIHJlZnJlc2hQb3NpdGlvbjogcmVmcmVzaFBvc2l0aW9uLFxuICAgIGFwcGVuZFRleHQ6IGFwcGVuZFRleHQsXG4gICAgYXBwZW5kSFRNTDogYXBwZW5kSFRNTCxcbiAgICBmaWx0ZXJBbmNob3JlZFRleHQ6IGZpbHRlckFuY2hvcmVkVGV4dCxcbiAgICBmaWx0ZXJBbmNob3JlZEhUTUw6IGZpbHRlckFuY2hvcmVkSFRNTCxcbiAgICBkZWZhdWx0QXBwZW5kVGV4dDogYXBwZW5kVGV4dCxcbiAgICBkZWZhdWx0RmlsdGVyOiBkZWZhdWx0RmlsdGVyLFxuICAgIGRlZmF1bHRJdGVtUmVuZGVyZXI6IGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgZGVmYXVsdENhdGVnb3J5UmVuZGVyZXI6IGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyLFxuICAgIGRlZmF1bHRTZXR0ZXI6IGRlZmF1bHRTZXR0ZXIsXG4gICAgcmV0YXJnZXQ6IHJldGFyZ2V0LFxuICAgIGF0dGFjaG1lbnQ6IGF0dGFjaG1lbnQsXG4gICAgc291cmNlOiBbXVxuICB9KTtcblxuICByZXRhcmdldChlbCk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yaWVzKTtcbiAgaWYgKG5vTWF0Y2hlcyAmJiBub01hdGNoZXNUZXh0KSB7XG4gICAgbm9uZU1hdGNoID0gdGFnKCdkaXYnLCAnc2V5LWVtcHR5IHNleS1oaWRlJyk7XG4gICAgdGV4dChub25lTWF0Y2gsIG5vTWF0Y2hlc1RleHQpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub25lTWF0Y2gpO1xuICB9XG4gIHBhcmVudC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgbG9hZGVkKHNvdXJjZSwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcblxuICBmdW5jdGlvbiByZXRhcmdldChlbCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGF0dGFjaG1lbnQgPSBhcGkuYXR0YWNobWVudCA9IGVsO1xuICAgIHRleHRJbnB1dCA9IGF0dGFjaG1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBhdHRhY2htZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQSc7XG4gICAgYW55SW5wdXQgPSB0ZXh0SW5wdXQgfHwgaXNFZGl0YWJsZShhdHRhY2htZW50KTtcbiAgICBpbnB1dEV2ZW50cygpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVmcmVzaFBvc2l0aW9uKCkge1xuICAgIGlmIChleWUpIHtcbiAgICAgIGV5ZS5yZWZyZXNoKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGluZyhmb3JjZVNob3cpIHtcbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LnJlbW92ZShhdHRhY2htZW50LCAnZm9jdXMnLCBsb2FkaW5nKTtcbiAgICB2YXIgcXVlcnkgPSByZWFkSW5wdXQoKTtcbiAgICBpZiAocXVlcnkgPT09IHN0YXRlLnF1ZXJ5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgc3RhdGUucXVlcnkgPSBxdWVyeTtcblxuICAgIHZhciBjb3VudGVyID0gKytzdGF0ZS5jb3VudGVyO1xuXG4gICAgc291cmNlKHsgcXVlcnk6IHF1ZXJ5LCBsaW1pdDogbGltaXQgfSwgc291cmNlZCk7XG5cbiAgICBmdW5jdGlvbiBzb3VyY2VkKGVyciwgcmVzdWx0LCBibGFua1F1ZXJ5KSB7XG4gICAgICBpZiAoc3RhdGUuY291bnRlciAhPT0gY291bnRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2FkZWQocmVzdWx0LCBmb3JjZVNob3cpO1xuICAgICAgaWYgKGVyciB8fCBibGFua1F1ZXJ5KSB7XG4gICAgICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGVkKGNhdGVnb3JpZXMsIGZvcmNlU2hvdykge1xuICAgIGNsZWFyKCk7XG4gICAgaGFzSXRlbXMgPSB0cnVlO1xuICAgIGFwaS5zb3VyY2UgPSBbXTtcbiAgICBjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24gKGNhdCkge1xuICAgICAgcmV0dXJuIGNhdC5saXN0LmZvckVhY2goZnVuY3Rpb24gKHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGFkZChzdWdnZXN0aW9uLCBjYXQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgaWYgKGZvcmNlU2hvdykge1xuICAgICAgc2hvdygpO1xuICAgIH1cbiAgICBmaWx0ZXJpbmcoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHVuc2VsZWN0KCk7XG4gICAgd2hpbGUgKGNhdGVnb3JpZXMubGFzdENoaWxkKSB7XG4gICAgICBjYXRlZ29yaWVzLnJlbW92ZUNoaWxkKGNhdGVnb3JpZXMubGFzdENoaWxkKTtcbiAgICB9XG4gICAgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkSW5wdXQoKSB7XG4gICAgcmV0dXJuICh0ZXh0SW5wdXQgPyBlbC52YWx1ZSA6IGVsLmlubmVySFRNTCkudHJpbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnkoZGF0YSkge1xuICAgIGlmICghZGF0YS5pZCkge1xuICAgICAgZGF0YS5pZCA9ICdkZWZhdWx0JztcbiAgICB9XG4gICAgaWYgKCFjYXRlZ29yeU1hcFtkYXRhLmlkXSkge1xuICAgICAgY2F0ZWdvcnlNYXBbZGF0YS5pZF0gPSBjcmVhdGVDYXRlZ29yeSgpO1xuICAgIH1cbiAgICByZXR1cm4gY2F0ZWdvcnlNYXBbZGF0YS5pZF07XG4gICAgZnVuY3Rpb24gY3JlYXRlQ2F0ZWdvcnkoKSB7XG4gICAgICB2YXIgY2F0ZWdvcnkgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcnknKTtcbiAgICAgIHZhciB1bCA9IHRhZygndWwnLCAnc2V5LWxpc3QnKTtcbiAgICAgIHJlbmRlckNhdGVnb3J5KGNhdGVnb3J5LCBkYXRhKTtcbiAgICAgIGNhdGVnb3J5LmFwcGVuZENoaWxkKHVsKTtcbiAgICAgIGNhdGVnb3JpZXMuYXBwZW5kQ2hpbGQoY2F0ZWdvcnkpO1xuICAgICAgcmV0dXJuIHsgZGF0YTogZGF0YSwgdWw6IHVsIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkKHN1Z2dlc3Rpb24sIGNhdGVnb3J5RGF0YSkge1xuICAgIHZhciBjYXQgPSBnZXRDYXRlZ29yeShjYXRlZ29yeURhdGEpO1xuICAgIHZhciBsaSA9IHRhZygnbGknLCAnc2V5LWl0ZW0nKTtcbiAgICByZW5kZXJJdGVtKGxpLCBzdWdnZXN0aW9uKTtcbiAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcbiAgICAgIGJyZWFrdXBGb3JIaWdobGlnaHRlcihsaSk7XG4gICAgfVxuICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHQuYWRkKGxpLCAnbW91c2VlbnRlcicsIGhvdmVyU3VnZ2VzdGlvbik7XG4gICAgX2Nyb3NzdmVudDIuZGVmYXVsdC5hZGQobGksICdjbGljaycsIGNsaWNrZWRTdWdnZXN0aW9uKTtcbiAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmFkZChsaSwgJ2hvcnNleS1maWx0ZXInLCBmaWx0ZXJJdGVtKTtcbiAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmFkZChsaSwgJ2hvcnNleS1oaWRlJywgaGlkZUl0ZW0pO1xuICAgIGNhdC51bC5hcHBlbmRDaGlsZChsaSk7XG4gICAgYXBpLnNvdXJjZS5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgIHJldHVybiBsaTtcblxuICAgIGZ1bmN0aW9uIGhvdmVyU3VnZ2VzdGlvbigpIHtcbiAgICAgIHNlbGVjdChsaSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xpY2tlZFN1Z2dlc3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSBnZXRUZXh0KHN1Z2dlc3Rpb24pO1xuICAgICAgc2V0KHN1Z2dlc3Rpb24pO1xuICAgICAgaGlkZSgpO1xuICAgICAgYXR0YWNobWVudC5mb2N1cygpO1xuICAgICAgbGFzdFByZWZpeCA9IG8ucHJlZGljdE5leHRTZWFyY2ggJiYgby5wcmVkaWN0TmV4dFNlYXJjaCh7XG4gICAgICAgIGlucHV0OiBpbnB1dCxcbiAgICAgICAgc291cmNlOiBhcGkuc291cmNlLnNsaWNlKCksXG4gICAgICAgIHNlbGVjdGlvbjogc3VnZ2VzdGlvblxuICAgICAgfSkgfHwgJyc7XG4gICAgICBpZiAobGFzdFByZWZpeCkge1xuICAgICAgICBlbC52YWx1ZSA9IGxhc3RQcmVmaXg7XG4gICAgICAgIGVsLnNlbGVjdCgpO1xuICAgICAgICBzaG93KCk7XG4gICAgICAgIGZpbHRlcmluZygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckl0ZW0oKSB7XG4gICAgICB2YXIgdmFsdWUgPSByZWFkSW5wdXQoKTtcbiAgICAgIGlmIChmaWx0ZXIodmFsdWUsIHN1Z2dlc3Rpb24pKSB7XG4gICAgICAgIGxpLmNsYXNzTmFtZSA9IGxpLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LWhpZGUvZywgJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdC5mYWJyaWNhdGUobGksICdob3JzZXktaGlkZScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVJdGVtKCkge1xuICAgICAgaWYgKCFoaWRkZW4obGkpKSB7XG4gICAgICAgIGxpLmNsYXNzTmFtZSArPSAnIHNleS1oaWRlJztcbiAgICAgICAgaWYgKHNlbGVjdGlvbiA9PT0gbGkpIHtcbiAgICAgICAgICB1bnNlbGVjdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYnJlYWt1cEZvckhpZ2hsaWdodGVyKGVsKSB7XG4gICAgZ2V0VGV4dENoaWxkcmVuKGVsKS5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgdmFyIHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICB2YXIgdGV4dCA9IGVsLnRleHRDb250ZW50IHx8IGVsLm5vZGVWYWx1ZSB8fCAnJztcbiAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbiA9IHRydWU7XG4gICAgICB2YXIgX2RpZEl0ZXJhdG9yRXJyb3IgPSBmYWxzZTtcbiAgICAgIHZhciBfaXRlcmF0b3JFcnJvciA9IHVuZGVmaW5lZDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZm9yICh2YXIgX2l0ZXJhdG9yID0gdGV4dFtTeW1ib2wuaXRlcmF0b3JdKCksIF9zdGVwOyAhKF9pdGVyYXRvck5vcm1hbENvbXBsZXRpb24gPSAoX3N0ZXAgPSBfaXRlcmF0b3IubmV4dCgpKS5kb25lKTsgX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbiA9IHRydWUpIHtcbiAgICAgICAgICB2YXIgY2hhciA9IF9zdGVwLnZhbHVlO1xuXG4gICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShzcGFuRm9yKGNoYXIpLCBlbCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBfZGlkSXRlcmF0b3JFcnJvciA9IHRydWU7XG4gICAgICAgIF9pdGVyYXRvckVycm9yID0gZXJyO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoIV9pdGVyYXRvck5vcm1hbENvbXBsZXRpb24gJiYgX2l0ZXJhdG9yLnJldHVybikge1xuICAgICAgICAgICAgX2l0ZXJhdG9yLnJldHVybigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBpZiAoX2RpZEl0ZXJhdG9yRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IF9pdGVyYXRvckVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgZnVuY3Rpb24gc3BhbkZvcihjaGFyKSB7XG4gICAgICAgIHZhciBzcGFuID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSAnc2V5LWNoYXInO1xuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gc3Bhbi5pbm5lclRleHQgPSBjaGFyO1xuICAgICAgICByZXR1cm4gc3BhbjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChlbCwgbmVlZGxlKSB7XG4gICAgdmFyIHJ3b3JkID0gL1tcXHMsLl9cXFtcXF17fSgpLV0vZztcbiAgICB2YXIgd29yZHMgPSBuZWVkbGUuc3BsaXQocndvcmQpLmZpbHRlcihmdW5jdGlvbiAodykge1xuICAgICAgcmV0dXJuIHcubGVuZ3RoO1xuICAgIH0pO1xuICAgIHZhciBlbGVtcyA9IFtdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkoZWwucXVlcnlTZWxlY3RvckFsbCgnLnNleS1jaGFyJykpKTtcbiAgICB2YXIgY2hhcnMgPSB2b2lkIDA7XG4gICAgdmFyIHN0YXJ0SW5kZXggPSAwO1xuXG4gICAgYmFsYW5jZSgpO1xuICAgIGlmIChoaWdobGlnaHRDb21wbGV0ZVdvcmRzKSB7XG4gICAgICB3aG9sZSgpO1xuICAgIH1cbiAgICBmdXp6eSgpO1xuICAgIGNsZWFyUmVtYWluZGVyKCk7XG5cbiAgICBmdW5jdGlvbiBiYWxhbmNlKCkge1xuICAgICAgY2hhcnMgPSBlbGVtcy5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHJldHVybiBlbC5pbm5lclRleHQgfHwgZWwudGV4dENvbnRlbnQ7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aG9sZSgpIHtcbiAgICAgIHZhciBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uMiA9IHRydWU7XG4gICAgICB2YXIgX2RpZEl0ZXJhdG9yRXJyb3IyID0gZmFsc2U7XG4gICAgICB2YXIgX2l0ZXJhdG9yRXJyb3IyID0gdW5kZWZpbmVkO1xuXG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3IyID0gd29yZHNbU3ltYm9sLml0ZXJhdG9yXSgpLCBfc3RlcDI7ICEoX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbjIgPSAoX3N0ZXAyID0gX2l0ZXJhdG9yMi5uZXh0KCkpLmRvbmUpOyBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uMiA9IHRydWUpIHtcbiAgICAgICAgICB2YXIgd29yZCA9IF9zdGVwMi52YWx1ZTtcblxuICAgICAgICAgIHZhciB0ZW1wSW5kZXggPSBzdGFydEluZGV4O1xuICAgICAgICAgIHJldHJ5OiB3aGlsZSAodGVtcEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGluaXQgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIHByZXZJbmRleCA9IHRlbXBJbmRleDtcbiAgICAgICAgICAgIHZhciBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uMyA9IHRydWU7XG4gICAgICAgICAgICB2YXIgX2RpZEl0ZXJhdG9yRXJyb3IzID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgX2l0ZXJhdG9yRXJyb3IzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3IzID0gd29yZFtTeW1ib2wuaXRlcmF0b3JdKCksIF9zdGVwMzsgIShfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uMyA9IChfc3RlcDMgPSBfaXRlcmF0b3IzLm5leHQoKSkuZG9uZSk7IF9pdGVyYXRvck5vcm1hbENvbXBsZXRpb24zID0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBjaGFyID0gX3N0ZXAzLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgdmFyIGkgPSBjaGFycy5pbmRleE9mKGNoYXIsIHByZXZJbmRleCArIDEpO1xuICAgICAgICAgICAgICAgIHZhciBmYWlsID0gaSA9PT0gLTEgfHwgIWluaXQgJiYgcHJldkluZGV4ICsgMSAhPT0gaTtcbiAgICAgICAgICAgICAgICBpZiAoaW5pdCkge1xuICAgICAgICAgICAgICAgICAgaW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgdGVtcEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZhaWwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHJldHJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2SW5kZXggPSBpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgX2RpZEl0ZXJhdG9yRXJyb3IzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgX2l0ZXJhdG9yRXJyb3IzID0gZXJyO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIV9pdGVyYXRvck5vcm1hbENvbXBsZXRpb24zICYmIF9pdGVyYXRvcjMucmV0dXJuKSB7XG4gICAgICAgICAgICAgICAgICBfaXRlcmF0b3IzLnJldHVybigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAoX2RpZEl0ZXJhdG9yRXJyb3IzKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBfaXRlcmF0b3JFcnJvcjM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uNCA9IHRydWU7XG4gICAgICAgICAgICB2YXIgX2RpZEl0ZXJhdG9yRXJyb3I0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgX2l0ZXJhdG9yRXJyb3I0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3I0ID0gZWxlbXMuc3BsaWNlKHRlbXBJbmRleCwgMSArIHByZXZJbmRleCAtIHRlbXBJbmRleClbU3ltYm9sLml0ZXJhdG9yXSgpLCBfc3RlcDQ7ICEoX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbjQgPSAoX3N0ZXA0ID0gX2l0ZXJhdG9yNC5uZXh0KCkpLmRvbmUpOyBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uNCA9IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2VsID0gX3N0ZXA0LnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgb24oX2VsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIF9kaWRJdGVyYXRvckVycm9yNCA9IHRydWU7XG4gICAgICAgICAgICAgIF9pdGVyYXRvckVycm9yNCA9IGVycjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uNCAmJiBfaXRlcmF0b3I0LnJldHVybikge1xuICAgICAgICAgICAgICAgICAgX2l0ZXJhdG9yNC5yZXR1cm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKF9kaWRJdGVyYXRvckVycm9yNCkge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgX2l0ZXJhdG9yRXJyb3I0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBiYWxhbmNlKCk7XG4gICAgICAgICAgICBuZWVkbGUgPSBuZWVkbGUucmVwbGFjZSh3b3JkLCAnJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBfZGlkSXRlcmF0b3JFcnJvcjIgPSB0cnVlO1xuICAgICAgICBfaXRlcmF0b3JFcnJvcjIgPSBlcnI7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICghX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbjIgJiYgX2l0ZXJhdG9yMi5yZXR1cm4pIHtcbiAgICAgICAgICAgIF9pdGVyYXRvcjIucmV0dXJuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGlmIChfZGlkSXRlcmF0b3JFcnJvcjIpIHtcbiAgICAgICAgICAgIHRocm93IF9pdGVyYXRvckVycm9yMjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmdXp6eSgpIHtcbiAgICAgIHZhciBfaXRlcmF0b3JOb3JtYWxDb21wbGV0aW9uNSA9IHRydWU7XG4gICAgICB2YXIgX2RpZEl0ZXJhdG9yRXJyb3I1ID0gZmFsc2U7XG4gICAgICB2YXIgX2l0ZXJhdG9yRXJyb3I1ID0gdW5kZWZpbmVkO1xuXG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3I1ID0gbmVlZGxlW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3N0ZXA1OyAhKF9pdGVyYXRvck5vcm1hbENvbXBsZXRpb241ID0gKF9zdGVwNSA9IF9pdGVyYXRvcjUubmV4dCgpKS5kb25lKTsgX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbjUgPSB0cnVlKSB7XG4gICAgICAgICAgdmFyIGlucHV0ID0gX3N0ZXA1LnZhbHVlO1xuXG4gICAgICAgICAgd2hpbGUgKGVsZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIF9lbDIgPSBlbGVtcy5zaGlmdCgpO1xuICAgICAgICAgICAgaWYgKChfZWwyLmlubmVyVGV4dCB8fCBfZWwyLnRleHRDb250ZW50IHx8ICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpID09PSBpbnB1dC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgIG9uKF9lbDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9mZihfZWwyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBfZGlkSXRlcmF0b3JFcnJvcjUgPSB0cnVlO1xuICAgICAgICBfaXRlcmF0b3JFcnJvcjUgPSBlcnI7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICghX2l0ZXJhdG9yTm9ybWFsQ29tcGxldGlvbjUgJiYgX2l0ZXJhdG9yNS5yZXR1cm4pIHtcbiAgICAgICAgICAgIF9pdGVyYXRvcjUucmV0dXJuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGlmIChfZGlkSXRlcmF0b3JFcnJvcjUpIHtcbiAgICAgICAgICAgIHRocm93IF9pdGVyYXRvckVycm9yNTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhclJlbWFpbmRlcigpIHtcbiAgICAgIHdoaWxlIChlbGVtcy5sZW5ndGgpIHtcbiAgICAgICAgb2ZmKGVsZW1zLnNoaWZ0KCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QuYWRkKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb2ZmKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUZXh0Q2hpbGRyZW4oZWwpIHtcbiAgICB2YXIgdGV4dHMgPSBbXTtcbiAgICB2YXIgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihlbCwgTm9kZUZpbHRlci5TSE9XX1RFWFQsIG51bGwsIGZhbHNlKTtcbiAgICB2YXIgbm9kZSA9IHZvaWQgMDtcbiAgICB3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgICB0ZXh0cy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dHM7XG4gIH1cblxuICBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIHJldHVybiAoaXNUZXh0KCkgPyBhcGkuYXBwZW5kVGV4dCA6IGFwaS5hcHBlbmRIVE1MKShnZXRWYWx1ZSh2YWx1ZSkpO1xuICAgIH1cbiAgICB1c2VyU2V0KHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcih2YWx1ZSwgc3VnZ2VzdGlvbikge1xuICAgIGlmIChvLmFuY2hvcikge1xuICAgICAgdmFyIGlsID0gKGlzVGV4dCgpID8gYXBpLmZpbHRlckFuY2hvcmVkVGV4dCA6IGFwaS5maWx0ZXJBbmNob3JlZEhUTUwpKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgICAgIHJldHVybiBpbCA/IHVzZXJGaWx0ZXIoaWwuaW5wdXQsIGlsLnN1Z2dlc3Rpb24pIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB1c2VyRmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzVGV4dCgpIHtcbiAgICByZXR1cm4gaXNJbnB1dChhdHRhY2htZW50KTtcbiAgfVxuICBmdW5jdGlvbiB2aXNpYmxlKCkge1xuICAgIHJldHVybiBjb250YWluZXIuY2xhc3NOYW1lLmluZGV4T2YoJ3NleS1zaG93JykgIT09IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGhpZGRlbihsaSkge1xuICAgIHJldHVybiBsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSAhPT0gLTE7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93KCkge1xuICAgIGV5ZS5yZWZyZXNoKCk7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgKz0gJyBzZXktc2hvdyc7XG4gICAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LXNob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVyKGUpIHtcbiAgICB2YXIgbGVmdCA9IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5O1xuICAgIGlmIChsZWZ0ID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuOyAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgaG9uZXN0IHRvIGdvZCBsZWZ0LWNsaWNrc1xuICAgIH1cbiAgICB0b2dnbGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZSgpIHtcbiAgICBpZiAoIXZpc2libGUoKSkge1xuICAgICAgc2hvdygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0KGxpKSB7XG4gICAgdW5zZWxlY3QoKTtcbiAgICBpZiAobGkpIHtcbiAgICAgIHNlbGVjdGlvbiA9IGxpO1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSArPSAnIHNleS1zZWxlY3RlZCc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdW5zZWxlY3QoKSB7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSA9IHNlbGVjdGlvbi5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zZWxlY3RlZC9nLCAnJyk7XG4gICAgICBzZWxlY3Rpb24gPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUodXAsIG1vdmVzKSB7XG4gICAgdmFyIHRvdGFsID0gYXBpLnNvdXJjZS5sZW5ndGg7XG4gICAgaWYgKHRvdGFsID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb3ZlcyA+IHRvdGFsKSB7XG4gICAgICB1bnNlbGVjdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY2F0ID0gZmluZENhdGVnb3J5KHNlbGVjdGlvbikgfHwgY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgIHZhciBmaXJzdCA9IHVwID8gJ2xhc3RDaGlsZCcgOiAnZmlyc3RDaGlsZCc7XG4gICAgdmFyIGxhc3QgPSB1cCA/ICdmaXJzdENoaWxkJyA6ICdsYXN0Q2hpbGQnO1xuICAgIHZhciBuZXh0ID0gdXAgPyAncHJldmlvdXNTaWJsaW5nJyA6ICduZXh0U2libGluZyc7XG4gICAgdmFyIHByZXYgPSB1cCA/ICduZXh0U2libGluZycgOiAncHJldmlvdXNTaWJsaW5nJztcbiAgICB2YXIgbGkgPSBmaW5kTmV4dCgpO1xuICAgIHNlbGVjdChsaSk7XG5cbiAgICBpZiAoaGlkZGVuKGxpKSkge1xuICAgICAgbW92ZSh1cCwgbW92ZXMgPyBtb3ZlcyArIDEgOiAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2F0ZWdvcnkoZWwpIHtcbiAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICBpZiAoX3Nla3RvcjIuZGVmYXVsdC5tYXRjaGVzU2VsZWN0b3IoZWwucGFyZW50RWxlbWVudCwgJy5zZXktY2F0ZWdvcnknKSkge1xuICAgICAgICAgIHJldHVybiBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmROZXh0KCkge1xuICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICBpZiAoc2VsZWN0aW9uW25leHRdKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbltuZXh0XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2F0W25leHRdICYmIGZpbmRMaXN0KGNhdFtuZXh0XSlbZmlyc3RdKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdFtuZXh0XSlbZmlyc3RdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluZExpc3QoY2F0ZWdvcmllc1tmaXJzdF0pW2ZpcnN0XTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlKCkge1xuICAgIGV5ZS5zbGVlcCgpO1xuICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBjb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktc2hvdy9nLCAnJyk7XG4gICAgdW5zZWxlY3QoKTtcbiAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LWhpZGUnKTtcbiAgICBpZiAoZWwudmFsdWUgPT09IGxhc3RQcmVmaXgpIHtcbiAgICAgIGVsLnZhbHVlID0gJyc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24ga2V5ZG93bihlKSB7XG4gICAgdmFyIHNob3duID0gdmlzaWJsZSgpO1xuICAgIHZhciB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0RPV04pIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfVVApIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUodHJ1ZSk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0JBQ0tTUEFDRSkge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzaG93bikge1xuICAgICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHQuZmFicmljYXRlKHNlbGVjdGlvbiwgJ2NsaWNrJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfRVNDKSB7XG4gICAgICAgIGhpZGUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dOb1Jlc3VsdHMoKSB7XG4gICAgaWYgKG5vbmVNYXRjaCkge1xuICAgICAgbm9uZU1hdGNoLmNsYXNzTGlzdC5yZW1vdmUoJ3NleS1oaWRlJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU5vUmVzdWx0cygpIHtcbiAgICBpZiAobm9uZU1hdGNoKSB7XG4gICAgICBub25lTWF0Y2guY2xhc3NMaXN0LmFkZCgnc2V5LWhpZGUnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJpbmcoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVib3VuY2VkTG9hZGluZyh0cnVlKTtcbiAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LWZpbHRlcicpO1xuICAgIHZhciB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xuICAgIGlmICghby5ibGFua1NlYXJjaCAmJiAhdmFsdWUpIHtcbiAgICAgIGhpZGUoKTtyZXR1cm47XG4gICAgfVxuICAgIHZhciBub21hdGNoID0gbm9NYXRjaGVzKHsgcXVlcnk6IHZhbHVlIH0pO1xuICAgIHZhciBjb3VudCA9IHdhbGtDYXRlZ29yaWVzKCk7XG4gICAgaWYgKGNvdW50ID09PSAwICYmIG5vbWF0Y2ggJiYgaGFzSXRlbXMpIHtcbiAgICAgIHNob3dOb1Jlc3VsdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZU5vUmVzdWx0cygpO1xuICAgIH1cbiAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgbW92ZSgpO1xuICAgIH1cbiAgICBpZiAoIXNlbGVjdGlvbiAmJiAhbm9tYXRjaCkge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcmllcygpIHtcbiAgICAgIHZhciBjYXRlZ29yeSA9IGNhdGVnb3JpZXMuZmlyc3RDaGlsZDtcbiAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICB3aGlsZSAoY2F0ZWdvcnkpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBmaW5kTGlzdChjYXRlZ29yeSk7XG4gICAgICAgIHZhciBwYXJ0aWFsID0gd2Fsa0NhdGVnb3J5KGxpc3QpO1xuICAgICAgICBpZiAocGFydGlhbCA9PT0gMCkge1xuICAgICAgICAgIGNhdGVnb3J5LmNsYXNzTGlzdC5hZGQoJ3NleS1oaWRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudCArPSBwYXJ0aWFsO1xuICAgICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcnkodWwpIHtcbiAgICAgIHZhciBsaSA9IHVsLmZpcnN0Q2hpbGQ7XG4gICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgd2hpbGUgKGxpKSB7XG4gICAgICAgIGlmIChjb3VudCA+PSBsaW1pdCkge1xuICAgICAgICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0LmZhYnJpY2F0ZShsaSwgJ2hvcnNleS1maWx0ZXInKTtcbiAgICAgICAgICBpZiAobGkuY2xhc3NOYW1lLmluZGV4T2YoJ3NleS1oaWRlJykgPT09IC0xKSB7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgaWYgKGhpZ2hsaWdodGVyKSB7XG4gICAgICAgICAgICAgIGhpZ2hsaWdodChsaSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaSA9IGxpLm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmVycmVkRmlsdGVyaW5nTm9FbnRlcihlKSB7XG4gICAgdmFyIHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVmZXJyZWRGaWx0ZXJpbmcoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmVycmVkU2hvdyhlKSB7XG4gICAgdmFyIHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIgfHwgd2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0VGltZW91dChzaG93LCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF1dG9jb21wbGV0ZUV2ZW50VGFyZ2V0KGUpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgaWYgKHRhcmdldCA9PT0gYXR0YWNobWVudCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lciB8fCB0YXJnZXQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25CbHVyKGUpIHtcbiAgICB2YXIgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25DbGljayhlKSB7XG4gICAgaWYgKGF1dG9jb21wbGV0ZUV2ZW50VGFyZ2V0KGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhpZGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlucHV0RXZlbnRzKHJlbW92ZSkge1xuICAgIHZhciBvcCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgaWYgKGV5ZSkge1xuICAgICAgZXllLmRlc3Ryb3koKTtcbiAgICAgIGV5ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmICghcmVtb3ZlKSB7XG4gICAgICBleWUgPSAoMCwgX2J1bGxzZXllMi5kZWZhdWx0KShjb250YWluZXIsIGF0dGFjaG1lbnQsIHtcbiAgICAgICAgY2FyZXQ6IGFueUlucHV0ICYmIGF0dGFjaG1lbnQudGFnTmFtZSAhPT0gJ0lOUFVUJyxcbiAgICAgICAgY29udGV4dDogby5hcHBlbmRUb1xuICAgICAgfSk7XG4gICAgICBpZiAoIXZpc2libGUoKSkge1xuICAgICAgICBleWUuc2xlZXAoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlbW92ZSB8fCBhbnlJbnB1dCAmJiBkb2MuYWN0aXZlRWxlbWVudCAhPT0gYXR0YWNobWVudCkge1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oYXR0YWNobWVudCwgJ2ZvY3VzJywgbG9hZGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvYWRpbmcoKTtcbiAgICB9XG4gICAgaWYgKGFueUlucHV0KSB7XG4gICAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZFNob3cpO1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oYXR0YWNobWVudCwgJ2tleXByZXNzJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBkZWZlcnJlZEZpbHRlcmluZ05vRW50ZXIpO1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oYXR0YWNobWVudCwgJ3Bhc3RlJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICAgIGlmIChvLmF1dG9IaWRlT25CbHVyKSB7XG4gICAgICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywgaGlkZU9uQmx1cik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHRbb3BdKGF0dGFjaG1lbnQsICdjbGljaycsIHRvZ2dsZXIpO1xuICAgICAgX2Nyb3NzdmVudDIuZGVmYXVsdFtvcF0oZG9jRWxlbWVudCwgJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICB9XG4gICAgaWYgKG8uYXV0b0hpZGVPbkNsaWNrKSB7XG4gICAgICBfY3Jvc3N2ZW50Mi5kZWZhdWx0W29wXShkb2MsICdjbGljaycsIGhpZGVPbkNsaWNrKTtcbiAgICB9XG4gICAgaWYgKGZvcm0pIHtcbiAgICAgIF9jcm9zc3ZlbnQyLmRlZmF1bHRbb3BdKGZvcm0sICdzdWJtaXQnLCBoaWRlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGlmIChwYXJlbnQuY29udGFpbnMoY29udGFpbmVyKSkge1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFNldHRlcih2YWx1ZSkge1xuICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XG4gICAgICAgIGVsLnZhbHVlICs9ICcgJyArIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHNldEFwcGVuZHMgPT09IHRydWUpIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MICs9ICcgJyArIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdEl0ZW1SZW5kZXJlcihsaSwgc3VnZ2VzdGlvbikge1xuICAgIHRleHQobGksIGdldFRleHQoc3VnZ2VzdGlvbikpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIoZGl2LCBkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgIT09ICdkZWZhdWx0Jykge1xuICAgICAgdmFyIGlkID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3J5LWlkJyk7XG4gICAgICBkaXYuYXBwZW5kQ2hpbGQoaWQpO1xuICAgICAgdGV4dChpZCwgZGF0YS5pZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdEZpbHRlcihxLCBzdWdnZXN0aW9uKSB7XG4gICAgdmFyIG5lZWRsZSA9IHEudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgdGV4dCA9IGdldFRleHQoc3VnZ2VzdGlvbikgfHwgJyc7XG4gICAgaWYgKCgwLCBfZnV6enlzZWFyY2gyLmRlZmF1bHQpKG5lZWRsZSwgdGV4dC50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHZhciB2YWx1ZSA9IGdldFZhbHVlKHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoMCwgX2Z1enp5c2VhcmNoMi5kZWZhdWx0KShuZWVkbGUsIHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9vcGJhY2tUb0FuY2hvcih0ZXh0LCBwKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHZhciBhbmNob3JlZCA9IGZhbHNlO1xuICAgIHZhciBzdGFydCA9IHAuc3RhcnQ7XG4gICAgd2hpbGUgKGFuY2hvcmVkID09PSBmYWxzZSAmJiBzdGFydCA+PSAwKSB7XG4gICAgICByZXN1bHQgPSB0ZXh0LnN1YnN0cihzdGFydCAtIDEsIHAuc3RhcnQgLSBzdGFydCArIDEpO1xuICAgICAgYW5jaG9yZWQgPSByYW5jaG9ybGVmdC50ZXN0KHJlc3VsdCk7XG4gICAgICBzdGFydC0tO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYW5jaG9yZWQgPyByZXN1bHQgOiBudWxsLFxuICAgICAgc3RhcnQ6IHN0YXJ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkVGV4dChxLCBzdWdnZXN0aW9uKSB7XG4gICAgdmFyIHBvc2l0aW9uID0gKDAsIF9zZWxsMi5kZWZhdWx0KShlbCk7XG4gICAgdmFyIGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihxLCBwb3NpdGlvbikudGV4dDtcbiAgICBpZiAoaW5wdXQpIHtcbiAgICAgIHJldHVybiB7IGlucHV0OiBpbnB1dCwgc3VnZ2VzdGlvbjogc3VnZ2VzdGlvbiB9O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFRleHQodmFsdWUpIHtcbiAgICB2YXIgY3VycmVudCA9IGVsLnZhbHVlO1xuICAgIHZhciBwb3NpdGlvbiA9ICgwLCBfc2VsbDIuZGVmYXVsdCkoZWwpO1xuICAgIHZhciBpbnB1dCA9IGxvb3BiYWNrVG9BbmNob3IoY3VycmVudCwgcG9zaXRpb24pO1xuICAgIHZhciBsZWZ0ID0gY3VycmVudC5zdWJzdHIoMCwgaW5wdXQuc3RhcnQpO1xuICAgIHZhciByaWdodCA9IGN1cnJlbnQuc3Vic3RyKGlucHV0LnN0YXJ0ICsgaW5wdXQudGV4dC5sZW5ndGggKyAocG9zaXRpb24uZW5kIC0gcG9zaXRpb24uc3RhcnQpKTtcbiAgICB2YXIgYmVmb3JlID0gbGVmdCArIHZhbHVlICsgJyAnO1xuXG4gICAgZWwudmFsdWUgPSBiZWZvcmUgKyByaWdodDtcbiAgICAoMCwgX3NlbGwyLmRlZmF1bHQpKGVsLCB7IHN0YXJ0OiBiZWZvcmUubGVuZ3RoLCBlbmQ6IGJlZm9yZS5sZW5ndGggfSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbmNob3JlZEhUTUwoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEhUTUwoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRMaXN0KGNhdGVnb3J5KSB7XG4gICAgcmV0dXJuICgwLCBfc2VrdG9yMi5kZWZhdWx0KSgnLnNleS1saXN0JywgY2F0ZWdvcnkpWzBdO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQoZWwpIHtcbiAgcmV0dXJuIGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbn1cblxuZnVuY3Rpb24gdGFnKHR5cGUsIGNsYXNzTmFtZSkge1xuICB2YXIgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGRlZmVyKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dChmbiwgMCk7XG4gIH07XG59XG5mdW5jdGlvbiB0ZXh0KGVsLCB2YWx1ZSkge1xuICBlbC5pbm5lclRleHQgPSBlbC50ZXh0Q29udGVudCA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0VkaXRhYmxlKGVsKSB7XG4gIHZhciB2YWx1ZSA9IGVsLmdldEF0dHJpYnV0ZSgnY29udGVudEVkaXRhYmxlJyk7XG4gIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodmFsdWUgPT09ICd0cnVlJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgcmV0dXJuIGlzRWRpdGFibGUoZWwucGFyZW50RWxlbWVudCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvcnNleTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltaHZjbk5sZVM1cWN5SmRMQ0p1WVcxbGN5STZXeUpMUlZsZlFrRkRTMU5RUVVORklpd2lTMFZaWDBWT1ZFVlNJaXdpUzBWWlgwVlRReUlzSWt0RldWOVZVQ0lzSWt0RldWOUVUMWRPSWl3aVMwVlpYMVJCUWlJc0ltUnZZeUlzSW1SdlkzVnRaVzUwSWl3aVpHOWpSV3hsYldWdWRDSXNJbVJ2WTNWdFpXNTBSV3hsYldWdWRDSXNJbWh2Y25ObGVTSXNJbVZzSWl3aWIzQjBhVzl1Y3lJc0luTmxkRUZ3Y0dWdVpITWlMQ0p6WlhRaUxDSm1hV3gwWlhJaUxDSnpiM1Z5WTJVaUxDSmpZV05vWlNJc0luQnlaV1JwWTNST1pYaDBVMlZoY21Ob0lpd2ljbVZ1WkdWeVNYUmxiU0lzSW5KbGJtUmxja05oZEdWbmIzSjVJaXdpWW14aGJtdFRaV0Z5WTJnaUxDSmhjSEJsYm1SVWJ5SXNJbUZ1WTJodmNpSXNJbVJsWW05MWJtTmxJaXdpWTJGamFHbHVaeUlzSW5WelpYSkhaWFJVWlhoMElpd2laMlYwVkdWNGRDSXNJblZ6WlhKSFpYUldZV3gxWlNJc0ltZGxkRlpoYkhWbElpd2laQ0lzSW5SdlUzUnlhVzVuSWl3aWNISmxkbWx2ZFhOVGRXZG5aWE4wYVc5dWN5SXNJbkJ5WlhacGIzVnpVMlZzWldOMGFXOXVJaXdpYkdsdGFYUWlMQ0pPZFcxaVpYSWlMQ0pKYm1acGJtbDBlU0lzSW1OdmJYQnNaWFJsY2lJc0ltRjFkRzlqYjIxd2JHVjBaU0lzSW5OdmRYSmpaVVoxYm1OMGFXOXVJaXdpYm05TllYUmphR1Z6SWl3aWJtOU5ZWFJqYUdWelZHVjRkQ0lzSW5NaUxDSjJZV3gxWlNJc0ltUmxabUYxYkhSVFpYUjBaWElpTENKbGJXbDBJaXdpWkdGMFlTSXNJbkYxWlhKNUlpd2liR1Z1WjNSb0lpd2laRzl1WlNJc0ltaGhjMmdpTENKbGJuUnllU0lzSW5OMFlYSjBJaXdpWTNKbFlYUmxaQ0lzSW1kbGRGUnBiV1VpTENKa2RYSmhkR2x2YmlJc0ltUnBabVlpTENKbWNtVnphQ0lzSWtSaGRHVWlMQ0pwZEdWdGN5SXNJbk5zYVdObElpd2ljMjkxY21ObFJHRjBZU0lzSW1sdWNIVjBJaXdpYzI5MWNtTmxaQ0lzSW1WeWNpSXNJbkpsYzNWc2RDSXNJbU52Ym5OdmJHVWlMQ0pzYjJjaUxDSkJjbkpoZVNJc0ltbHpRWEp5WVhraUxDSnZJaXdpY0dGeVpXNTBJaXdpWW05a2VTSXNJbVp2Y20waUxDSm9hV2RvYkdsbmFIUmxjaUlzSW1ocFoyaHNhV2RvZEVOdmJYQnNaWFJsVjI5eVpITWlMQ0prWldaaGRXeDBTWFJsYlZKbGJtUmxjbVZ5SWl3aVpHVm1ZWFZzZEVOaGRHVm5iM0o1VW1WdVpHVnlaWElpTENKMWMyVnlSbWxzZEdWeUlpd2laR1ZtWVhWc2RFWnBiSFJsY2lJc0luVnpaWEpUWlhRaUxDSmpZWFJsWjI5eWFXVnpJaXdpZEdGbklpd2lZMjl1ZEdGcGJtVnlJaXdpWkdWbVpYSnlaV1JHYVd4MFpYSnBibWNpTENKa1pXWmxjaUlzSW1acGJIUmxjbWx1WnlJc0luTjBZWFJsSWl3aVkyOTFiblJsY2lJc0ltTmhkR1ZuYjNKNVRXRndJaXdpVDJKcVpXTjBJaXdpWTNKbFlYUmxJaXdpYzJWc1pXTjBhVzl1SWl3aVpYbGxJaXdpWVhSMFlXTm9iV1Z1ZENJc0ltNXZibVZOWVhSamFDSXNJblJsZUhSSmJuQjFkQ0lzSW1GdWVVbHVjSFYwSWl3aWNtRnVZMmh2Y214bFpuUWlMQ0p5WVc1amFHOXljbWxuYUhRaUxDSnNZWE4wVUhKbFptbDRJaXdpWkdWaWIzVnVZMlZVYVcxbElpd2laR1ZpYjNWdVkyVmtURzloWkdsdVp5SXNJbXh2WVdScGJtY2lMQ0poZFhSdlNHbGtaVTl1UW14MWNpSXNJbUYxZEc5SWFXUmxUMjVEYkdsamF5SXNJbUYxZEc5VGFHOTNUMjVWY0VSdmQyNGlMQ0owWVdkT1lXMWxJaXdpVW1WblJYaHdJaXdpYUdGelNYUmxiWE1pTENKaGNHa2lMQ0pqYkdWaGNpSXNJbk5vYjNjaUxDSm9hV1JsSWl3aWRHOW5aMnhsSWl3aVpHVnpkSEp2ZVNJc0luSmxabkpsYzJoUWIzTnBkR2x2YmlJc0ltRndjR1Z1WkZSbGVIUWlMQ0poY0hCbGJtUklWRTFNSWl3aVptbHNkR1Z5UVc1amFHOXlaV1JVWlhoMElpd2labWxzZEdWeVFXNWphRzl5WldSSVZFMU1JaXdpWkdWbVlYVnNkRUZ3Y0dWdVpGUmxlSFFpTENKeVpYUmhjbWRsZENJc0ltRndjR1Z1WkVOb2FXeGtJaXdpZEdWNGRDSXNJbk5sZEVGMGRISnBZblYwWlNJc0lteHZZV1JsWkNJc0ltbHVjSFYwUlhabGJuUnpJaXdpYVhORlpHbDBZV0pzWlNJc0luSmxabkpsYzJnaUxDSm1iM0pqWlZOb2IzY2lMQ0pqY205emMzWmxiblFpTENKeVpXMXZkbVVpTENKeVpXRmtTVzV3ZFhRaUxDSmliR0Z1YTFGMVpYSjVJaXdpWm05eVJXRmphQ0lzSW1OaGRDSXNJbXhwYzNRaUxDSmhaR1FpTENKemRXZG5aWE4wYVc5dUlpd2lkVzV6Wld4bFkzUWlMQ0pzWVhOMFEyaHBiR1FpTENKeVpXMXZkbVZEYUdsc1pDSXNJbWx1Ym1WeVNGUk5UQ0lzSW5SeWFXMGlMQ0puWlhSRFlYUmxaMjl5ZVNJc0ltbGtJaXdpWTNKbFlYUmxRMkYwWldkdmNua2lMQ0pqWVhSbFoyOXllU0lzSW5Wc0lpd2lZMkYwWldkdmNubEVZWFJoSWl3aWJHa2lMQ0ppY21WaGEzVndSbTl5U0dsbmFHeHBaMmgwWlhJaUxDSm9iM1psY2xOMVoyZGxjM1JwYjI0aUxDSmpiR2xqYTJWa1UzVm5aMlZ6ZEdsdmJpSXNJbVpwYkhSbGNrbDBaVzBpTENKb2FXUmxTWFJsYlNJc0luQjFjMmdpTENKelpXeGxZM1FpTENKbWIyTjFjeUlzSW1Oc1lYTnpUbUZ0WlNJc0luSmxjR3hoWTJVaUxDSm1ZV0p5YVdOaGRHVWlMQ0pvYVdSa1pXNGlMQ0puWlhSVVpYaDBRMmhwYkdSeVpXNGlMQ0p3WVhKbGJuUkZiR1Z0Wlc1MElpd2lkR1Y0ZEVOdmJuUmxiblFpTENKdWIyUmxWbUZzZFdVaUxDSmphR0Z5SWl3aWFXNXpaWEowUW1WbWIzSmxJaXdpYzNCaGJrWnZjaUlzSW5Od1lXNGlMQ0pqY21WaGRHVkZiR1Z0Wlc1MElpd2lhVzV1WlhKVVpYaDBJaXdpYUdsbmFHeHBaMmgwSWl3aWJtVmxaR3hsSWl3aWNuZHZjbVFpTENKM2IzSmtjeUlzSW5Od2JHbDBJaXdpZHlJc0ltVnNaVzF6SWl3aWNYVmxjbmxUWld4bFkzUnZja0ZzYkNJc0ltTm9ZWEp6SWl3aWMzUmhjblJKYm1SbGVDSXNJbUpoYkdGdVkyVWlMQ0ozYUc5c1pTSXNJbVoxZW5wNUlpd2lZMnhsWVhKU1pXMWhhVzVrWlhJaUxDSnRZWEFpTENKM2IzSmtJaXdpZEdWdGNFbHVaR1Y0SWl3aWNtVjBjbmtpTENKcGJtbDBJaXdpY0hKbGRrbHVaR1Y0SWl3aWFTSXNJbWx1WkdWNFQyWWlMQ0ptWVdsc0lpd2ljM0JzYVdObElpd2liMjRpTENKemFHbG1kQ0lzSW5SdlRHOWpZV3hsVEc5M1pYSkRZWE5sSWl3aWIyWm1JaXdpWTJnaUxDSmpiR0Z6YzB4cGMzUWlMQ0owWlhoMGN5SXNJbmRoYkd0bGNpSXNJbU55WldGMFpWUnlaV1ZYWVd4clpYSWlMQ0pPYjJSbFJtbHNkR1Z5SWl3aVUwaFBWMTlVUlZoVUlpd2libTlrWlNJc0ltNWxlSFJPYjJSbElpd2lhWE5VWlhoMElpd2lhV3dpTENKcGMwbHVjSFYwSWl3aWRtbHphV0pzWlNJc0luUnZaMmRzWlhJaUxDSmxJaXdpYkdWbWRDSXNJbmRvYVdOb0lpd2liV1YwWVV0bGVTSXNJbU4wY214TFpYa2lMQ0p0YjNabElpd2lkWEFpTENKdGIzWmxjeUlzSW5SdmRHRnNJaXdpWm1sdVpFTmhkR1ZuYjNKNUlpd2labWx5YzNSRGFHbHNaQ0lzSW1acGNuTjBJaXdpYkdGemRDSXNJbTVsZUhRaUxDSndjbVYySWl3aVptbHVaRTVsZUhRaUxDSnpaV3QwYjNJaUxDSnRZWFJqYUdWelUyVnNaV04wYjNJaUxDSm1hVzVrVEdsemRDSXNJbk5zWldWd0lpd2lhMlY1Wkc5M2JpSXNJbk5vYjNkdUlpd2lhMlY1UTI5a1pTSXNJbk4wYjNBaUxDSnpkRzl3VUhKdmNHRm5ZWFJwYjI0aUxDSndjbVYyWlc1MFJHVm1ZWFZzZENJc0luTm9iM2RPYjFKbGMzVnNkSE1pTENKb2FXUmxUbTlTWlhOMWJIUnpJaXdpYm05dFlYUmphQ0lzSW1OdmRXNTBJaXdpZDJGc2EwTmhkR1ZuYjNKcFpYTWlMQ0p3WVhKMGFXRnNJaXdpZDJGc2EwTmhkR1ZuYjNKNUlpd2libVY0ZEZOcFlteHBibWNpTENKa1pXWmxjbkpsWkVacGJIUmxjbWx1WjA1dlJXNTBaWElpTENKa1pXWmxjbkpsWkZOb2IzY2lMQ0p6WlhSVWFXMWxiM1YwSWl3aVlYVjBiMk52YlhCc1pYUmxSWFpsYm5SVVlYSm5aWFFpTENKMFlYSm5aWFFpTENKd1lYSmxiblJPYjJSbElpd2lhR2xrWlU5dVFteDFjaUlzSW1ocFpHVlBia05zYVdOcklpd2liM0FpTENKallYSmxkQ0lzSW1OdmJuUmxlSFFpTENKaFkzUnBkbVZGYkdWdFpXNTBJaXdpWTI5dWRHRnBibk1pTENKa2FYWWlMQ0p4SWl3aWRHOU1iM2RsY2tOaGMyVWlMQ0pzYjI5d1ltRmphMVJ2UVc1amFHOXlJaXdpY0NJc0ltRnVZMmh2Y21Wa0lpd2ljM1ZpYzNSeUlpd2lkR1Z6ZENJc0luQnZjMmwwYVc5dUlpd2lZM1Z5Y21WdWRDSXNJbkpwWjJoMElpd2laVzVrSWl3aVltVm1iM0psSWl3aVJYSnliM0lpTENKMGVYQmxJaXdpWm00aUxDSm5aWFJCZEhSeWFXSjFkR1VpTENKdGIyUjFiR1VpTENKbGVIQnZjblJ6SWwwc0ltMWhjSEJwYm1keklqb2lRVUZCUVRzN1FVRkZRVHM3T3p0QlFVTkJPenM3TzBGQlEwRTdPenM3UVVGRFFUczdPenRCUVVOQk96czdPMEZCUTBFN096czdRVUZEUVRzN096dEJRVU5CT3pzN096czdPenRCUVVOQkxFbEJRVTFCTEdkQ1FVRm5RaXhEUVVGMFFqdEJRVU5CTEVsQlFVMURMRmxCUVZrc1JVRkJiRUk3UVVGRFFTeEpRVUZOUXl4VlFVRlZMRVZCUVdoQ08wRkJRMEVzU1VGQlRVTXNVMEZCVXl4RlFVRm1PMEZCUTBFc1NVRkJUVU1zVjBGQlZ5eEZRVUZxUWp0QlFVTkJMRWxCUVUxRExGVkJRVlVzUTBGQmFFSTdRVUZEUVN4SlFVRk5ReXhOUVVGTlF5eFJRVUZhTzBGQlEwRXNTVUZCVFVNc1lVRkJZVVlzU1VGQlNVY3NaVUZCZGtJN08wRkJSVUVzVTBGQlUwTXNUVUZCVkN4RFFVRnBRa01zUlVGQmFrSXNSVUZCYlVNN1FVRkJRU3hOUVVGa1F5eFBRVUZqTEhWRlFVRktMRVZCUVVrN1FVRkJRU3hOUVVVdlFrTXNWVUZHSzBJc1IwRmpOMEpFTEU5QlpEWkNMRU5CUlM5Q1F5eFZRVVlyUWp0QlFVRkJMRTFCUnk5Q1F5eEpRVWdyUWl4SFFXTTNRa1lzVDBGa05rSXNRMEZITDBKRkxFZEJTQ3RDTzBGQlFVRXNUVUZKTDBKRExFMUJTaXRDTEVkQll6ZENTQ3hQUVdRMlFpeERRVWt2UWtjc1RVRktLMEk3UVVGQlFTeE5RVXN2UWtNc1RVRk1LMElzUjBGak4wSktMRTlCWkRaQ0xFTkJTeTlDU1N4TlFVd3JRanRCUVVGQkxIVkNRV00zUWtvc1QwRmtOa0lzUTBGTkwwSkxMRXRCVGl0Q08wRkJRVUVzVFVGTkwwSkJMRXRCVGl0Q0xHdERRVTEyUWl4RlFVNTFRanRCUVVGQkxFMUJUeTlDUXl4cFFrRlFLMElzUjBGak4wSk9MRTlCWkRaQ0xFTkJUeTlDVFN4cFFrRlFLMEk3UVVGQlFTeE5RVkV2UWtNc1ZVRlNLMElzUjBGak4wSlFMRTlCWkRaQ0xFTkJVUzlDVHl4VlFWSXJRanRCUVVGQkxFMUJVeTlDUXl4alFWUXJRaXhIUVdNM1FsSXNUMEZrTmtJc1EwRlRMMEpSTEdOQlZDdENPMEZCUVVFc1RVRlZMMEpETEZkQlZpdENMRWRCWXpkQ1ZDeFBRV1EyUWl4RFFWVXZRbE1zVjBGV0swSTdRVUZCUVN4TlFWY3ZRa01zVVVGWUswSXNSMEZqTjBKV0xFOUJaRFpDTEVOQlZ5OUNWU3hSUVZnclFqdEJRVUZCTEUxQldTOUNReXhOUVZvclFpeEhRV00zUWxnc1QwRmtOa0lzUTBGWkwwSlhMRTFCV2l0Q08wRkJRVUVzVFVGaEwwSkRMRkZCWWl0Q0xFZEJZemRDV2l4UFFXUTJRaXhEUVdFdlFsa3NVVUZpSzBJN08wRkJaV3BETEUxQlFVMURMRlZCUVZWaUxGRkJRVkZMTEV0QlFWSXNTMEZCYTBJc1MwRkJiRU03UVVGRFFTeE5RVUZKTEVOQlFVTkVMRTFCUVV3c1JVRkJZVHRCUVVOWU8wRkJRMFE3TzBGQlJVUXNUVUZCVFZVc1kwRkJZMlFzVVVGQlVXVXNUMEZCTlVJN1FVRkRRU3hOUVVGTlF5eGxRVUZsYUVJc1VVRkJVV2xDTEZGQlFUZENPMEZCUTBFc1RVRkJUVVlzVlVGRFNpeFBRVUZQUkN4WFFVRlFMRXRCUVhWQ0xGRkJRWFpDTEVkQlFXdERPMEZCUVVFc1YwRkJTMGtzUlVGQlJVb3NWMEZCUml4RFFVRk1PMEZCUVVFc1IwRkJiRU1zUjBGRFFTeFBRVUZQUVN4WFFVRlFMRXRCUVhWQ0xGVkJRWFpDTEVkQlFXOURRU3hYUVVGd1F5eEhRVU5CTzBGQlFVRXNWMEZCUzBrc1JVRkJSVU1zVVVGQlJpeEZRVUZNTzBGQlFVRXNSMEZJUmp0QlFVdEJMRTFCUVUxR0xGZEJRMG9zVDBGQlQwUXNXVUZCVUN4TFFVRjNRaXhSUVVGNFFpeEhRVUZ0UXp0QlFVRkJMRmRCUVV0RkxFVkJRVVZHTEZsQlFVWXNRMEZCVER0QlFVRkJMRWRCUVc1RExFZEJRMEVzVDBGQlQwRXNXVUZCVUN4TFFVRjNRaXhWUVVGNFFpeEhRVUZ4UTBFc1dVRkJja01zUjBGRFFUdEJRVUZCTEZkQlFVdEZMRU5CUVV3N1FVRkJRU3hIUVVoR096dEJRVTFCTEUxQlFVbEZMSE5DUVVGelFpeEZRVUV4UWp0QlFVTkJMRTFCUVVsRExHOUNRVUZ2UWl4SlFVRjRRanRCUVVOQkxFMUJRVTFETEZGQlFWRkRMRTlCUVU5MlFpeFJRVUZSYzBJc1MwRkJaaXhMUVVGNVFrVXNVVUZCZGtNN1FVRkRRU3hOUVVGTlF5eFpRVUZaUXl4aFFVRmhNMElzUlVGQllpeEZRVUZwUWp0QlFVTnFRMHNzV1VGQlVYVkNMR05CUkhsQ08wRkJSV3BEVEN4blFrRkdhVU03UVVGSGFrTlFMRzlDUVVocFF6dEJRVWxxUTBVc2MwSkJTbWxETzBGQlMycERhRUlzTUVKQlRHbERPMEZCVFdwRFN5eDNRMEZPYVVNN1FVRlBha05ETERCQ1FWQnBRenRCUVZGcVEwTXNhME5CVW1sRE8wRkJVMnBEUlN4elFrRlVhVU03UVVGVmFrTkRMR3RDUVZacFF6dEJRVmRxUTJsQ0xIZENRVmhwUXp0QlFWbHFRME1zYlVKQlFXVTNRaXhSUVVGUk5FSXNVMEZhVlR0QlFXRnFRMjVDTERSQ1FXSnBRenRCUVdOcVEwY3NjMEpCWkdsRE8wRkJaV3BEVml4UFFXWnBReXhsUVdVMVFqUkNMRU5CWmpSQ0xFVkJaWHBDTzBGQlEwNHNWVUZCU1RkQ0xHVkJRV1VzU1VGQmJrSXNSVUZCZVVJN1FVRkRka0pHTEZkQlFVZG5ReXhMUVVGSUxFZEJRVmNzUlVGQldEdEJRVU5FTzBGQlEwUldMREJDUVVGdlFsTXNRMEZCY0VJN1FVRkRRU3hQUVVGRE5VSXNVVUZCVDNWQ0xGVkJRVlZQTEdGQlFXeENMRVZCUVdsRGFrSXNVVUZCVVdVc1EwRkJVaXhEUVVGcVF5eEZRVUUyUTBFc1EwRkJOME03UVVGRFFVd3NaMEpCUVZWUkxFbEJRVllzUTBGQlpTeFZRVUZtTzBGQlEwUXNTMEYwUW1kRE96dEJRWFZDYWtNNVFqdEJRWFpDYVVNc1IwRkJha0lzUTBGQmJFSTdRVUY1UWtFc1UwRkJUM05DTEZOQlFWQTdRVUZEUVN4WFFVRlRSeXhUUVVGVUxFTkJRVzlDVFN4SlFVRndRaXhGUVVFd1FqdEJRVU40UWl4UlFVRkpMRU5CUVVOc1F5eFJRVUZSTkVJc1UwRkJZaXhGUVVGM1FqdEJRVU4wUWl4aFFVRlBMRXRCUVZBN1FVRkRSRHRCUVVORUxGZEJRVTlOTEV0QlFVdERMRXRCUVV3c1EwRkJWME1zVFVGQmJFSTdRVUZEUkR0QlFVTkVMRmRCUVZOVUxHTkJRVlFzUTBGQmVVSlBMRWxCUVhwQ0xFVkJRU3RDUnl4SlFVRXZRaXhGUVVGeFF6dEJRVUZCTEZGQlF6VkNSaXhMUVVRMFFpeEhRVU5hUkN4SlFVUlpMRU5CUXpWQ1F5eExRVVEwUWp0QlFVRkJMRkZCUTNKQ1lpeExRVVJ4UWl4SFFVTmFXU3hKUVVSWkxFTkJRM0pDV2l4TFFVUnhRanM3UVVGRmJrTXNVVUZCU1N4RFFVRkRkRUlzVVVGQlVWTXNWMEZCVkN4SlFVRjNRakJDTEUxQlFVMURMRTFCUVU0c1MwRkJhVUlzUTBGQk4wTXNSVUZCWjBRN1FVRkRPVU5ETEZkQlFVc3NTVUZCVEN4RlFVRlhMRVZCUVZnc1JVRkJaU3hKUVVGbUxFVkJRWE5DTzBGQlEzWkNPMEZCUTBRc1VVRkJTVm9zVTBGQlNpeEZRVUZsTzBGQlEySkJMR2RDUVVGVlVTeEpRVUZXTEVOQlFXVXNZMEZCWmp0QlFVTkVPMEZCUTBRc1VVRkJUVXNzVDBGQlR5eDFRa0ZCU1Vnc1MwRkJTaXhEUVVGaUxFTkJVbTFETEVOQlVWWTdRVUZEZWtJc1VVRkJTWFJDTEU5QlFVb3NSVUZCWVR0QlFVTllMRlZCUVUwd1FpeFJRVUZSYkVNc1RVRkJUV2xETEVsQlFVNHNRMEZCWkR0QlFVTkJMRlZCUVVsRExFdEJRVW9zUlVGQlZ6dEJRVU5VTEZsQlFVMURMRkZCUVZGRUxFMUJRVTFGTEU5QlFVNHNRMEZCWTBNc1QwRkJaQ3hGUVVGa08wRkJRMEVzV1VGQlRVTXNWMEZCVjNSRExFMUJRVTF6UXl4UlFVRk9MRWxCUVd0Q0xFdEJRVXNzUlVGQlRDeEhRVUZWTEVWQlFUZERPMEZCUTBFc1dVRkJUVU1zVDBGQlQwUXNWMEZCVnl4SlFVRjRRanRCUVVOQkxGbEJRVTFGTEZGQlFWRXNTVUZCU1VNc1NVRkJTaXhEUVVGVFRpeFJRVUZSU1N4SlFVRnFRaXhKUVVGNVFpeEpRVUZKUlN4SlFVRktMRVZCUVhaRE8wRkJRMEVzV1VGQlNVUXNTMEZCU2l4RlFVRlhPMEZCUTFSU0xHVkJRVXNzU1VGQlRDeEZRVUZYUlN4TlFVRk5VU3hMUVVGT0xFTkJRVmxETEV0QlFWb3NSVUZCV0N4RlFVRnBRenRCUVVOc1F6dEJRVU5HTzBGQlEwWTdRVUZEUkN4UlFVRkpReXhoUVVGaE8wRkJRMlkzUWl3eVFrRkJjVUpCTEc5Q1FVRnZRalJDTEV0QlFYQkNMRVZCUkU0N1FVRkZaak5DTERCRFFVWmxPMEZCUjJZMlFpeGhRVUZQWml4TFFVaFJPMEZCU1dZMVFpdzBRa0ZLWlR0QlFVdG1ReXh2UTBGTVpUdEJRVTFtWXp0QlFVNWxMRXRCUVdwQ08wRkJVVUVzVVVGQlNTeFBRVUZQZEVJc1VVRkJVVWtzVFVGQlppeExRVUV3UWl4VlFVRTVRaXhGUVVFd1F6dEJRVU40UTBvc1kwRkJVVWtzVFVGQlVpeERRVUZsTmtNc1ZVRkJaaXhGUVVFeVFrVXNUMEZCTTBJN1FVRkRSQ3hMUVVaRUxFMUJSVTg3UVVGRFRFRXNZMEZCVVN4SlFVRlNMRVZCUVdOdVJDeFJRVUZSU1N4TlFVRjBRanRCUVVORU8wRkJRMFFzWVVGQlV5dERMRTlCUVZRc1EwRkJhMEpETEVkQlFXeENMRVZCUVhWQ1F5eE5RVUYyUWl4RlFVRXJRanRCUVVNM1FpeFZRVUZKUkN4SFFVRktMRVZCUVZNN1FVRkRVRVVzWjBKQlFWRkRMRWRCUVZJc1EwRkJXU3cwUWtGQldpeEZRVUV3UTBnc1IwRkJNVU1zUlVGQkswTnlSQ3hGUVVFdlF6dEJRVU5CYzBNc1lVRkJTMlVzUjBGQlRDeEZRVUZWTEVWQlFWWTdRVUZEUkR0QlFVTkVMRlZCUVUxTUxGRkJRVkZUTEUxQlFVMURMRTlCUVU0c1EwRkJZMG9zVFVGQlpDeEpRVUYzUWtFc1RVRkJlRUlzUjBGQmFVTXNSVUZCTDBNN1FVRkRRU3hWUVVGSmVFTXNUMEZCU2l4RlFVRmhPMEZCUTFoU0xHTkJRVTFwUXl4SlFVRk9MRWxCUVdNc1JVRkJSVWNzVTBGQlV5eEpRVUZKU3l4SlFVRktMRVZCUVZnc1JVRkJkVUpETEZsQlFYWkNMRVZCUVdRN1FVRkRSRHRCUVVORU0wSXNORUpCUVhOQ01rSXNTMEZCZEVJN1FVRkRRVllzVjBGQlN5eEpRVUZNTEVWQlFWZFZMRTFCUVUxRExFdEJRVTRzUlVGQldEdEJRVU5FTzBGQlEwWTdRVUZEUmpzN1FVRkZSQ3hUUVVGVGRFSXNXVUZCVkN4RFFVRjFRak5DTEVWQlFYWkNMRVZCUVhsRE8wRkJRVUVzVFVGQlpFTXNUMEZCWXl4MVJVRkJTaXhGUVVGSk96dEJRVU4yUXl4TlFVRk5NRVFzU1VGQlNURkVMRTlCUVZZN1FVRkRRU3hOUVVGTk1rUXNVMEZCVTBRc1JVRkJSV2hFTEZGQlFVWXNTVUZCWTJoQ0xFbEJRVWxyUlN4SlFVRnFRenRCUVVaMVF5eE5RVWx5UXpkRExFOUJTbkZETEVkQlpXNURNa01zUTBGbWJVTXNRMEZKY2tNelF5eFBRVXB4UXp0QlFVRkJMRTFCUzNKRFJTeFJRVXh4UXl4SFFXVnVRM2xETEVOQlptMURMRU5CUzNKRGVrTXNVVUZNY1VNN1FVRkJRU3hOUVUxeVF6UkRMRWxCVG5GRExFZEJaVzVEU0N4RFFXWnRReXhEUVUxeVEwY3NTVUZPY1VNN1FVRkJRU3hOUVU5eVEzcEVMRTFCVUhGRExFZEJaVzVEYzBRc1EwRm1iVU1zUTBGUGNrTjBSQ3hOUVZCeFF6dEJRVUZCTEUxQlVYSkRkMElzVTBGU2NVTXNSMEZsYmtNNFFpeERRV1p0UXl4RFFWRnlRemxDTEZOQlVuRkRPMEZCUVVFc1RVRlRja05ETEdGQlZIRkRMRWRCWlc1RE5rSXNRMEZtYlVNc1EwRlRja00zUWl4aFFWUnhRenRCUVVGQkxIVkNRV1Z1UXpaQ0xFTkJabTFETEVOQlZYSkRTU3hYUVZaeFF6dEJRVUZCTEUxQlZYSkRRU3hYUVZaeFF5eHJRMEZWZGtJc1NVRldkVUk3UVVGQlFTdzRRa0ZsYmtOS0xFTkJabTFETEVOQlYzSkRTeXh6UWtGWWNVTTdRVUZCUVN4TlFWZHlRMEVzYzBKQldIRkRMSGxEUVZkYUxFbEJXRms3UVVGQlFTeHpRa0ZsYmtOTUxFTkJabTFETEVOQldYSkRia1FzVlVGYWNVTTdRVUZCUVN4TlFWbHlRMEVzVlVGYWNVTXNhVU5CV1hoQ2VVUXNiVUpCV25kQ08wRkJRVUVzTUVKQlpXNURUaXhEUVdadFF5eERRV0Z5UTJ4RUxHTkJZbkZETzBGQlFVRXNUVUZoY2tOQkxHTkJZbkZETEhGRFFXRndRbmxFTEhWQ1FXSnZRanRCUVVGQkxFMUJZM0pEYUVVc1ZVRmtjVU1zUjBGbGJrTjVSQ3hEUVdadFF5eERRV055UTNwRUxGVkJaSEZET3p0QlFXZENka01zVFVGQlRYRkNMRkZCUVZFc1QwRkJUMjlETEVWQlFVVndReXhMUVVGVUxFdEJRVzFDTEZGQlFXNUNMRWRCUVRoQ2IwTXNSVUZCUlhCRExFdEJRV2hETEVkQlFYZERSU3hSUVVGMFJEdEJRVU5CTEUxQlFVMHdReXhoUVVGaFVpeEZRVUZGZGtRc1RVRkJSaXhKUVVGWlowVXNZVUZCTDBJN1FVRkRRU3hOUVVGTlF5eFZRVUZWVml4RlFVRkZlRVFzUjBGQlJpeEpRVUZUT0VJc1lVRkJla0k3UVVGRFFTeE5RVUZOY1VNc1lVRkJZVU1zU1VGQlNTeExRVUZLTEVWQlFWY3NaMEpCUVZnc1EwRkJia0k3UVVGRFFTeE5RVUZOUXl4WlFVRlpSQ3hKUVVGSkxFdEJRVW9zUlVGQlZ5eGxRVUZZTEVOQlFXeENPMEZCUTBFc1RVRkJUVVVzYjBKQlFXOUNReXhOUVVGTlF5eFRRVUZPTEVOQlFURkNPMEZCUTBFc1RVRkJUVU1zVVVGQlVTeEZRVUZGUXl4VFFVRlRMRU5CUVZnc1JVRkJZM3BETEU5QlFVOHNTVUZCY2tJc1JVRkJaRHRCUVVOQkxFMUJRVWt3UXl4alFVRmpReXhQUVVGUFF5eE5RVUZRTEVOQlFXTXNTVUZCWkN4RFFVRnNRanRCUVVOQkxFMUJRVWxETEZsQlFWa3NTVUZCYUVJN1FVRkRRU3hOUVVGSlF5eFpRVUZLTzBGQlEwRXNUVUZCU1VNc1lVRkJZVzVHTEVWQlFXcENPMEZCUTBFc1RVRkJTVzlHTEd0Q1FVRktPMEZCUTBFc1RVRkJTVU1zYTBKQlFVbzdRVUZEUVN4TlFVRkpReXhwUWtGQlNqdEJRVU5CTEUxQlFVbERMRzlDUVVGS08wRkJRMEVzVFVGQlNVTXNjVUpCUVVvN1FVRkRRU3hOUVVGSlF5eGhRVUZoTEVWQlFXcENPMEZCUTBFc1RVRkJUVU1zWlVGQlpTOUNMRVZCUVVVNVF5eFJRVUZHTEVsQlFXTXNSMEZCYmtNN1FVRkRRU3hOUVVGTk9FVXNiVUpCUVcxQ0xIZENRVUZUUXl4UFFVRlVMRVZCUVd0Q1JpeFpRVUZzUWl4RFFVRjZRanM3UVVGRlFTeE5RVUZKTDBJc1JVRkJSV3RETEdOQlFVWXNTMEZCY1VJc1MwRkJTeXhEUVVFNVFpeEZRVUZwUXp0QlFVRkZiRU1zVFVGQlJXdERMR05CUVVZc1IwRkJiVUlzU1VGQmJrSTdRVUZCTUVJN1FVRkROMFFzVFVGQlNXeERMRVZCUVVWdFF5eGxRVUZHTEV0QlFYTkNMRXRCUVVzc1EwRkJMMElzUlVGQmEwTTdRVUZCUlc1RExFMUJRVVZ0UXl4bFFVRkdMRWRCUVc5Q0xFbEJRWEJDTzBGQlFUSkNPMEZCUXk5RUxFMUJRVWx1UXl4RlFVRkZiME1zWjBKQlFVWXNTMEZCZFVJc1MwRkJTeXhEUVVGb1F5eEZRVUZ0UXp0QlFVRkZjRU1zVFVGQlJXOURMR2RDUVVGR0xFZEJRWEZDTDBZc1IwRkJSMmRITEU5QlFVZ3NTMEZCWlN4UFFVRndRenRCUVVFNFF6dEJRVU51Uml4TlFVRkpja01zUlVGQlJTOURMRTFCUVU0c1JVRkJZenRCUVVOYU1rVXNhMEpCUVdNc1NVRkJTVlVzVFVGQlNpeERRVUZYTEUxQlFVMTBReXhGUVVGRkwwTXNUVUZCYmtJc1EwRkJaRHRCUVVOQk5FVXNiVUpCUVdVc1NVRkJTVk1zVFVGQlNpeERRVUZYZEVNc1JVRkJSUzlETEUxQlFVWXNSMEZCVnl4SFFVRjBRaXhEUVVGbU8wRkJRMFE3TzBGQlJVUXNUVUZCU1hOR0xGZEJRVmNzUzBGQlpqdEJRVU5CTEUxQlFVMURMRTFCUVUwc2RVSkJRVkU3UVVGRGJFSjJSaXhaUVVGUkswTXNSVUZCUlM5RExFMUJSRkU3UVVGRmJFSjNSaXhuUWtGR2EwSTdRVUZIYkVKRExHTkJTR3RDTzBGQlNXeENReXhqUVVwclFqdEJRVXRzUWtNc2EwSkJUR3RDTzBGQlRXeENReXh2UWtGT2EwSTdRVUZQYkVKRExHOURRVkJyUWp0QlFWRnNRa01zTUVKQlVtdENPMEZCVTJ4Q1F5d3dRa0ZVYTBJN1FVRlZiRUpETERCRFFWWnJRanRCUVZkc1FrTXNNRU5CV0d0Q08wRkJXV3hDUXl4MVFrRkJiVUpLTEZWQldrUTdRVUZoYkVKMFF5eG5RMEZpYTBJN1FVRmpiRUpJTERSRFFXUnJRanRCUVdWc1FrTXNiMFJCWm10Q08wRkJaMEpzUW1wRExHZERRV2hDYTBJN1FVRnBRbXhDT0VVc2MwSkJha0pyUWp0QlFXdENiRUkxUWl3d1FrRnNRbXRDTzBGQmJVSnNRamxGTEZsQlFWRTdRVUZ1UWxVc1IwRkJVaXhEUVVGYU96dEJRWE5DUVRCSExGZEJRVk12Unl4RlFVRlVPMEZCUTBGM1JTeFpRVUZWZDBNc1YwRkJWaXhEUVVGelFqRkRMRlZCUVhSQ08wRkJRMEVzVFVGQlNYcERMR0ZCUVdGRExHRkJRV3BDTEVWQlFXZERPMEZCUXpsQ2MwUXNaMEpCUVZsaUxFbEJRVWtzUzBGQlNpeEZRVUZYTEc5Q1FVRllMRU5CUVZvN1FVRkRRVEJETEZOQlFVczNRaXhUUVVGTUxFVkJRV2RDZEVRc1lVRkJhRUk3UVVGRFFUQkRMR05CUVZWM1F5eFhRVUZXTEVOQlFYTkNOVUlzVTBGQmRFSTdRVUZEUkR0QlFVTkVlRUlzVTBGQlQyOUVMRmRCUVZBc1EwRkJiVUo0UXl4VFFVRnVRanRCUVVOQmVFVXNTMEZCUjJ0SUxGbEJRVWdzUTBGQlowSXNZMEZCYUVJc1JVRkJaME1zUzBGQmFFTTdPMEZCUlVFc1RVRkJTWHBFTEUxQlFVMURMRTlCUVU0c1EwRkJZM0pFTEUxQlFXUXNRMEZCU2l4RlFVRXlRanRCUVVONlFqaEhMRmRCUVU4NVJ5eE5RVUZRTEVWQlFXVXNTMEZCWmp0QlFVTkVPenRCUVVWRUxGTkJRVTg0Uml4SFFVRlFPenRCUVVWQkxGZEJRVk5aTEZGQlFWUXNRMEZCYlVJdlJ5eEZRVUZ1UWl4RlFVRjFRanRCUVVOeVFtOUlMR2RDUVVGWkxFbEJRVm83UVVGRFFXcERMR2xDUVVGaFowSXNTVUZCU1doQ0xGVkJRVW9zUjBGQmFVSnVSaXhGUVVFNVFqdEJRVU5CY1VZc1owSkJRVmxHTEZkQlFWZGhMRTlCUVZnc1MwRkJkVUlzVDBGQmRrSXNTVUZCYTBOaUxGZEJRVmRoTEU5QlFWZ3NTMEZCZFVJc1ZVRkJja1U3UVVGRFFWWXNaVUZCVjBRc1lVRkJZV2RETEZkQlFWZHNReXhWUVVGWUxFTkJRWGhDTzBGQlEwRnBRenRCUVVORU96dEJRVVZFTEZkQlFWTllMR1ZCUVZRc1IwRkJORUk3UVVGRE1VSXNVVUZCU1haQ0xFZEJRVW9zUlVGQlV6dEJRVUZGUVN4VlFVRkpiME1zVDBGQlNqdEJRVUZuUWp0QlFVTTFRanM3UVVGRlJDeFhRVUZUTVVJc1QwRkJWQ3hEUVVGclFqSkNMRk5CUVd4Q0xFVkJRVFpDTzBGQlF6TkNMRkZCUVVrc1QwRkJUMnhJTEUxQlFWQXNTMEZCYTBJc1ZVRkJkRUlzUlVGQmEwTTdRVUZEYUVNN1FVRkRSRHRCUVVORWJVZ3NkMEpCUVZWRExFMUJRVllzUTBGQmFVSjBReXhWUVVGcVFpeEZRVUUyUWl4UFFVRTNRaXhGUVVGelExTXNUMEZCZEVNN1FVRkRRU3hSUVVGTmVFUXNVVUZCVVhOR0xGZEJRV1E3UVVGRFFTeFJRVUZKZEVZc1ZVRkJWWGRETEUxQlFVMTRReXhMUVVGd1FpeEZRVUV5UWp0QlFVTjZRanRCUVVORU8wRkJRMFE0UkN4bFFVRlhMRXRCUVZnN1FVRkRRWFJDTEZWQlFVMTRReXhMUVVGT0xFZEJRV05CTEV0QlFXUTdPMEZCUlVFc1VVRkJUWGxETEZWQlFWVXNSVUZCUlVRc1RVRkJUVU1zVDBGQmVFSTdPMEZCUlVGNFJTeFhRVUZQTEVWQlFVVXJRaXhaUVVGR0xFVkJRVk5pTEZsQlFWUXNSVUZCVUN4RlFVRjVRalpDTEU5QlFYcENPenRCUVVWQkxHRkJRVk5CTEU5QlFWUXNRMEZCYTBKRExFZEJRV3hDTEVWQlFYVkNReXhOUVVGMlFpeEZRVUVyUW5GRkxGVkJRUzlDTEVWQlFUSkRPMEZCUTNwRExGVkJRVWt2UXl4TlFVRk5ReXhQUVVGT0xFdEJRV3RDUVN4UFFVRjBRaXhGUVVFclFqdEJRVU0zUWp0QlFVTkVPMEZCUTBSelF5eGhRVUZQTjBRc1RVRkJVQ3hGUVVGbGFVVXNVMEZCWmp0QlFVTkJMRlZCUVVsc1JTeFBRVUZQYzBVc1ZVRkJXQ3hGUVVGMVFqdEJRVU55UW5wQ0xHMUNRVUZYTEV0QlFWZzdRVUZEUkR0QlFVTkdPMEZCUTBZN08wRkJSVVFzVjBGQlUybENMRTFCUVZRc1EwRkJhVUkzUXl4VlFVRnFRaXhGUVVFMlFtbEVMRk5CUVRkQ0xFVkJRWGRETzBGQlEzUkRia0k3UVVGRFFVWXNaVUZCVnl4SlFVRllPMEZCUTBGRExGRkJRVWs1Uml4TlFVRktMRWRCUVdFc1JVRkJZanRCUVVOQmFVVXNaVUZCVjNORUxFOUJRVmdzUTBGQmJVSTdRVUZCUVN4aFFVRlBReXhKUVVGSlF5eEpRVUZLTEVOQlFWTkdMRTlCUVZRc1EwRkJhVUk3UVVGQlFTeGxRVUZqUnl4SlFVRkpReXhWUVVGS0xFVkJRV2RDU0N4SFFVRm9RaXhEUVVGa08wRkJRVUVzVDBGQmFrSXNRMEZCVUR0QlFVRkJMRXRCUVc1Q08wRkJRMEVzVVVGQlNVNHNVMEZCU2l4RlFVRmxPMEZCUTJKc1FqdEJRVU5FTzBGQlEwUXhRanRCUVVORU96dEJRVVZFTEZkQlFWTjVRaXhMUVVGVUxFZEJRV3RDTzBGQlEyaENOa0k3UVVGRFFTeFhRVUZQTTBRc1YwRkJWelJFTEZOQlFXeENMRVZCUVRaQ08wRkJRek5DTlVRc2FVSkJRVmMyUkN4WFFVRllMRU5CUVhWQ04wUXNWMEZCVnpSRUxGTkJRV3hETzBGQlEwUTdRVUZEUkhCRUxHdENRVUZqUXl4UFFVRlBReXhOUVVGUUxFTkJRV01zU1VGQlpDeERRVUZrTzBGQlEwRnJRaXhsUVVGWExFdEJRVmc3UVVGRFJEczdRVUZGUkN4WFFVRlRkMElzVTBGQlZDeEhRVUZ6UWp0QlFVTndRaXhYUVVGUExFTkJRVU55UXl4WlFVRlpja1lzUjBGQlIyZERMRXRCUVdZc1IwRkJkVUpvUXl4SFFVRkhiMGtzVTBGQk0wSXNSVUZCYzBORExFbEJRWFJETEVWQlFWQTdRVUZEUkRzN1FVRkZSQ3hYUVVGVFF5eFhRVUZVTEVOQlFYTkNia2NzU1VGQmRFSXNSVUZCTkVJN1FVRkRNVUlzVVVGQlNTeERRVUZEUVN4TFFVRkxiMGNzUlVGQlZpeEZRVUZqTzBGQlExcHdSeXhYUVVGTGIwY3NSVUZCVEN4SFFVRlZMRk5CUVZZN1FVRkRSRHRCUVVORUxGRkJRVWtzUTBGQlEzcEVMRmxCUVZrelF5eExRVUZMYjBjc1JVRkJha0lzUTBGQlRDeEZRVUV5UWp0QlFVTjZRbnBFTEd0Q1FVRlpNME1zUzBGQlMyOUhMRVZCUVdwQ0xFbEJRWFZDUXl4blFrRkJka0k3UVVGRFJEdEJRVU5FTEZkQlFVOHhSQ3haUVVGWk0wTXNTMEZCUzI5SExFVkJRV3BDTEVOQlFWQTdRVUZEUVN4aFFVRlRReXhqUVVGVUxFZEJRVEpDTzBGQlEzcENMRlZCUVUxRExGZEJRVmRzUlN4SlFVRkpMRXRCUVVvc1JVRkJWeXhqUVVGWUxFTkJRV3BDTzBGQlEwRXNWVUZCVFcxRkxFdEJRVXR1UlN4SlFVRkpMRWxCUVVvc1JVRkJWU3hWUVVGV0xFTkJRVmc3UVVGRFFUbEVMSEZDUVVGbFowa3NVVUZCWml4RlFVRjVRblJITEVsQlFYcENPMEZCUTBGelJ5eGxRVUZUZWtJc1YwRkJWQ3hEUVVGeFFqQkNMRVZCUVhKQ08wRkJRMEZ3UlN4cFFrRkJWekJETEZkQlFWZ3NRMEZCZFVKNVFpeFJRVUYyUWp0QlFVTkJMR0ZCUVU4c1JVRkJSWFJITEZWQlFVWXNSVUZCVVhWSExFMUJRVklzUlVGQlVEdEJRVU5FTzBGQlEwWTdPMEZCUlVRc1YwRkJVMWdzUjBGQlZDeERRVUZqUXl4VlFVRmtMRVZCUVRCQ1Z5eFpRVUV4UWl4RlFVRjNRenRCUVVOMFF5eFJRVUZOWkN4TlFVRk5VeXhaUVVGWlN5eFpRVUZhTEVOQlFWbzdRVUZEUVN4UlFVRk5ReXhMUVVGTGNrVXNTVUZCU1N4SlFVRktMRVZCUVZVc1ZVRkJWaXhEUVVGWU8wRkJRMEV2UkN4bFFVRlhiMGtzUlVGQldDeEZRVUZsV2l4VlFVRm1PMEZCUTBFc1VVRkJTV3BGTEZkQlFVb3NSVUZCYVVJN1FVRkRaamhGTERSQ1FVRnpRa1FzUlVGQmRFSTdRVUZEUkR0QlFVTkVjRUlzZDBKQlFWVlBMRWRCUVZZc1EwRkJZMkVzUlVGQlpDeEZRVUZyUWl4WlFVRnNRaXhGUVVGblEwVXNaVUZCYUVNN1FVRkRRWFJDTEhkQ1FVRlZUeXhIUVVGV0xFTkJRV05oTEVWQlFXUXNSVUZCYTBJc1QwRkJiRUlzUlVGQk1rSkhMR2xDUVVFelFqdEJRVU5CZGtJc2QwSkJRVlZQTEVkQlFWWXNRMEZCWTJFc1JVRkJaQ3hGUVVGclFpeGxRVUZzUWl4RlFVRnRRMGtzVlVGQmJrTTdRVUZEUVhoQ0xIZENRVUZWVHl4SFFVRldMRU5CUVdOaExFVkJRV1FzUlVGQmEwSXNZVUZCYkVJc1JVRkJhVU5MTEZGQlFXcERPMEZCUTBGd1FpeFJRVUZKWVN4RlFVRktMRU5CUVU4eFFpeFhRVUZRTEVOQlFXMUNORUlzUlVGQmJrSTdRVUZEUVhwRExGRkJRVWs1Uml4TlFVRktMRU5CUVZjMlNTeEpRVUZZTEVOQlFXZENiRUlzVlVGQmFFSTdRVUZEUVN4WFFVRlBXU3hGUVVGUU96dEJRVVZCTEdGQlFWTkZMR1ZCUVZRc1IwRkJORUk3UVVGRE1VSkxMR0ZCUVU5UUxFVkJRVkE3UVVGRFJEczdRVUZGUkN4aFFVRlRSeXhwUWtGQlZDeEhRVUU0UWp0QlFVTTFRaXhWUVVGTk5VWXNVVUZCVVc1RExGRkJRVkZuU0N4VlFVRlNMRU5CUVdRN1FVRkRRVGRJTEZWQlFVazJTQ3hWUVVGS08wRkJRMEV4UWp0QlFVTkJia0lzYVVKQlFWZHBSU3hMUVVGWU8wRkJRMEV6UkN4dFFrRkJZVGxDTEVWQlFVVndSQ3hwUWtGQlJpeEpRVUYxUW05RUxFVkJRVVZ3UkN4cFFrRkJSaXhEUVVGdlFqdEJRVU4wUkRSRExHVkJRVTlCTEV0QlJDdERPMEZCUlhSRU9VTXNaMEpCUVZFNFJpeEpRVUZKT1VZc1RVRkJTaXhEUVVGWE5FTXNTMEZCV0N4RlFVWTRRenRCUVVkMFJHZERMRzFDUVVGWEswTTdRVUZJTWtNc1QwRkJjRUlzUTBGQmRrSXNTVUZKVUN4RlFVcE9PMEZCUzBFc1ZVRkJTWFpETEZWQlFVb3NSVUZCWjBJN1FVRkRaSHBHTEZkQlFVZG5ReXhMUVVGSUxFZEJRVmQ1UkN4VlFVRllPMEZCUTBGNlJpeFhRVUZIYlVvc1RVRkJTRHRCUVVOQk9VTTdRVUZEUVRGQ08wRkJRMFE3UVVGRFJqczdRVUZGUkN4aFFVRlRjVVVzVlVGQlZDeEhRVUYxUWp0QlFVTnlRaXhWUVVGTmFFZ3NVVUZCVVRCR0xGZEJRV1E3UVVGRFFTeFZRVUZKZEVnc1QwRkJUelJDTEV0QlFWQXNSVUZCWTJkSExGVkJRV1FzUTBGQlNpeEZRVUVyUWp0QlFVTTNRbGtzVjBGQlIxTXNVMEZCU0N4SFFVRmxWQ3hIUVVGSFV5eFRRVUZJTEVOQlFXRkRMRTlCUVdJc1EwRkJjVUlzV1VGQmNrSXNSVUZCYlVNc1JVRkJia01zUTBGQlpqdEJRVU5FTEU5QlJrUXNUVUZGVHp0QlFVTk1PVUlzTkVKQlFWVXJRaXhUUVVGV0xFTkJRVzlDV0N4RlFVRndRaXhGUVVGM1FpeGhRVUY0UWp0QlFVTkVPMEZCUTBZN08wRkJSVVFzWVVGQlUwc3NVVUZCVkN4SFFVRnhRanRCUVVOdVFpeFZRVUZKTEVOQlFVTlBMRTlCUVU5YUxFVkJRVkFzUTBGQlRDeEZRVUZwUWp0QlFVTm1RU3hYUVVGSFV5eFRRVUZJTEVsQlFXZENMRmRCUVdoQ08wRkJRMEVzV1VGQlNYQkZMR05CUVdNeVJDeEZRVUZzUWl4RlFVRnpRanRCUVVOd1FsZzdRVUZEUkR0QlFVTkdPMEZCUTBZN1FVRkRSanM3UVVGRlJDeFhRVUZUV1N4eFFrRkJWQ3hEUVVGblF6ZEpMRVZCUVdoRExFVkJRVzlETzBGQlEyeERlVW9zYjBKQlFXZENla29zUlVGQmFFSXNSVUZCYjBJMFNDeFBRVUZ3UWl4RFFVRTBRaXhqUVVGTk8wRkJRMmhETEZWQlFVMW9SU3hUUVVGVE5VUXNSMEZCUnpCS0xHRkJRV3hDTzBGQlEwRXNWVUZCVFhwRExFOUJRVTlxU0N4SFFVRkhNa29zVjBGQlNDeEpRVUZyUWpOS0xFZEJRVWMwU2l4VFFVRnlRaXhKUVVGclF5eEZRVUV2UXp0QlFVTkJMRlZCUVVrelF5eExRVUZMTlVVc1RVRkJUQ3hMUVVGblFpeERRVUZ3UWl4RlFVRjFRanRCUVVOeVFqdEJRVU5FTzBGQlRDdENPMEZCUVVFN1FVRkJRVHM3UVVGQlFUdEJRVTFvUXl3MlFrRkJhVUkwUlN4SlFVRnFRaXc0U0VGQmRVSTdRVUZCUVN4alFVRmtORU1zU1VGQll6czdRVUZEY2tKcVJ5eHBRa0ZCVDJ0SExGbEJRVkFzUTBGQmIwSkRMRkZCUVZGR0xFbEJRVklzUTBGQmNFSXNSVUZCYlVNM1NpeEZRVUZ1UXp0QlFVTkVPMEZCVWl0Q08wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdPMEZCVTJoRE5FUXNZVUZCVDNWRkxGZEJRVkFzUTBGQmJVSnVTU3hGUVVGdVFqdEJRVU5CTEdWQlFWTXJTaXhQUVVGVUxFTkJRV3RDUml4SlFVRnNRaXhGUVVGM1FqdEJRVU4wUWl4WlFVRk5SeXhQUVVGUGNrc3NTVUZCU1hOTExHRkJRVW9zUTBGQmEwSXNUVUZCYkVJc1EwRkJZanRCUVVOQlJDeGhRVUZMV0N4VFFVRk1MRWRCUVdsQ0xGVkJRV3BDTzBGQlEwRlhMR0ZCUVV0TUxGZEJRVXdzUjBGQmJVSkxMRXRCUVV0RkxGTkJRVXdzUjBGQmFVSk1MRWxCUVhCRE8wRkJRMEVzWlVGQlQwY3NTVUZCVUR0QlFVTkVPMEZCUTBZc1MwRm9Ra1E3UVVGcFFrUTdPMEZCUlVRc1YwRkJVMGNzVTBGQlZDeERRVUZ2UW01TExFVkJRWEJDTEVWQlFYZENiMHNzVFVGQmVFSXNSVUZCWjBNN1FVRkRPVUlzVVVGQlRVTXNVVUZCVVN4dFFrRkJaRHRCUVVOQkxGRkJRVTFETEZGQlFWRkdMRTlCUVU5SExFdEJRVkFzUTBGQllVWXNTMEZCWWl4RlFVRnZRbXBMTEUxQlFYQkNMRU5CUVRKQ08wRkJRVUVzWVVGQlMyOUxMRVZCUVVWdVNTeE5RVUZRTzBGQlFVRXNTMEZCTTBJc1EwRkJaRHRCUVVOQkxGRkJRVTF2U1N4eFEwRkJXWHBMTEVkQlFVY3dTeXhuUWtGQlNDeERRVUZ2UWl4WFFVRndRaXhEUVVGYUxFVkJRVTQ3UVVGRFFTeFJRVUZKUXl4alFVRktPMEZCUTBFc1VVRkJTVU1zWVVGQllTeERRVUZxUWpzN1FVRkZRVU03UVVGRFFTeFJRVUZKTjBjc2MwSkJRVW9zUlVGQk5FSTdRVUZETVVJNFJ6dEJRVU5FTzBGQlEwUkRPMEZCUTBGRE96dEJRVVZCTEdGQlFWTklMRTlCUVZRc1IwRkJiMEk3UVVGRGJFSkdMR05CUVZGR0xFMUJRVTFSTEVkQlFVNHNRMEZCVlR0QlFVRkJMR1ZCUVUxcVRDeEhRVUZIYTBzc1UwRkJTQ3hKUVVGblFteExMRWRCUVVjeVNpeFhRVUY2UWp0QlFVRkJMRTlCUVZZc1EwRkJVanRCUVVORU96dEJRVVZFTEdGQlFWTnRRaXhMUVVGVUxFZEJRV3RDTzBGQlFVRTdRVUZCUVR0QlFVRkJPenRCUVVGQk8wRkJRMmhDTERoQ1FVRnBRbElzUzBGQmFrSXNiVWxCUVhkQ08wRkJRVUVzWTBGQlpsa3NTVUZCWlRzN1FVRkRkRUlzWTBGQlNVTXNXVUZCV1ZBc1ZVRkJhRUk3UVVGRFFWRXNhVUpCUVU4c1QwRkJUMFFzWTBGQll5eERRVUZETEVOQlFYUkNMRVZCUVhsQ08wRkJRemxDTEdkQ1FVRkpSU3hQUVVGUExFbEJRVmc3UVVGRFFTeG5Ra0ZCU1VNc1dVRkJXVWdzVTBGQmFFSTdRVUZHT0VJN1FVRkJRVHRCUVVGQk96dEJRVUZCTzBGQlJ6bENMRzlEUVVGcFFrUXNTVUZCYWtJc2JVbEJRWFZDTzBGQlFVRXNiMEpCUVdSeVFpeEpRVUZqT3p0QlFVTnlRaXh2UWtGQlRUQkNMRWxCUVVsYUxFMUJRVTFoTEU5QlFVNHNRMEZCWXpOQ0xFbEJRV1FzUlVGQmIwSjVRaXhaUVVGWkxFTkJRV2hETEVOQlFWWTdRVUZEUVN4dlFrRkJUVWNzVDBGQlQwWXNUVUZCVFN4RFFVRkRMRU5CUVZBc1NVRkJZU3hEUVVGRFJpeEpRVUZFTEVsQlFWTkRMRmxCUVZrc1EwRkJXaXhMUVVGclFrTXNRMEZCY2tRN1FVRkRRU3h2UWtGQlNVWXNTVUZCU2l4RlFVRlZPMEZCUTFKQkxIbENRVUZQTEV0QlFWQTdRVUZEUVVZc09FSkJRVmxKTEVOQlFWbzdRVUZEUkR0QlFVTkVMRzlDUVVGSlJTeEpRVUZLTEVWQlFWVTdRVUZEVWl3eVFrRkJVMHdzUzBGQlZEdEJRVU5FTzBGQlEwUkZMRFJDUVVGWlF5eERRVUZhTzBGQlEwUTdRVUZrTmtJN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUczdRVUZCUVR0QlFVRkJPMEZCUVVFN08wRkJRVUU3UVVGbE9VSXNiME5CUVdWa0xFMUJRVTFwUWl4TlFVRk9MRU5CUVdGUUxGTkJRV0lzUlVGQmQwSXNTVUZCU1Vjc1UwRkJTaXhIUVVGblFrZ3NVMEZCZUVNc1EwRkJaaXh0U1VGQmJVVTdRVUZCUVN4dlFrRkJNVVJ1VEN4SFFVRXdSRHM3UVVGRGFrVXlUQ3h0UWtGQlJ6Tk1MRWRCUVVnN1FVRkRSRHRCUVdwQ05rSTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHM3UVVGclFqbENOa3M3UVVGRFFWUXNjVUpCUVZOQkxFOUJRVTlrTEU5QlFWQXNRMEZCWlRSQ0xFbEJRV1lzUlVGQmNVSXNSVUZCY2tJc1EwRkJWRHRCUVVOQk8wRkJRMFE3UVVGRFJqdEJRWHBDWlR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJNRUpxUWpzN1FVRkZSQ3hoUVVGVFNDeExRVUZVTEVkQlFXdENPMEZCUVVFN1FVRkJRVHRCUVVGQk96dEJRVUZCTzBGQlEyaENMRGhDUVVGclFsZ3NUVUZCYkVJc2JVbEJRVEJDTzBGQlFVRXNZMEZCYWtKcVNDeExRVUZwUWpzN1FVRkRlRUlzYVVKQlFVOXpTQ3hOUVVGTmNFa3NUVUZCWWl4RlFVRnhRanRCUVVOdVFpeG5Ra0ZCU1hKRExFOUJRVXQ1U3l4TlFVRk5iVUlzUzBGQlRpeEZRVUZVTzBGQlEwRXNaMEpCUVVrc1EwRkJRelZNTEV0QlFVZHJTeXhUUVVGSUxFbEJRV2RDYkVzc1MwRkJSekpLTEZkQlFXNUNMRWxCUVd0RExFVkJRVzVETEVWQlFYVkRhME1zYVVKQlFYWkRMRTlCUVN0RU1Va3NUVUZCVFRCSkxHbENRVUZPTEVWQlFXNUZMRVZCUVRoR08wRkJRelZHUml4cFFrRkJSek5NTEVsQlFVZzdRVUZEUVR0QlFVTkVMR0ZCU0VRc1RVRkhUenRCUVVOTU9Fd3NhMEpCUVVrNVRDeEpRVUZLTzBGQlEwUTdRVUZEUmp0QlFVTkdPMEZCV0dVN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVmxxUWpzN1FVRkZSQ3hoUVVGVFowd3NZMEZCVkN4SFFVRXlRanRCUVVONlFpeGhRVUZQVUN4TlFVRk5jRWtzVFVGQllpeEZRVUZ4UWp0QlFVTnVRbmxLTEZsQlFVbHlRaXhOUVVGTmJVSXNTMEZCVGl4RlFVRktPMEZCUTBRN1FVRkRSanM3UVVGRlJDeGhRVUZUUkN4RlFVRlVMRU5CUVdGSkxFVkJRV0lzUlVGQmFVSTdRVUZEWmtFc1UwRkJSME1zVTBGQlNDeERRVUZoYWtVc1IwRkJZaXhEUVVGcFFpeHZRa0ZCYWtJN1FVRkRSRHRCUVVORUxHRkJRVk1yUkN4SFFVRlVMRU5CUVdORExFVkJRV1FzUlVGQmEwSTdRVUZEYUVKQkxGTkJRVWRETEZOQlFVZ3NRMEZCWVhaRkxFMUJRV0lzUTBGQmIwSXNiMEpCUVhCQ08wRkJRMFE3UVVGRFJqczdRVUZGUkN4WFFVRlRaME1zWlVGQlZDeERRVUV3UW5wS0xFVkJRVEZDTEVWQlFUaENPMEZCUXpWQ0xGRkJRVTFwVFN4UlFVRlJMRVZCUVdRN1FVRkRRU3hSUVVGTlF5eFRRVUZUZEUwc1UwRkJVM1ZOTEdkQ1FVRlVMRU5CUVRCQ2JrMHNSVUZCTVVJc1JVRkJPRUp2VFN4WFFVRlhReXhUUVVGNlF5eEZRVUZ2UkN4SlFVRndSQ3hGUVVFd1JDeExRVUV4UkN4RFFVRm1PMEZCUTBFc1VVRkJTVU1zWVVGQlNqdEJRVU5CTEZkQlFVOUJMRTlCUVU5S0xFOUJRVTlMTEZGQlFWQXNSVUZCWkN4RlFVRnBRenRCUVVNdlFrNHNXVUZCVFM5RExFbEJRVTRzUTBGQlYyOUVMRWxCUVZnN1FVRkRSRHRCUVVORUxGZEJRVTlNTEV0QlFWQTdRVUZEUkRzN1FVRkZSQ3hYUVVGVE9Vd3NSMEZCVkN4RFFVRmpOa0lzUzBGQlpDeEZRVUZ4UWp0QlFVTnVRaXhSUVVGSk1rSXNSVUZCUlM5RExFMUJRVTRzUlVGQll6dEJRVU5hTEdGQlFVOHNRMEZCUXpSTUxGZEJRVmR5Unl4SlFVRkpUeXhWUVVGbUxFZEJRVFJDVUN4SlFVRkpVU3hWUVVGcVF5eEZRVUUyUTNwR0xGTkJRVk5qTEV0QlFWUXNRMEZCTjBNc1EwRkJVRHRCUVVORU8wRkJRMFJ4UXl4WlFVRlJja01zUzBGQlVqdEJRVU5FT3p0QlFVVkVMRmRCUVZNMVFpeE5RVUZVTEVOQlFXbENORUlzUzBGQmFrSXNSVUZCZDBKblJ5eFZRVUY0UWl4RlFVRnZRenRCUVVOc1F5eFJRVUZKY2tVc1JVRkJSUzlETEUxQlFVNHNSVUZCWXp0QlFVTmFMRlZCUVUwMlRDeExRVUZMTEVOQlFVTkVMRmRCUVZkeVJ5eEpRVUZKVXl4clFrRkJaaXhIUVVGdlExUXNTVUZCU1ZVc2EwSkJRWHBETEVWQlFUWkVOMFVzUzBGQk4wUXNSVUZCYjBWblJ5eFZRVUZ3UlN4RFFVRllPMEZCUTBFc1lVRkJUM2xGTEV0QlFVdDBTU3hYUVVGWGMwa3NSMEZCUjNSS0xFdEJRV1FzUlVGQmNVSnpTaXhIUVVGSGVrVXNWVUZCZUVJc1EwRkJUQ3hIUVVFeVF5eExRVUZzUkR0QlFVTkVPMEZCUTBRc1YwRkJUemRFTEZkQlFWZHVReXhMUVVGWUxFVkJRV3RDWjBjc1ZVRkJiRUlzUTBGQlVEdEJRVU5FT3p0QlFVVkVMRmRCUVZOM1JTeE5RVUZVTEVkQlFXMUNPMEZCUVVVc1YwRkJUMFVzVVVGQlVYWklMRlZCUVZJc1EwRkJVRHRCUVVFMlFqdEJRVU5zUkN4WFFVRlRkMGdzVDBGQlZDeEhRVUZ2UWp0QlFVRkZMRmRCUVU5dVNTeFZRVUZWTmtVc1UwRkJWaXhEUVVGdlFtMURMRTlCUVhCQ0xFTkJRVFJDTEZWQlFUVkNMRTFCUVRSRExFTkJRVU1zUTBGQmNFUTdRVUZCZDBRN1FVRkRPVVVzVjBGQlUyaERMRTFCUVZRc1EwRkJhVUphTEVWQlFXcENMRVZCUVhGQ08wRkJRVVVzVjBGQlQwRXNSMEZCUjFNc1UwRkJTQ3hEUVVGaGJVTXNUMEZCWWl4RFFVRnhRaXhWUVVGeVFpeE5RVUZ4UXl4RFFVRkRMRU5CUVRkRE8wRkJRV2xFT3p0QlFVVjRSU3hYUVVGVGJrWXNTVUZCVkN4SFFVRnBRanRCUVVObWJrSXNVVUZCU1c5RExFOUJRVW83UVVGRFFTeFJRVUZKTEVOQlFVTnhSaXhUUVVGTUxFVkJRV2RDTzBGQlEyUnVTU3huUWtGQlZUWkZMRk5CUVZZc1NVRkJkVUlzVjBGQmRrSTdRVUZEUVRkQ0xEQkNRVUZWSzBJc1UwRkJWaXhEUVVGdlFuQkZMRlZCUVhCQ0xFVkJRV2RETEdGQlFXaERPMEZCUTBRN1FVRkRSanM3UVVGRlJDeFhRVUZUZVVnc1QwRkJWQ3hEUVVGclFrTXNRMEZCYkVJc1JVRkJjVUk3UVVGRGJrSXNVVUZCVFVNc1QwRkJUMFFzUlVGQlJVVXNTMEZCUml4TFFVRlpMRU5CUVZvc1NVRkJhVUlzUTBGQlEwWXNSVUZCUlVjc1QwRkJjRUlzU1VGQkswSXNRMEZCUTBnc1JVRkJSVWtzVDBGQkwwTTdRVUZEUVN4UlFVRkpTQ3hUUVVGVExFdEJRV0lzUlVGQmIwSTdRVUZEYkVJc1lVRkVhMElzUTBGRFZqdEJRVU5VTzBGQlEwUjJSenRCUVVORU96dEJRVVZFTEZkQlFWTkJMRTFCUVZRc1IwRkJiVUk3UVVGRGFrSXNVVUZCU1N4RFFVRkRiMGNzVTBGQlRDeEZRVUZuUWp0QlFVTmtkRWM3UVVGRFJDeExRVVpFTEUxQlJVODdRVUZEVEVNN1FVRkRSRHRCUVVOR096dEJRVVZFTEZkQlFWTTJReXhOUVVGVUxFTkJRV2xDVUN4RlFVRnFRaXhGUVVGeFFqdEJRVU51UWxnN1FVRkRRU3hSUVVGSlZ5eEZRVUZLTEVWQlFWRTdRVUZEVGpORUxHdENRVUZaTWtRc1JVRkJXanRCUVVOQk0wUXNaMEpCUVZWdlJTeFRRVUZXTEVsQlFYVkNMR1ZCUVhaQ08wRkJRMFE3UVVGRFJqczdRVUZGUkN4WFFVRlRjRUlzVVVGQlZDeEhRVUZ4UWp0QlFVTnVRaXhSUVVGSmFFUXNVMEZCU2l4RlFVRmxPMEZCUTJKQkxHZENRVUZWYjBVc1UwRkJWaXhIUVVGelFuQkZMRlZCUVZWdlJTeFRRVUZXTEVOQlFXOUNReXhQUVVGd1FpeERRVUUwUWl4blFrRkJOVUlzUlVGQk9FTXNSVUZCT1VNc1EwRkJkRUk3UVVGRFFYSkZMR3RDUVVGWkxFbEJRVm83UVVGRFJEdEJRVU5HT3p0QlFVVkVMRmRCUVZOcFNTeEpRVUZVTEVOQlFXVkRMRVZCUVdZc1JVRkJiVUpETEV0QlFXNUNMRVZCUVRCQ08wRkJRM2hDTEZGQlFVMURMRkZCUVZGc1NDeEpRVUZKT1VZc1RVRkJTaXhEUVVGWFowTXNUVUZCZWtJN1FVRkRRU3hSUVVGSlowd3NWVUZCVlN4RFFVRmtMRVZCUVdsQ08wRkJRMlk3UVVGRFJEdEJRVU5FTEZGQlFVbEVMRkZCUVZGRExFdEJRVm9zUlVGQmJVSTdRVUZEYWtKd1JqdEJRVU5CTzBGQlEwUTdRVUZEUkN4UlFVRk5TaXhOUVVGTmVVWXNZVUZCWVhKSkxGTkJRV0lzUzBGQk1rSllMRmRCUVZkcFNpeFZRVUZzUkR0QlFVTkJMRkZCUVUxRExGRkJRVkZNTEV0QlFVc3NWMEZCVEN4SFFVRnRRaXhaUVVGcVF6dEJRVU5CTEZGQlFVMU5MRTlCUVU5T0xFdEJRVXNzV1VGQlRDeEhRVUZ2UWl4WFFVRnFRenRCUVVOQkxGRkJRVTFQTEU5QlFVOVFMRXRCUVVzc2FVSkJRVXdzUjBGQmVVSXNZVUZCZEVNN1FVRkRRU3hSUVVGTlVTeFBRVUZQVWl4TFFVRkxMR0ZCUVV3c1IwRkJjVUlzYVVKQlFXeERPMEZCUTBFc1VVRkJUWFpGTEV0QlFVdG5SaXhWUVVGWU8wRkJRMEY2UlN4WFFVRlBVQ3hGUVVGUU96dEJRVVZCTEZGQlFVbFpMRTlCUVU5YUxFVkJRVkFzUTBGQlNpeEZRVUZuUWp0QlFVTmtjMFVzVjBGQlMwTXNSVUZCVEN4RlFVRlRReXhSUVVGUlFTeFJRVUZSTEVOQlFXaENMRWRCUVc5Q0xFTkJRVGRDTzBGQlEwUTdPMEZCUlVRc1lVRkJVMFVzV1VGQlZDeERRVUYxUW5ST0xFVkJRWFpDTEVWQlFUSkNPMEZCUTNwQ0xHRkJRVTlCTEVWQlFWQXNSVUZCVnp0QlFVTlVMRmxCUVVrMlRpeHBRa0ZCVDBNc1pVRkJVQ3hEUVVGMVFqbE9MRWRCUVVjd1NpeGhRVUV4UWl4RlFVRjVReXhsUVVGNlF5eERRVUZLTEVWQlFTdEVPMEZCUXpkRUxHbENRVUZQTVVvc1IwRkJSekJLTEdGQlFWWTdRVUZEUkR0QlFVTkVNVW9zWVVGQlMwRXNSMEZCUnpCS0xHRkJRVkk3UVVGRFJEdEJRVU5FTEdGQlFVOHNTVUZCVUR0QlFVTkVPenRCUVVWRUxHRkJRVk5yUlN4UlFVRlVMRWRCUVhGQ08wRkJRMjVDTEZWQlFVa3pTU3hUUVVGS0xFVkJRV1U3UVVGRFlpeFpRVUZKUVN4VlFVRlZlVWtzU1VGQlZpeERRVUZLTEVWQlFYRkNPMEZCUTI1Q0xHbENRVUZQZWtrc1ZVRkJWWGxKTEVsQlFWWXNRMEZCVUR0QlFVTkVPMEZCUTBRc1dVRkJTVGRHTEVsQlFVazJSaXhKUVVGS0xFdEJRV0ZMTEZOQlFWTnNSeXhKUVVGSk5rWXNTVUZCU2l4RFFVRlVMRVZCUVc5Q1JpeExRVUZ3UWl4RFFVRnFRaXhGUVVFMlF6dEJRVU16UXl4cFFrRkJUMDhzVTBGQlUyeEhMRWxCUVVrMlJpeEpRVUZLTEVOQlFWUXNSVUZCYjBKR0xFdEJRWEJDTEVOQlFWQTdRVUZEUkR0QlFVTkdPMEZCUTBRc1lVRkJUMDhzVTBGQlUzcEtMRmRCUVZkclNpeExRVUZZTEVOQlFWUXNSVUZCTkVKQkxFdEJRVFZDTEVOQlFWQTdRVUZEUkR0QlFVTkdPenRCUVVWRUxGZEJRVk5zU0N4SlFVRlVMRWRCUVdsQ08wRkJRMlp3UWl4UlFVRkpPRWtzUzBGQlNqdEJRVU5CZUVvc1kwRkJWVFpGTEZOQlFWWXNSMEZCYzBJM1JTeFZRVUZWTmtVc1UwRkJWaXhEUVVGdlFrTXNUMEZCY0VJc1EwRkJORUlzV1VGQk5VSXNSVUZCTUVNc1JVRkJNVU1zUTBGQmRFSTdRVUZEUVhKQ08wRkJRMEZVTEhkQ1FVRlZLMElzVTBGQlZpeERRVUZ2UW5CRkxGVkJRWEJDTEVWQlFXZERMR0ZCUVdoRE8wRkJRMEVzVVVGQlNXNUdMRWRCUVVkblF5eExRVUZJTEV0QlFXRjVSQ3hWUVVGcVFpeEZRVUUyUWp0QlFVTXpRbnBHTEZOQlFVZG5ReXhMUVVGSUxFZEJRVmNzUlVGQldEdEJRVU5FTzBGQlEwWTdPMEZCUlVRc1YwRkJVMmxOTEU5QlFWUXNRMEZCYTBKd1FpeERRVUZzUWl4RlFVRnhRanRCUVVOdVFpeFJRVUZOY1VJc1VVRkJVWFpDTEZOQlFXUTdRVUZEUVN4UlFVRk5TU3hSUVVGUlJpeEZRVUZGUlN4TFFVRkdMRWxCUVZkR0xFVkJRVVZ6UWl4UFFVRXpRanRCUVVOQkxGRkJRVWx3UWl4VlFVRlZkRTRzVVVGQlpDeEZRVUYzUWp0QlFVTjBRaXhWUVVGSk5rWXNXVUZCV1ROQ0xFVkJRVVZ2UXl4blFrRkJiRUlzUlVGQmIwTTdRVUZEYkVOTk8wRkJRMFE3UVVGRFJDeFZRVUZKTmtnc1MwRkJTaXhGUVVGWE8wRkJRMVJvUWp0QlFVTkJhMElzWVVGQlMzWkNMRU5CUVV3N1FVRkRSRHRCUVVOR0xFdEJVa1FzVFVGUlR5eEpRVUZKUlN4VlFVRlZkazRzVFVGQlpDeEZRVUZ6UWp0QlFVTXpRaXhWUVVGSk9FWXNXVUZCV1ROQ0xFVkJRVVZ2UXl4blFrRkJiRUlzUlVGQmIwTTdRVUZEYkVOTk8wRkJRMFE3UVVGRFJDeFZRVUZKTmtnc1MwRkJTaXhGUVVGWE8wRkJRMVJvUWl4aFFVRkxMRWxCUVV3N1FVRkRRV3RDTEdGQlFVdDJRaXhEUVVGTU8wRkJRMFE3UVVGRFJpeExRVkpOTEUxQlVVRXNTVUZCU1VVc1ZVRkJWVEZPTEdGQlFXUXNSVUZCTmtJN1FVRkRiRU1zVlVGQlNXbEhMRmxCUVZrelFpeEZRVUZGYjBNc1owSkJRV3hDTEVWQlFXOURPMEZCUTJ4RFRUdEJRVU5FTzBGQlEwWXNTMEZLVFN4TlFVbEJMRWxCUVVrMlNDeExRVUZLTEVWQlFWYzdRVUZEYUVJc1ZVRkJTVzVDTEZWQlFWVjZUaXhUUVVGa0xFVkJRWGxDTzBGQlEzWkNMRmxCUVVreVJpeFRRVUZLTEVWQlFXVTdRVUZEWW5WRExEaENRVUZWSzBJc1UwRkJWaXhEUVVGdlFuUkZMRk5CUVhCQ0xFVkJRU3RDTEU5QlFTOUNPMEZCUTBRc1UwRkdSQ3hOUVVWUE8wRkJRMHh4UWp0QlFVTkVPMEZCUTBRNFNDeGhRVUZMZGtJc1EwRkJURHRCUVVORUxFOUJVRVFzVFVGUFR5eEpRVUZKUlN4VlFVRlZlRTRzVDBGQlpDeEZRVUYxUWp0QlFVTTFRaXRITzBGQlEwRTRTQ3hoUVVGTGRrSXNRMEZCVER0QlFVTkVPMEZCUTBZN1FVRkRSanM3UVVGRlJDeFhRVUZUZFVJc1NVRkJWQ3hEUVVGbGRrSXNRMEZCWml4RlFVRnJRanRCUVVOb1FrRXNUVUZCUlhkQ0xHVkJRVVk3UVVGRFFYaENMRTFCUVVWNVFpeGpRVUZHTzBGQlEwUTdPMEZCUlVRc1YwRkJVME1zWVVGQlZDeEhRVUV3UWp0QlFVTjRRaXhSUVVGSmJrb3NVMEZCU2l4RlFVRmxPMEZCUTJKQkxHZENRVUZWTkVjc1UwRkJWaXhEUVVGdlFuWkZMRTFCUVhCQ0xFTkJRVEpDTEZWQlFUTkNPMEZCUTBRN1FVRkRSanM3UVVGRlJDeFhRVUZUSzBjc1lVRkJWQ3hIUVVFd1FqdEJRVU40UWl4UlFVRkpjRW9zVTBGQlNpeEZRVUZsTzBGQlEySkJMR2RDUVVGVk5FY3NVMEZCVml4RFFVRnZRbXBGTEVkQlFYQkNMRU5CUVhkQ0xGVkJRWGhDTzBGQlEwUTdRVUZEUmpzN1FVRkZSQ3hYUVVGVGNFUXNVMEZCVkN4SFFVRnpRanRCUVVOd1FpeFJRVUZKTEVOQlFVTm5TU3hUUVVGTUxFVkJRV2RDTzBGQlEyUTdRVUZEUkR0QlFVTkVhRWdzY1VKQlFXbENMRWxCUVdwQ08wRkJRMEUyUWl4M1FrRkJWU3RDTEZOQlFWWXNRMEZCYjBKd1JTeFZRVUZ3UWl4RlFVRm5ReXhsUVVGb1F6dEJRVU5CTEZGQlFVMXVSQ3hSUVVGUk1FWXNWMEZCWkR0QlFVTkJMRkZCUVVrc1EwRkJReTlFTEVWQlFVVnFSQ3hYUVVGSUxFbEJRV3RDTEVOQlFVTnpRaXhMUVVGMlFpeEZRVUU0UWp0QlFVTTFRbk5GTEdGQlFWRTdRVUZEVkR0QlFVTkVMRkZCUVUxdFNTeFZRVUZWTlUwc1ZVRkJWU3hGUVVGRlR5eFBRVUZQU2l4TFFVRlVMRVZCUVZZc1EwRkJhRUk3UVVGRFFTeFJRVUZKTUUwc1VVRkJVVU1zWjBKQlFWbzdRVUZEUVN4UlFVRkpSQ3hWUVVGVkxFTkJRVllzU1VGQlpVUXNUMEZCWml4SlFVRXdRblpKTEZGQlFUbENMRVZCUVhkRE8wRkJRM1JEY1VrN1FVRkRSQ3hMUVVaRUxFMUJSVTg3UVVGRFRFTTdRVUZEUkR0QlFVTkVMRkZCUVVrc1EwRkJRM1pLTEZOQlFVd3NSVUZCWjBJN1FVRkRaR2xKTzBGQlEwUTdRVUZEUkN4UlFVRkpMRU5CUVVOcVNTeFRRVUZFTEVsQlFXTXNRMEZCUTNkS0xFOUJRVzVDTEVWQlFUUkNPMEZCUXpGQ2JrazdRVUZEUkR0QlFVTkVMR0ZCUVZOeFNTeGpRVUZVTEVkQlFUSkNPMEZCUTNwQ0xGVkJRVWxzUnl4WFFVRlhia1VzVjBGQlYybEtMRlZCUVRGQ08wRkJRMEVzVlVGQlNXMUNMRkZCUVZFc1EwRkJXanRCUVVOQkxHRkJRVTlxUnl4UlFVRlFMRVZCUVdsQ08wRkJRMllzV1VGQlRWZ3NUMEZCVDJsSExGTkJRVk4wUml4UlFVRlVMRU5CUVdJN1FVRkRRU3haUVVGTmJVY3NWVUZCVlVNc1lVRkJZUzlITEVsQlFXSXNRMEZCYUVJN1FVRkRRU3haUVVGSk9FY3NXVUZCV1N4RFFVRm9RaXhGUVVGdFFqdEJRVU5xUW01SExHMUNRVUZUZFVRc1UwRkJWQ3hEUVVGdFFtcEZMRWRCUVc1Q0xFTkJRWFZDTEZWQlFYWkNPMEZCUTBRc1UwRkdSQ3hOUVVWUE8wRkJRMHhWTEcxQ1FVRlRkVVFzVTBGQlZDeERRVUZ0UW5aRkxFMUJRVzVDTEVOQlFUQkNMRlZCUVRGQ08wRkJRMFE3UVVGRFJHbElMR2xDUVVGVFJTeFBRVUZVTzBGQlEwRnVSeXh0UWtGQlYwRXNVMEZCVTNGSExGZEJRWEJDTzBGQlEwUTdRVUZEUkN4aFFVRlBTaXhMUVVGUU8wRkJRMFE3UVVGRFJDeGhRVUZUUnl4WlFVRlVMRU5CUVhWQ2JrY3NSVUZCZGtJc1JVRkJNa0k3UVVGRGVrSXNWVUZCU1VVc1MwRkJTMFlzUjBGQlJ6WkZMRlZCUVZvN1FVRkRRU3hWUVVGSmJVSXNVVUZCVVN4RFFVRmFPMEZCUTBFc1lVRkJUemxHTEVWQlFWQXNSVUZCVnp0QlFVTlVMRmxCUVVrNFJpeFRRVUZUYms0c1MwRkJZaXhGUVVGdlFqdEJRVU5zUW1sSExEaENRVUZWSzBJc1UwRkJWaXhEUVVGdlFsZ3NSVUZCY0VJc1JVRkJkMElzWVVGQmVFSTdRVUZEUkN4VFFVWkVMRTFCUlU4N1FVRkRUSEJDTERoQ1FVRlZLMElzVTBGQlZpeERRVUZ2UWxnc1JVRkJjRUlzUlVGQmQwSXNaVUZCZUVJN1FVRkRRU3hqUVVGSlFTeEhRVUZIVXl4VFFVRklMRU5CUVdGdFF5eFBRVUZpTEVOQlFYRkNMRlZCUVhKQ0xFMUJRWEZETEVOQlFVTXNRMEZCTVVNc1JVRkJOa003UVVGRE0wTnJSRHRCUVVOQkxHZENRVUZKTTBzc1YwRkJTaXhGUVVGcFFqdEJRVU5tYjBjc2QwSkJRVlYyUWl4RlFVRldMRVZCUVdNMVJ5eExRVUZrTzBGQlEwUTdRVUZEUmp0QlFVTkdPMEZCUTBRMFJ5eGhRVUZMUVN4SFFVRkhhMGNzVjBGQlVqdEJRVU5FTzBGQlEwUXNZVUZCVDBvc1MwRkJVRHRCUVVORU8wRkJRMFk3TzBGQlJVUXNWMEZCVTBzc2QwSkJRVlFzUTBGQmJVTnNReXhEUVVGdVF5eEZRVUZ6UXp0QlFVTndReXhSUVVGTlJTeFJRVUZSUml4RlFVRkZSU3hMUVVGR0xFbEJRVmRHTEVWQlFVVnpRaXhQUVVFelFqdEJRVU5CTEZGQlFVbHdRaXhWUVVGVmVrNHNVMEZCWkN4RlFVRjVRanRCUVVOMlFqdEJRVU5FTzBGQlEwUnRSanRCUVVORU96dEJRVVZFTEZkQlFWTjFTeXhaUVVGVUxFTkJRWFZDYmtNc1EwRkJka0lzUlVGQk1FSTdRVUZEZUVJc1VVRkJUVVVzVVVGQlVVWXNSVUZCUlVVc1MwRkJSaXhKUVVGWFJpeEZRVUZGYzBJc1QwRkJNMEk3UVVGRFFTeFJRVUZKY0VJc1ZVRkJWWHBPTEZOQlFWWXNTVUZCZFVKNVRpeFZRVUZWY2s0c1QwRkJja01zUlVGQk9FTTdRVUZETlVNN1FVRkRSRHRCUVVORWRWQXNaVUZCVnpWSkxFbEJRVmdzUlVGQmFVSXNRMEZCYWtJN1FVRkRSRHM3UVVGRlJDeFhRVUZUTmtrc2RVSkJRVlFzUTBGQmEwTnlReXhEUVVGc1F5eEZRVUZ4UXp0QlFVTnVReXhSUVVGSmMwTXNVMEZCVTNSRExFVkJRVVZ6UXl4TlFVRm1PMEZCUTBFc1VVRkJTVUVzVjBGQlYyaExMRlZCUVdZc1JVRkJNa0k3UVVGRGVrSXNZVUZCVHl4SlFVRlFPMEZCUTBRN1FVRkRSQ3hYUVVGUFowc3NUVUZCVUN4RlFVRmxPMEZCUTJJc1ZVRkJTVUVzVjBGQlZ6TkxMRk5CUVZnc1NVRkJkMEl5U3l4WFFVRlhhRXNzVlVGQmRrTXNSVUZCYlVRN1FVRkRha1FzWlVGQlR5eEpRVUZRTzBGQlEwUTdRVUZEUkdkTExHVkJRVk5CTEU5QlFVOURMRlZCUVdoQ08wRkJRMFE3UVVGRFJqczdRVUZGUkN4WFFVRlRReXhWUVVGVUxFTkJRWEZDZUVNc1EwRkJja0lzUlVGQmQwSTdRVUZEZEVJc1VVRkJUVVVzVVVGQlVVWXNSVUZCUlVVc1MwRkJSaXhKUVVGWFJpeEZRVUZGYzBJc1QwRkJNMEk3UVVGRFFTeFJRVUZKY0VJc1ZVRkJWWEpPTEU5QlFXUXNSVUZCZFVJN1FVRkRja0kwUnp0QlFVTkVPMEZCUTBZN08wRkJSVVFzVjBGQlUyZEtMRmRCUVZRc1EwRkJjMEo2UXl4RFFVRjBRaXhGUVVGNVFqdEJRVU4yUWl4UlFVRkpjVU1zZDBKQlFYZENja01zUTBGQmVFSXNRMEZCU2l4RlFVRm5RenRCUVVNNVFqdEJRVU5FTzBGQlEwUjJSenRCUVVORU96dEJRVVZFTEZkQlFWTmpMRmRCUVZRc1EwRkJjMEpMTEUxQlFYUkNMRVZCUVRoQ08wRkJRelZDTEZGQlFVMDRTQ3hMUVVGTE9VZ3NVMEZCVXl4UlFVRlVMRWRCUVc5Q0xFdEJRUzlDTzBGQlEwRXNVVUZCU1haRExFZEJRVW9zUlVGQlV6dEJRVU5RUVN4VlFVRkpjMElzVDBGQlNqdEJRVU5CZEVJc1dVRkJUU3hKUVVGT08wRkJRMFE3UVVGRFJDeFJRVUZKTEVOQlFVTjFReXhOUVVGTUxFVkJRV0U3UVVGRFdIWkRMRmxCUVUwc2QwSkJRVk5XTEZOQlFWUXNSVUZCYjBKWExGVkJRWEJDTEVWQlFXZERPMEZCUTNCRGNVc3NaVUZCVDJ4TExGbEJRVmxJTEZkQlFWZGhMRTlCUVZnc1MwRkJkVUlzVDBGRVRqdEJRVVZ3UTNsS0xHbENRVUZUT1V3c1JVRkJSV2hFTzBGQlJubENMRTlCUVdoRExFTkJRVTQ3UVVGSlFTeFZRVUZKTEVOQlFVTm5UU3hUUVVGTUxFVkJRV2RDTzBGQlFVVjZTQ3haUVVGSk9Fa3NTMEZCU2p0QlFVRmpPMEZCUTJwRE8wRkJRMFFzVVVGQlNYWkhMRlZCUVZkdVF5eFpRVUZaTTBZc1NVRkJTU3RRTEdGQlFVb3NTMEZCYzBKMlN5eFZRVUZxUkN4RlFVRTRSRHRCUVVNMVJIRkRMREJDUVVGVkswZ3NSVUZCVml4RlFVRmpjRXNzVlVGQlpDeEZRVUV3UWl4UFFVRXhRaXhGUVVGdFExTXNUMEZCYmtNN1FVRkRSQ3hMUVVaRUxFMUJSVTg3UVVGRFRFRTdRVUZEUkR0QlFVTkVMRkZCUVVsT0xGRkJRVW9zUlVGQll6dEJRVU5hYTBNc01FSkJRVlVyU0N4RlFVRldMRVZCUVdOd1N5eFZRVUZrTEVWQlFUQkNMRlZCUVRGQ0xFVkJRWE5ETmtvc1dVRkJkRU03UVVGRFFYaElMREJDUVVGVkswZ3NSVUZCVml4RlFVRmpjRXNzVlVGQlpDeEZRVUV3UWl4VlFVRXhRaXhGUVVGelExWXNhVUpCUVhSRE8wRkJRMEVyUXl3d1FrRkJWU3RJTEVWQlFWWXNSVUZCWTNCTExGVkJRV1FzUlVGQk1FSXNVMEZCTVVJc1JVRkJjVU0wU2l4M1FrRkJja003UVVGRFFYWklMREJDUVVGVkswZ3NSVUZCVml4RlFVRmpjRXNzVlVGQlpDeEZRVUV3UWl4UFFVRXhRaXhGUVVGdFExWXNhVUpCUVc1RE8wRkJRMEVyUXl3d1FrRkJWU3RJTEVWQlFWWXNSVUZCWTNCTExGVkJRV1FzUlVGQk1FSXNVMEZCTVVJc1JVRkJjVU00U1N4UFFVRnlRenRCUVVOQkxGVkJRVWwwU3l4RlFVRkZhME1zWTBGQlRpeEZRVUZ6UWp0QlFVRkZNa0lzTkVKQlFWVXJTQ3hGUVVGV0xFVkJRV053U3l4VlFVRmtMRVZCUVRCQ0xGTkJRVEZDTEVWQlFYRkRhMHNzVlVGQmNrTTdRVUZCYlVRN1FVRkROVVVzUzBGUVJDeE5RVTlQTzBGQlEwdzNTQ3d3UWtGQlZTdElMRVZCUVZZc1JVRkJZM0JMTEZWQlFXUXNSVUZCTUVJc1QwRkJNVUlzUlVGQmJVTjVTQ3hQUVVGdVF6dEJRVU5CY0VZc01FSkJRVlVyU0N4RlFVRldMRVZCUVdNeFVDeFZRVUZrTEVWQlFUQkNMRk5CUVRGQ0xFVkJRWEZEYjA4c1QwRkJja003UVVGRFJEdEJRVU5FTEZGQlFVbDBTeXhGUVVGRmJVTXNaVUZCVGl4RlFVRjFRanRCUVVGRk1FSXNNRUpCUVZVclNDeEZRVUZXTEVWQlFXTTFVQ3hIUVVGa0xFVkJRVzFDTEU5QlFXNUNMRVZCUVRSQ01sQXNWMEZCTlVJN1FVRkJNa003UVVGRGNFVXNVVUZCU1hoTUxFbEJRVW9zUlVGQlZUdEJRVUZGTUVRc01FSkJRVlVyU0N4RlFVRldMRVZCUVdONlRDeEpRVUZrTEVWQlFXOUNMRkZCUVhCQ0xFVkJRVGhDZDBNc1NVRkJPVUk3UVVGQmMwTTdRVUZEYmtRN08wRkJSVVFzVjBGQlUwVXNUMEZCVkN4SFFVRnZRanRCUVVOc1Fsa3NaMEpCUVZrc1NVRkJXanRCUVVOQkxGRkJRVWw0UkN4UFFVRlBLMHdzVVVGQlVDeERRVUZuUW01TUxGTkJRV2hDTEVOQlFVb3NSVUZCWjBNN1FVRkJSVm9zWVVGQlQzVkZMRmRCUVZBc1EwRkJiVUl6UkN4VFFVRnVRanRCUVVGblF6dEJRVU51UlRzN1FVRkZSQ3hYUVVGVGRrTXNZVUZCVkN4RFFVRjNRa1FzUzBGQmVFSXNSVUZCSzBJN1FVRkROMElzVVVGQlNYRkVMRk5CUVVvc1JVRkJaVHRCUVVOaUxGVkJRVWx1Uml4bFFVRmxMRWxCUVc1Q0xFVkJRWGxDTzBGQlEzWkNSaXhYUVVGSFowTXNTMEZCU0N4SlFVRlpMRTFCUVUxQkxFdEJRV3hDTzBGQlEwUXNUMEZHUkN4TlFVVlBPMEZCUTB4b1F5eFhRVUZIWjBNc1MwRkJTQ3hIUVVGWFFTeExRVUZZTzBGQlEwUTdRVUZEUml4TFFVNUVMRTFCVFU4N1FVRkRUQ3hWUVVGSk9VSXNaVUZCWlN4SlFVRnVRaXhGUVVGNVFqdEJRVU4yUWtZc1YwRkJSMjlKTEZOQlFVZ3NTVUZCWjBJc1RVRkJUWEJITEV0QlFYUkNPMEZCUTBRc1QwRkdSQ3hOUVVWUE8wRkJRMHhvUXl4WFFVRkhiMGtzVTBGQlNDeEhRVUZsY0Vjc1MwRkJaanRCUVVORU8wRkJRMFk3UVVGRFJqczdRVUZGUkN4WFFVRlRhVU1zYlVKQlFWUXNRMEZCT0VJeVJTeEZRVUU1UWl4RlFVRnJRMW9zVlVGQmJFTXNSVUZCT0VNN1FVRkROVU5tTEZOQlFVc3lRaXhGUVVGTUxFVkJRVk0xU0N4UlFVRlJaMGdzVlVGQlVpeERRVUZVTzBGQlEwUTdPMEZCUlVRc1YwRkJVemxFTEhWQ1FVRlVMRU5CUVd0RE1Fd3NSMEZCYkVNc1JVRkJkVU42VGl4SlFVRjJReXhGUVVFMlF6dEJRVU16UXl4UlFVRkpRU3hMUVVGTGIwY3NSVUZCVEN4TFFVRlpMRk5CUVdoQ0xFVkJRVEpDTzBGQlEzcENMRlZCUVUxQkxFdEJRVXRvUlN4SlFVRkpMRXRCUVVvc1JVRkJWeXhwUWtGQldDeERRVUZZTzBGQlEwRnhUQ3hWUVVGSk5Va3NWMEZCU2l4RFFVRm5RblZDTEVWQlFXaENPMEZCUTBGMFFpeFhRVUZMYzBJc1JVRkJUQ3hGUVVGVGNFY3NTMEZCUzI5SExFVkJRV1E3UVVGRFJEdEJRVU5HT3p0QlFVVkVMRmRCUVZOdVJTeGhRVUZVTEVOQlFYZENlVXdzUTBGQmVFSXNSVUZCTWtJM1NDeFZRVUV6UWl4RlFVRjFRenRCUVVOeVF5eFJRVUZOYjBNc1UwRkJVM2xHTEVWQlFVVkRMRmRCUVVZc1JVRkJaanRCUVVOQkxGRkJRVTAzU1N4UFFVRlBha2NzVVVGQlVXZElMRlZCUVZJc1MwRkJkVUlzUlVGQmNFTTdRVUZEUVN4UlFVRkpMREpDUVVGWmIwTXNUVUZCV2l4RlFVRnZRbTVFTEV0QlFVczJTU3hYUVVGTUxFVkJRWEJDTEVOQlFVb3NSVUZCTmtNN1FVRkRNME1zWVVGQlR5eEpRVUZRTzBGQlEwUTdRVUZEUkN4UlFVRk5PVTRzVVVGQlVXUXNVMEZCVXpoSExGVkJRVlFzUzBGQmQwSXNSVUZCZEVNN1FVRkRRU3hSUVVGSkxFOUJRVTlvUnl4TFFVRlFMRXRCUVdsQ0xGRkJRWEpDTEVWQlFTdENPMEZCUXpkQ0xHRkJRVThzUzBGQlVEdEJRVU5FTzBGQlEwUXNWMEZCVHl3eVFrRkJXVzlKTEUxQlFWb3NSVUZCYjBKd1NTeE5RVUZOT0U0c1YwRkJUaXhGUVVGd1FpeERRVUZRTzBGQlEwUTdPMEZCUlVRc1YwRkJVME1zWjBKQlFWUXNRMEZCTWtJNVNTeEpRVUV6UWl4RlFVRnBReXRKTEVOQlFXcERMRVZCUVc5RE8wRkJRMnhETEZGQlFVa3hUU3hUUVVGVExFVkJRV0k3UVVGRFFTeFJRVUZKTWswc1YwRkJWeXhMUVVGbU8wRkJRMEVzVVVGQlNYaE9MRkZCUVZGMVRpeEZRVUZGZGs0c1MwRkJaRHRCUVVOQkxGZEJRVTkzVGl4aFFVRmhMRXRCUVdJc1NVRkJjMEo0VGl4VFFVRlRMRU5CUVhSRExFVkJRWGxETzBGQlEzWkRZU3hsUVVGVE1rUXNTMEZCUzJsS0xFMUJRVXdzUTBGQldYcE9MRkZCUVZFc1EwRkJjRUlzUlVGQmRVSjFUaXhGUVVGRmRrNHNTMEZCUml4SFFVRlZRU3hMUVVGV0xFZEJRV3RDTEVOQlFYcERMRU5CUVZRN1FVRkRRWGRPTEdsQ1FVRlhNVXNzV1VGQldUUkxMRWxCUVZvc1EwRkJhVUkzVFN4TlFVRnFRaXhEUVVGWU8wRkJRMEZpTzBGQlEwUTdRVUZEUkN4WFFVRlBPMEZCUTB4M1JTeFpRVUZOWjBvc1YwRkJWek5OTEUxQlFWZ3NSMEZCYjBJc1NVRkVja0k3UVVGRlRHSTdRVUZHU3l4TFFVRlFPMEZCU1VRN08wRkJSVVFzVjBGQlUyMUZMR3RDUVVGVUxFTkJRVFpDYVVvc1EwRkJOMElzUlVGQlowTTNTQ3hWUVVGb1F5eEZRVUUwUXp0QlFVTXhReXhSUVVGTmIwa3NWMEZCVnl4dlFrRkJTM0JSTEVWQlFVd3NRMEZCYWtJN1FVRkRRU3hSUVVGTmJVUXNVVUZCVVRSTkxHbENRVUZwUWtZc1EwRkJha0lzUlVGQmIwSlBMRkZCUVhCQ0xFVkJRVGhDYmtvc1NVRkJOVU03UVVGRFFTeFJRVUZKT1VRc1MwRkJTaXhGUVVGWE8wRkJRMVFzWVVGQlR5eEZRVUZGUVN4WlFVRkdMRVZCUVZNMlJTeHpRa0ZCVkN4RlFVRlFPMEZCUTBRN1FVRkRSanM3UVVGRlJDeFhRVUZUZEVJc1ZVRkJWQ3hEUVVGeFFqRkZMRXRCUVhKQ0xFVkJRVFJDTzBGQlF6RkNMRkZCUVUxeFR5eFZRVUZWY2xFc1IwRkJSMmRETEV0QlFXNUNPMEZCUTBFc1VVRkJUVzlQTEZkQlFWY3NiMEpCUVV0d1VTeEZRVUZNTEVOQlFXcENPMEZCUTBFc1VVRkJUVzFFTEZGQlFWRTBUU3hwUWtGQmFVSk5MRTlCUVdwQ0xFVkJRVEJDUkN4UlFVRXhRaXhEUVVGa08wRkJRMEVzVVVGQlRYUkVMRTlCUVU5MVJDeFJRVUZSU0N4TlFVRlNMRU5CUVdVc1EwRkJaaXhGUVVGclFpOU5MRTFCUVUxV0xFdEJRWGhDTEVOQlFXSTdRVUZEUVN4UlFVRk5OazRzVVVGQlVVUXNVVUZCVVVnc1RVRkJVaXhEUVVGbEwwMHNUVUZCVFZZc1MwRkJUaXhIUVVGalZTeE5RVUZOT0VRc1NVRkJUaXhEUVVGWE5VVXNUVUZCZWtJc1NVRkJiVU1yVGl4VFFVRlRSeXhIUVVGVUxFZEJRV1ZJTEZOQlFWTXpUaXhMUVVFelJDeERRVUZtTEVOQlFXUTdRVUZEUVN4UlFVRk5LMDRzVTBGQlV6RkVMRTlCUVU4NVN5eExRVUZRTEVkQlFXVXNSMEZCT1VJN08wRkJSVUZvUXl4UFFVRkhaME1zUzBGQlNDeEhRVUZYZDA4c1UwRkJVMFlzUzBGQmNFSTdRVUZEUVN4M1FrRkJTM1JSTEVWQlFVd3NSVUZCVXl4RlFVRkZlVU1zVDBGQlR5dE9MRTlCUVU5dVR5eE5RVUZvUWl4RlFVRjNRbXRQTEV0QlFVdERMRTlCUVU5dVR5eE5RVUZ3UXl4RlFVRlVPMEZCUTBRN08wRkJSVVFzVjBGQlUzZEZMR3RDUVVGVUxFZEJRU3RDTzBGQlF6ZENMRlZCUVUwc1NVRkJTVFJLTEV0QlFVb3NRMEZCVlN4M1JFRkJWaXhEUVVGT08wRkJRMFE3TzBGQlJVUXNWMEZCVXpsS0xGVkJRVlFzUjBGQmRVSTdRVUZEY2tJc1ZVRkJUU3hKUVVGSk9Fb3NTMEZCU2l4RFFVRlZMSGRFUVVGV0xFTkJRVTQ3UVVGRFJEczdRVUZGUkN4WFFVRlRNVU1zVVVGQlZDeERRVUZ0UW5SR0xGRkJRVzVDTEVWQlFUWkNPMEZCUVVVc1YwRkJUeXh6UWtGQlR5eFhRVUZRTEVWQlFXOUNRU3hSUVVGd1FpeEZRVUU0UWl4RFFVRTVRaXhEUVVGUU8wRkJRVEJETzBGQlF6RkZPenRCUVVWRUxGTkJRVk5wUlN4UFFVRlVMRU5CUVd0Q01VMHNSVUZCYkVJc1JVRkJjMEk3UVVGQlJTeFRRVUZQUVN4SFFVRkhaMGNzVDBGQlNDeExRVUZsTEU5QlFXWXNTVUZCTUVKb1J5eEhRVUZIWjBjc1QwRkJTQ3hMUVVGbExGVkJRV2hFTzBGQlFUWkVPenRCUVVWeVJpeFRRVUZUZWtJc1IwRkJWQ3hEUVVGamJVMHNTVUZCWkN4RlFVRnZRbkpJTEZOQlFYQkNMRVZCUVN0Q08wRkJRemRDTEUxQlFVMXlTaXhMUVVGTFRDeEpRVUZKYzBzc1lVRkJTaXhEUVVGclFubEhMRWxCUVd4Q0xFTkJRVmc3UVVGRFFURlJMRXRCUVVkeFNpeFRRVUZJTEVkQlFXVkJMRk5CUVdZN1FVRkRRU3hUUVVGUGNrb3NSVUZCVUR0QlFVTkVPenRCUVVWRUxGTkJRVk13UlN4TFFVRlVMRU5CUVdkQ2FVMHNSVUZCYUVJc1JVRkJiMEk3UVVGQlJTeFRRVUZQTEZsQlFWazdRVUZCUlRGQ0xHVkJRVmN3UWl4RlFVRllMRVZCUVdVc1EwRkJaanRCUVVGdlFpeEhRVUY2UXp0QlFVRTBRenRCUVVOc1JTeFRRVUZUTVVvc1NVRkJWQ3hEUVVGbGFrZ3NSVUZCWml4RlFVRnRRbWRETEV0QlFXNUNMRVZCUVRCQ08wRkJRVVZvUXl4TFFVRkhhMHNzVTBGQlNDeEhRVUZsYkVzc1IwRkJSekpLTEZkQlFVZ3NSMEZCYVVJelNDeExRVUZvUXp0QlFVRjNRenM3UVVGRmNFVXNVMEZCVTNGR0xGVkJRVlFzUTBGQmNVSnlTQ3hGUVVGeVFpeEZRVUY1UWp0QlFVTjJRaXhOUVVGTlowTXNVVUZCVVdoRExFZEJRVWMwVVN4WlFVRklMRU5CUVdkQ0xHbENRVUZvUWl4RFFVRmtPMEZCUTBFc1RVRkJTVFZQTEZWQlFWVXNUMEZCWkN4RlFVRjFRanRCUVVOeVFpeFhRVUZQTEV0QlFWQTdRVUZEUkR0QlFVTkVMRTFCUVVsQkxGVkJRVlVzVFVGQlpDeEZRVUZ6UWp0QlFVTndRaXhYUVVGUExFbEJRVkE3UVVGRFJEdEJRVU5FTEUxQlFVbG9ReXhIUVVGSE1Fb3NZVUZCVUN4RlFVRnpRanRCUVVOd1FpeFhRVUZQY2tNc1YwRkJWM0pJTEVkQlFVY3dTaXhoUVVGa0xFTkJRVkE3UVVGRFJEdEJRVU5FTEZOQlFVOHNTMEZCVUR0QlFVTkVPenRCUVVWRWJVZ3NUMEZCVDBNc1QwRkJVQ3hIUVVGcFFpOVJMRTFCUVdwQ0lpd2labWxzWlNJNkltaHZjbk5sZVM1cWN5SXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaWQxYzJVZ2MzUnlhV04wSnp0Y2JseHVhVzF3YjNKMElITjFiU0JtY205dElDZG9ZWE5vTFhOMWJTYzdYRzVwYlhCdmNuUWdjMlZzYkNCbWNtOXRJQ2R6Wld4c0p6dGNibWx0Y0c5eWRDQnpaV3QwYjNJZ1puSnZiU0FuYzJWcmRHOXlKenRjYm1sdGNHOXlkQ0JsYldsMGRHVnlJR1p5YjIwZ0oyTnZiblJ5WVM5bGJXbDBkR1Z5Snp0Y2JtbHRjRzl5ZENCaWRXeHNjMlY1WlNCbWNtOXRJQ2RpZFd4c2MyVjVaU2M3WEc1cGJYQnZjblFnWTNKdmMzTjJaVzUwSUdaeWIyMGdKMk55YjNOemRtVnVkQ2M3WEc1cGJYQnZjblFnWm5WNmVubHpaV0Z5WTJnZ1puSnZiU0FuWm5WNmVubHpaV0Z5WTJnbk8xeHVhVzF3YjNKMElHUmxZbTkxYm1ObElHWnliMjBnSjJ4dlpHRnphQzlrWldKdmRXNWpaU2M3WEc1amIyNXpkQ0JMUlZsZlFrRkRTMU5RUVVORklEMGdPRHRjYm1OdmJuTjBJRXRGV1Y5RlRsUkZVaUE5SURFek8xeHVZMjl1YzNRZ1MwVlpYMFZUUXlBOUlESTNPMXh1WTI5dWMzUWdTMFZaWDFWUUlEMGdNemc3WEc1amIyNXpkQ0JMUlZsZlJFOVhUaUE5SURRd08xeHVZMjl1YzNRZ1MwVlpYMVJCUWlBOUlEazdYRzVqYjI1emRDQmtiMk1nUFNCa2IyTjFiV1Z1ZER0Y2JtTnZibk4wSUdSdlkwVnNaVzFsYm5RZ1BTQmtiMk11Wkc5amRXMWxiblJGYkdWdFpXNTBPMXh1WEc1bWRXNWpkR2x2YmlCb2IzSnpaWGtnS0dWc0xDQnZjSFJwYjI1eklEMGdlMzBwSUh0Y2JpQWdZMjl1YzNRZ2UxeHVJQ0FnSUhObGRFRndjR1Z1WkhNc1hHNGdJQ0FnYzJWMExGeHVJQ0FnSUdacGJIUmxjaXhjYmlBZ0lDQnpiM1Z5WTJVc1hHNGdJQ0FnWTJGamFHVWdQU0I3ZlN4Y2JpQWdJQ0J3Y21Wa2FXTjBUbVY0ZEZObFlYSmphQ3hjYmlBZ0lDQnlaVzVrWlhKSmRHVnRMRnh1SUNBZ0lISmxibVJsY2tOaGRHVm5iM0o1TEZ4dUlDQWdJR0pzWVc1clUyVmhjbU5vTEZ4dUlDQWdJR0Z3Y0dWdVpGUnZMRnh1SUNBZ0lHRnVZMmh2Y2l4Y2JpQWdJQ0JrWldKdmRXNWpaVnh1SUNCOUlEMGdiM0IwYVc5dWN6dGNiaUFnWTI5dWMzUWdZMkZqYUdsdVp5QTlJRzl3ZEdsdmJuTXVZMkZqYUdVZ0lUMDlJR1poYkhObE8xeHVJQ0JwWmlBb0lYTnZkWEpqWlNrZ2UxeHVJQ0FnSUhKbGRIVnlianRjYmlBZ2ZWeHVYRzRnSUdOdmJuTjBJSFZ6WlhKSFpYUlVaWGgwSUQwZ2IzQjBhVzl1Y3k1blpYUlVaWGgwTzF4dUlDQmpiMjV6ZENCMWMyVnlSMlYwVm1Gc2RXVWdQU0J2Y0hScGIyNXpMbWRsZEZaaGJIVmxPMXh1SUNCamIyNXpkQ0JuWlhSVVpYaDBJRDBnS0Z4dUlDQWdJSFI1Y0dWdlppQjFjMlZ5UjJWMFZHVjRkQ0E5UFQwZ0ozTjBjbWx1WnljZ1B5QmtJRDArSUdSYmRYTmxja2RsZEZSbGVIUmRJRHBjYmlBZ0lDQjBlWEJsYjJZZ2RYTmxja2RsZEZSbGVIUWdQVDA5SUNkbWRXNWpkR2x2YmljZ1B5QjFjMlZ5UjJWMFZHVjRkQ0E2WEc0Z0lDQWdaQ0E5UGlCa0xuUnZVM1J5YVc1bktDbGNiaUFnS1R0Y2JpQWdZMjl1YzNRZ1oyVjBWbUZzZFdVZ1BTQW9YRzRnSUNBZ2RIbHdaVzltSUhWelpYSkhaWFJXWVd4MVpTQTlQVDBnSjNOMGNtbHVaeWNnUHlCa0lEMCtJR1JiZFhObGNrZGxkRlpoYkhWbFhTQTZYRzRnSUNBZ2RIbHdaVzltSUhWelpYSkhaWFJXWVd4MVpTQTlQVDBnSjJaMWJtTjBhVzl1SnlBL0lIVnpaWEpIWlhSV1lXeDFaU0E2WEc0Z0lDQWdaQ0E5UGlCa1hHNGdJQ2s3WEc1Y2JpQWdiR1YwSUhCeVpYWnBiM1Z6VTNWbloyVnpkR2x2Ym5NZ1BTQmJYVHRjYmlBZ2JHVjBJSEJ5WlhacGIzVnpVMlZzWldOMGFXOXVJRDBnYm5Wc2JEdGNiaUFnWTI5dWMzUWdiR2x0YVhRZ1BTQk9kVzFpWlhJb2IzQjBhVzl1Y3k1c2FXMXBkQ2tnZkh3Z1NXNW1hVzVwZEhrN1hHNGdJR052Ym5OMElHTnZiWEJzWlhSbGNpQTlJR0YxZEc5amIyMXdiR1YwWlNobGJDd2dlMXh1SUNBZ0lITnZkWEpqWlRvZ2MyOTFjbU5sUm5WdVkzUnBiMjRzWEc0Z0lDQWdiR2x0YVhRc1hHNGdJQ0FnWjJWMFZHVjRkQ3hjYmlBZ0lDQm5aWFJXWVd4MVpTeGNiaUFnSUNCelpYUkJjSEJsYm1SekxGeHVJQ0FnSUhCeVpXUnBZM1JPWlhoMFUyVmhjbU5vTEZ4dUlDQWdJSEpsYm1SbGNrbDBaVzBzWEc0Z0lDQWdjbVZ1WkdWeVEyRjBaV2R2Y25rc1hHNGdJQ0FnWVhCd1pXNWtWRzhzWEc0Z0lDQWdZVzVqYUc5eUxGeHVJQ0FnSUc1dlRXRjBZMmhsY3l4Y2JpQWdJQ0J1YjAxaGRHTm9aWE5VWlhoME9pQnZjSFJwYjI1ekxtNXZUV0YwWTJobGN5eGNiaUFnSUNCaWJHRnVhMU5sWVhKamFDeGNiaUFnSUNCa1pXSnZkVzVqWlN4Y2JpQWdJQ0J6WlhRZ0tITXBJSHRjYmlBZ0lDQWdJR2xtSUNoelpYUkJjSEJsYm1SeklDRTlQU0IwY25WbEtTQjdYRzRnSUNBZ0lDQWdJR1ZzTG5aaGJIVmxJRDBnSnljN1hHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCd2NtVjJhVzkxYzFObGJHVmpkR2x2YmlBOUlITTdYRzRnSUNBZ0lDQW9jMlYwSUh4OElHTnZiWEJzWlhSbGNpNWtaV1poZFd4MFUyVjBkR1Z5S1NoblpYUlVaWGgwS0hNcExDQnpLVHRjYmlBZ0lDQWdJR052YlhCc1pYUmxjaTVsYldsMEtDZGhablJsY2xObGRDY3BPMXh1SUNBZ0lIMHNYRzRnSUNBZ1ptbHNkR1Z5WEc0Z0lIMHBPMXh1SUNCeVpYUjFjbTRnWTI5dGNHeGxkR1Z5TzF4dUlDQm1kVzVqZEdsdmJpQnViMDFoZEdOb1pYTWdLR1JoZEdFcElIdGNiaUFnSUNCcFppQW9JVzl3ZEdsdmJuTXVibTlOWVhSamFHVnpLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQmtZWFJoTG5GMVpYSjVMbXhsYm1kMGFEdGNiaUFnZlZ4dUlDQm1kVzVqZEdsdmJpQnpiM1Z5WTJWR2RXNWpkR2x2YmlBb1pHRjBZU3dnWkc5dVpTa2dlMXh1SUNBZ0lHTnZibk4wSUh0eGRXVnllU3dnYkdsdGFYUjlJRDBnWkdGMFlUdGNiaUFnSUNCcFppQW9JVzl3ZEdsdmJuTXVZbXhoYm10VFpXRnlZMmdnSmlZZ2NYVmxjbmt1YkdWdVozUm9JRDA5UFNBd0tTQjdYRzRnSUNBZ0lDQmtiMjVsS0c1MWJHd3NJRnRkTENCMGNuVmxLVHNnY21WMGRYSnVPMXh1SUNBZ0lIMWNiaUFnSUNCcFppQW9ZMjl0Y0d4bGRHVnlLU0I3WEc0Z0lDQWdJQ0JqYjIxd2JHVjBaWEl1WlcxcGRDZ25ZbVZtYjNKbFZYQmtZWFJsSnlrN1hHNGdJQ0FnZlZ4dUlDQWdJR052Ym5OMElHaGhjMmdnUFNCemRXMG9jWFZsY25rcE95QXZMeUJtWVhOMExDQmpZWE5sSUdsdWMyVnVjMmwwYVhabExDQndjbVYyWlc1MGN5QmpiMnhzYVhOcGIyNXpYRzRnSUNBZ2FXWWdLR05oWTJocGJtY3BJSHRjYmlBZ0lDQWdJR052Ym5OMElHVnVkSEo1SUQwZ1kyRmphR1ZiYUdGemFGMDdYRzRnSUNBZ0lDQnBaaUFvWlc1MGNua3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjM1JoY25RZ1BTQmxiblJ5ZVM1amNtVmhkR1ZrTG1kbGRGUnBiV1VvS1R0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWkhWeVlYUnBiMjRnUFNCallXTm9aUzVrZFhKaGRHbHZiaUI4ZkNBMk1DQXFJRFl3SUNvZ01qUTdYRzRnSUNBZ0lDQWdJR052Ym5OMElHUnBabVlnUFNCa2RYSmhkR2x2YmlBcUlERXdNREE3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR1p5WlhOb0lEMGdibVYzSUVSaGRHVW9jM1JoY25RZ0t5QmthV1ptS1NBK0lHNWxkeUJFWVhSbEtDazdYRzRnSUNBZ0lDQWdJR2xtSUNobWNtVnphQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lHUnZibVVvYm5Wc2JDd2daVzUwY25rdWFYUmxiWE11YzJ4cFkyVW9LU2s3SUhKbGRIVnlianRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ0lDQjJZWElnYzI5MWNtTmxSR0YwWVNBOUlIdGNiaUFnSUNBZ0lIQnlaWFpwYjNWelUzVm5aMlZ6ZEdsdmJuTTZJSEJ5WlhacGIzVnpVM1ZuWjJWemRHbHZibk11YzJ4cFkyVW9LU3hjYmlBZ0lDQWdJSEJ5WlhacGIzVnpVMlZzWldOMGFXOXVMRnh1SUNBZ0lDQWdhVzV3ZFhRNklIRjFaWEo1TEZ4dUlDQWdJQ0FnY21WdVpHVnlTWFJsYlN4Y2JpQWdJQ0FnSUhKbGJtUmxja05oZEdWbmIzSjVMRnh1SUNBZ0lDQWdiR2x0YVhSY2JpQWdJQ0I5TzF4dUlDQWdJR2xtSUNoMGVYQmxiMllnYjNCMGFXOXVjeTV6YjNWeVkyVWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNBZ0lHOXdkR2x2Ym5NdWMyOTFjbU5sS0hOdmRYSmpaVVJoZEdFc0lITnZkWEpqWldRcE8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0J6YjNWeVkyVmtLRzUxYkd3c0lHOXdkR2x2Ym5NdWMyOTFjbU5sS1R0Y2JpQWdJQ0I5WEc0Z0lDQWdablZ1WTNScGIyNGdjMjkxY21ObFpDQW9aWEp5TENCeVpYTjFiSFFwSUh0Y2JpQWdJQ0FnSUdsbUlDaGxjbklwSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjMjlzWlM1c2IyY29KMEYxZEc5amIyMXdiR1YwWlNCemIzVnlZMlVnWlhKeWIzSXVKeXdnWlhKeUxDQmxiQ2s3WEc0Z0lDQWdJQ0FnSUdSdmJtVW9aWEp5TENCYlhTazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQmpiMjV6ZENCcGRHVnRjeUE5SUVGeWNtRjVMbWx6UVhKeVlYa29jbVZ6ZFd4MEtTQS9JSEpsYzNWc2RDQTZJRnRkTzF4dUlDQWdJQ0FnYVdZZ0tHTmhZMmhwYm1jcElIdGNiaUFnSUNBZ0lDQWdZMkZqYUdWYmFHRnphRjBnUFNCN0lHTnlaV0YwWldRNklHNWxkeUJFWVhSbEtDa3NJR2wwWlcxeklIMDdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQndjbVYyYVc5MWMxTjFaMmRsYzNScGIyNXpJRDBnYVhSbGJYTTdYRzRnSUNBZ0lDQmtiMjVsS0c1MWJHd3NJR2wwWlcxekxuTnNhV05sS0NrcE8xeHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmhkWFJ2WTI5dGNHeGxkR1VnS0dWc0xDQnZjSFJwYjI1eklEMGdlMzBwSUh0Y2JpQWdZMjl1YzNRZ2J5QTlJRzl3ZEdsdmJuTTdYRzRnSUdOdmJuTjBJSEJoY21WdWRDQTlJRzh1WVhCd1pXNWtWRzhnZkh3Z1pHOWpMbUp2WkhrN1hHNGdJR052Ym5OMElIdGNiaUFnSUNCblpYUlVaWGgwTEZ4dUlDQWdJR2RsZEZaaGJIVmxMRnh1SUNBZ0lHWnZjbTBzWEc0Z0lDQWdjMjkxY21ObExGeHVJQ0FnSUc1dlRXRjBZMmhsY3l4Y2JpQWdJQ0J1YjAxaGRHTm9aWE5VWlhoMExGeHVJQ0FnSUdocFoyaHNhV2RvZEdWeUlEMGdkSEoxWlN4Y2JpQWdJQ0JvYVdkb2JHbG5hSFJEYjIxd2JHVjBaVmR2Y21SeklEMGdkSEoxWlN4Y2JpQWdJQ0J5Wlc1a1pYSkpkR1Z0SUQwZ1pHVm1ZWFZzZEVsMFpXMVNaVzVrWlhKbGNpeGNiaUFnSUNCeVpXNWtaWEpEWVhSbFoyOXllU0E5SUdSbFptRjFiSFJEWVhSbFoyOXllVkpsYm1SbGNtVnlMRnh1SUNBZ0lITmxkRUZ3Y0dWdVpITmNiaUFnZlNBOUlHODdYRzRnSUdOdmJuTjBJR3hwYldsMElEMGdkSGx3Wlc5bUlHOHViR2x0YVhRZ1BUMDlJQ2R1ZFcxaVpYSW5JRDhnYnk1c2FXMXBkQ0E2SUVsdVptbHVhWFI1TzF4dUlDQmpiMjV6ZENCMWMyVnlSbWxzZEdWeUlEMGdieTVtYVd4MFpYSWdmSHdnWkdWbVlYVnNkRVpwYkhSbGNqdGNiaUFnWTI5dWMzUWdkWE5sY2xObGRDQTlJRzh1YzJWMElIeDhJR1JsWm1GMWJIUlRaWFIwWlhJN1hHNGdJR052Ym5OMElHTmhkR1ZuYjNKcFpYTWdQU0IwWVdjb0oyUnBkaWNzSUNkelpYa3RZMkYwWldkdmNtbGxjeWNwTzF4dUlDQmpiMjV6ZENCamIyNTBZV2x1WlhJZ1BTQjBZV2NvSjJScGRpY3NJQ2R6WlhrdFkyOXVkR0ZwYm1WeUp5azdYRzRnSUdOdmJuTjBJR1JsWm1WeWNtVmtSbWxzZEdWeWFXNW5JRDBnWkdWbVpYSW9abWxzZEdWeWFXNW5LVHRjYmlBZ1kyOXVjM1FnYzNSaGRHVWdQU0I3SUdOdmRXNTBaWEk2SURBc0lIRjFaWEo1T2lCdWRXeHNJSDA3WEc0Z0lHeGxkQ0JqWVhSbFoyOXllVTFoY0NBOUlFOWlhbVZqZEM1amNtVmhkR1VvYm5Wc2JDazdYRzRnSUd4bGRDQnpaV3hsWTNScGIyNGdQU0J1ZFd4c08xeHVJQ0JzWlhRZ1pYbGxPMXh1SUNCc1pYUWdZWFIwWVdOb2JXVnVkQ0E5SUdWc08xeHVJQ0JzWlhRZ2JtOXVaVTFoZEdOb08xeHVJQ0JzWlhRZ2RHVjRkRWx1Y0hWME8xeHVJQ0JzWlhRZ1lXNTVTVzV3ZFhRN1hHNGdJR3hsZENCeVlXNWphRzl5YkdWbWREdGNiaUFnYkdWMElISmhibU5vYjNKeWFXZG9kRHRjYmlBZ2JHVjBJR3hoYzNSUWNtVm1hWGdnUFNBbkp6dGNiaUFnWTI5dWMzUWdaR1ZpYjNWdVkyVlVhVzFsSUQwZ2J5NWtaV0p2ZFc1alpTQjhmQ0F6TURBN1hHNGdJR052Ym5OMElHUmxZbTkxYm1ObFpFeHZZV1JwYm1jZ1BTQmtaV0p2ZFc1alpTaHNiMkZrYVc1bkxDQmtaV0p2ZFc1alpWUnBiV1VwTzF4dVhHNGdJR2xtSUNodkxtRjFkRzlJYVdSbFQyNUNiSFZ5SUQwOVBTQjJiMmxrSURBcElIc2dieTVoZFhSdlNHbGtaVTl1UW14MWNpQTlJSFJ5ZFdVN0lIMWNiaUFnYVdZZ0tHOHVZWFYwYjBocFpHVlBia05zYVdOcklEMDlQU0IyYjJsa0lEQXBJSHNnYnk1aGRYUnZTR2xrWlU5dVEyeHBZMnNnUFNCMGNuVmxPeUI5WEc0Z0lHbG1JQ2h2TG1GMWRHOVRhRzkzVDI1VmNFUnZkMjRnUFQwOUlIWnZhV1FnTUNrZ2V5QnZMbUYxZEc5VGFHOTNUMjVWY0VSdmQyNGdQU0JsYkM1MFlXZE9ZVzFsSUQwOVBTQW5TVTVRVlZRbk95QjlYRzRnSUdsbUlDaHZMbUZ1WTJodmNpa2dlMXh1SUNBZ0lISmhibU5vYjNKc1pXWjBJRDBnYm1WM0lGSmxaMFY0Y0NnblhpY2dLeUJ2TG1GdVkyaHZjaWs3WEc0Z0lDQWdjbUZ1WTJodmNuSnBaMmgwSUQwZ2JtVjNJRkpsWjBWNGNDaHZMbUZ1WTJodmNpQXJJQ2NrSnlrN1hHNGdJSDFjYmx4dUlDQnNaWFFnYUdGelNYUmxiWE1nUFNCbVlXeHpaVHRjYmlBZ1kyOXVjM1FnWVhCcElEMGdaVzFwZEhSbGNpaDdYRzRnSUNBZ1lXNWphRzl5T2lCdkxtRnVZMmh2Y2l4Y2JpQWdJQ0JqYkdWaGNpeGNiaUFnSUNCemFHOTNMRnh1SUNBZ0lHaHBaR1VzWEc0Z0lDQWdkRzluWjJ4bExGeHVJQ0FnSUdSbGMzUnliM2tzWEc0Z0lDQWdjbVZtY21WemFGQnZjMmwwYVc5dUxGeHVJQ0FnSUdGd2NHVnVaRlJsZUhRc1hHNGdJQ0FnWVhCd1pXNWtTRlJOVEN4Y2JpQWdJQ0JtYVd4MFpYSkJibU5vYjNKbFpGUmxlSFFzWEc0Z0lDQWdabWxzZEdWeVFXNWphRzl5WldSSVZFMU1MRnh1SUNBZ0lHUmxabUYxYkhSQmNIQmxibVJVWlhoME9pQmhjSEJsYm1SVVpYaDBMRnh1SUNBZ0lHUmxabUYxYkhSR2FXeDBaWElzWEc0Z0lDQWdaR1ZtWVhWc2RFbDBaVzFTWlc1a1pYSmxjaXhjYmlBZ0lDQmtaV1poZFd4MFEyRjBaV2R2Y25sU1pXNWtaWEpsY2l4Y2JpQWdJQ0JrWldaaGRXeDBVMlYwZEdWeUxGeHVJQ0FnSUhKbGRHRnlaMlYwTEZ4dUlDQWdJR0YwZEdGamFHMWxiblFzWEc0Z0lDQWdjMjkxY21ObE9pQmJYVnh1SUNCOUtUdGNibHh1SUNCeVpYUmhjbWRsZENobGJDazdYRzRnSUdOdmJuUmhhVzVsY2k1aGNIQmxibVJEYUdsc1pDaGpZWFJsWjI5eWFXVnpLVHRjYmlBZ2FXWWdLRzV2VFdGMFkyaGxjeUFtSmlCdWIwMWhkR05vWlhOVVpYaDBLU0I3WEc0Z0lDQWdibTl1WlUxaGRHTm9JRDBnZEdGbktDZGthWFluTENBbmMyVjVMV1Z0Y0hSNUlITmxlUzFvYVdSbEp5azdYRzRnSUNBZ2RHVjRkQ2h1YjI1bFRXRjBZMmdzSUc1dlRXRjBZMmhsYzFSbGVIUXBPMXh1SUNBZ0lHTnZiblJoYVc1bGNpNWhjSEJsYm1SRGFHbHNaQ2h1YjI1bFRXRjBZMmdwTzF4dUlDQjlYRzRnSUhCaGNtVnVkQzVoY0hCbGJtUkRhR2xzWkNoamIyNTBZV2x1WlhJcE8xeHVJQ0JsYkM1elpYUkJkSFJ5YVdKMWRHVW9KMkYxZEc5amIyMXdiR1YwWlNjc0lDZHZabVluS1R0Y2JseHVJQ0JwWmlBb1FYSnlZWGt1YVhOQmNuSmhlU2h6YjNWeVkyVXBLU0I3WEc0Z0lDQWdiRzloWkdWa0tITnZkWEpqWlN3Z1ptRnNjMlVwTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUdGd2FUdGNibHh1SUNCbWRXNWpkR2x2YmlCeVpYUmhjbWRsZENBb1pXd3BJSHRjYmlBZ0lDQnBibkIxZEVWMlpXNTBjeWgwY25WbEtUdGNiaUFnSUNCaGRIUmhZMmh0Wlc1MElEMGdZWEJwTG1GMGRHRmphRzFsYm5RZ1BTQmxiRHRjYmlBZ0lDQjBaWGgwU1c1d2RYUWdQU0JoZEhSaFkyaHRaVzUwTG5SaFowNWhiV1VnUFQwOUlDZEpUbEJWVkNjZ2ZId2dZWFIwWVdOb2JXVnVkQzUwWVdkT1lXMWxJRDA5UFNBblZFVllWRUZTUlVFbk8xeHVJQ0FnSUdGdWVVbHVjSFYwSUQwZ2RHVjRkRWx1Y0hWMElIeDhJR2x6UldScGRHRmliR1VvWVhSMFlXTm9iV1Z1ZENrN1hHNGdJQ0FnYVc1d2RYUkZkbVZ1ZEhNb0tUdGNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJSEpsWm5KbGMyaFFiM05wZEdsdmJpQW9LU0I3WEc0Z0lDQWdhV1lnS0dWNVpTa2dleUJsZVdVdWNtVm1jbVZ6YUNncE95QjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJzYjJGa2FXNW5JQ2htYjNKalpWTm9iM2NwSUh0Y2JpQWdJQ0JwWmlBb2RIbHdaVzltSUhOdmRYSmpaU0FoUFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUgxY2JpQWdJQ0JqY205emMzWmxiblF1Y21WdGIzWmxLR0YwZEdGamFHMWxiblFzSUNkbWIyTjFjeWNzSUd4dllXUnBibWNwTzF4dUlDQWdJR052Ym5OMElIRjFaWEo1SUQwZ2NtVmhaRWx1Y0hWMEtDazdYRzRnSUNBZ2FXWWdLSEYxWlhKNUlEMDlQU0J6ZEdGMFpTNXhkV1Z5ZVNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJSDFjYmlBZ0lDQm9ZWE5KZEdWdGN5QTlJR1poYkhObE8xeHVJQ0FnSUhOMFlYUmxMbkYxWlhKNUlEMGdjWFZsY25rN1hHNWNiaUFnSUNCamIyNXpkQ0JqYjNWdWRHVnlJRDBnS3l0emRHRjBaUzVqYjNWdWRHVnlPMXh1WEc0Z0lDQWdjMjkxY21ObEtIc2djWFZsY25rc0lHeHBiV2wwSUgwc0lITnZkWEpqWldRcE8xeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z2MyOTFjbU5sWkNBb1pYSnlMQ0J5WlhOMWJIUXNJR0pzWVc1clVYVmxjbmtwSUh0Y2JpQWdJQ0FnSUdsbUlDaHpkR0YwWlM1amIzVnVkR1Z5SUNFOVBTQmpiM1Z1ZEdWeUtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJqdGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lHeHZZV1JsWkNoeVpYTjFiSFFzSUdadmNtTmxVMmh2ZHlrN1hHNGdJQ0FnSUNCcFppQW9aWEp5SUh4OElHSnNZVzVyVVhWbGNua3BJSHRjYmlBZ0lDQWdJQ0FnYUdGelNYUmxiWE1nUFNCbVlXeHpaVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJzYjJGa1pXUWdLR05oZEdWbmIzSnBaWE1zSUdadmNtTmxVMmh2ZHlrZ2UxeHVJQ0FnSUdOc1pXRnlLQ2s3WEc0Z0lDQWdhR0Z6U1hSbGJYTWdQU0IwY25WbE8xeHVJQ0FnSUdGd2FTNXpiM1Z5WTJVZ1BTQmJYVHRjYmlBZ0lDQmpZWFJsWjI5eWFXVnpMbVp2Y2tWaFkyZ29ZMkYwSUQwK0lHTmhkQzVzYVhOMExtWnZja1ZoWTJnb2MzVm5aMlZ6ZEdsdmJpQTlQaUJoWkdRb2MzVm5aMlZ6ZEdsdmJpd2dZMkYwS1NrcE8xeHVJQ0FnSUdsbUlDaG1iM0pqWlZOb2IzY3BJSHRjYmlBZ0lDQWdJSE5vYjNjb0tUdGNiaUFnSUNCOVhHNGdJQ0FnWm1sc2RHVnlhVzVuS0NrN1hHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQmpiR1ZoY2lBb0tTQjdYRzRnSUNBZ2RXNXpaV3hsWTNRb0tUdGNiaUFnSUNCM2FHbHNaU0FvWTJGMFpXZHZjbWxsY3k1c1lYTjBRMmhwYkdRcElIdGNiaUFnSUNBZ0lHTmhkR1ZuYjNKcFpYTXVjbVZ0YjNabFEyaHBiR1FvWTJGMFpXZHZjbWxsY3k1c1lYTjBRMmhwYkdRcE8xeHVJQ0FnSUgxY2JpQWdJQ0JqWVhSbFoyOXllVTFoY0NBOUlFOWlhbVZqZEM1amNtVmhkR1VvYm5Wc2JDazdYRzRnSUNBZ2FHRnpTWFJsYlhNZ1BTQm1ZV3h6WlR0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlISmxZV1JKYm5CMWRDQW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlDaDBaWGgwU1c1d2RYUWdQeUJsYkM1MllXeDFaU0E2SUdWc0xtbHVibVZ5U0ZSTlRDa3VkSEpwYlNncE8xeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdaMlYwUTJGMFpXZHZjbmtnS0dSaGRHRXBJSHRjYmlBZ0lDQnBaaUFvSVdSaGRHRXVhV1FwSUh0Y2JpQWdJQ0FnSUdSaGRHRXVhV1FnUFNBblpHVm1ZWFZzZENjN1hHNGdJQ0FnZlZ4dUlDQWdJR2xtSUNnaFkyRjBaV2R2Y25sTllYQmJaR0YwWVM1cFpGMHBJSHRjYmlBZ0lDQWdJR05oZEdWbmIzSjVUV0Z3VzJSaGRHRXVhV1JkSUQwZ1kzSmxZWFJsUTJGMFpXZHZjbmtvS1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjbVYwZFhKdUlHTmhkR1ZuYjNKNVRXRndXMlJoZEdFdWFXUmRPMXh1SUNBZ0lHWjFibU4wYVc5dUlHTnlaV0YwWlVOaGRHVm5iM0o1SUNncElIdGNiaUFnSUNBZ0lHTnZibk4wSUdOaGRHVm5iM0o1SUQwZ2RHRm5LQ2RrYVhZbkxDQW5jMlY1TFdOaGRHVm5iM0o1SnlrN1hHNGdJQ0FnSUNCamIyNXpkQ0IxYkNBOUlIUmhaeWduZFd3bkxDQW5jMlY1TFd4cGMzUW5LVHRjYmlBZ0lDQWdJSEpsYm1SbGNrTmhkR1ZuYjNKNUtHTmhkR1ZuYjNKNUxDQmtZWFJoS1R0Y2JpQWdJQ0FnSUdOaGRHVm5iM0o1TG1Gd2NHVnVaRU5vYVd4a0tIVnNLVHRjYmlBZ0lDQWdJR05oZEdWbmIzSnBaWE11WVhCd1pXNWtRMmhwYkdRb1kyRjBaV2R2Y25rcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUhzZ1pHRjBZU3dnZFd3Z2ZUdGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQmhaR1FnS0hOMVoyZGxjM1JwYjI0c0lHTmhkR1ZuYjNKNVJHRjBZU2tnZTF4dUlDQWdJR052Ym5OMElHTmhkQ0E5SUdkbGRFTmhkR1ZuYjNKNUtHTmhkR1ZuYjNKNVJHRjBZU2s3WEc0Z0lDQWdZMjl1YzNRZ2JHa2dQU0IwWVdjb0oyeHBKeXdnSjNObGVTMXBkR1Z0SnlrN1hHNGdJQ0FnY21WdVpHVnlTWFJsYlNoc2FTd2djM1ZuWjJWemRHbHZiaWs3WEc0Z0lDQWdhV1lnS0docFoyaHNhV2RvZEdWeUtTQjdYRzRnSUNBZ0lDQmljbVZoYTNWd1JtOXlTR2xuYUd4cFoyaDBaWElvYkdrcE8xeHVJQ0FnSUgxY2JpQWdJQ0JqY205emMzWmxiblF1WVdSa0tHeHBMQ0FuYlc5MWMyVmxiblJsY2ljc0lHaHZkbVZ5VTNWbloyVnpkR2x2YmlrN1hHNGdJQ0FnWTNKdmMzTjJaVzUwTG1Ga1pDaHNhU3dnSjJOc2FXTnJKeXdnWTJ4cFkydGxaRk4xWjJkbGMzUnBiMjRwTzF4dUlDQWdJR055YjNOemRtVnVkQzVoWkdRb2JHa3NJQ2RvYjNKelpYa3RabWxzZEdWeUp5d2dabWxzZEdWeVNYUmxiU2s3WEc0Z0lDQWdZM0p2YzNOMlpXNTBMbUZrWkNoc2FTd2dKMmh2Y25ObGVTMW9hV1JsSnl3Z2FHbGtaVWwwWlcwcE8xeHVJQ0FnSUdOaGRDNTFiQzVoY0hCbGJtUkRhR2xzWkNoc2FTazdYRzRnSUNBZ1lYQnBMbk52ZFhKalpTNXdkWE5vS0hOMVoyZGxjM1JwYjI0cE8xeHVJQ0FnSUhKbGRIVnliaUJzYVR0Y2JseHVJQ0FnSUdaMWJtTjBhVzl1SUdodmRtVnlVM1ZuWjJWemRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNCelpXeGxZM1FvYkdrcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdaMWJtTjBhVzl1SUdOc2FXTnJaV1JUZFdkblpYTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lHTnZibk4wSUdsdWNIVjBJRDBnWjJWMFZHVjRkQ2h6ZFdkblpYTjBhVzl1S1R0Y2JpQWdJQ0FnSUhObGRDaHpkV2RuWlhOMGFXOXVLVHRjYmlBZ0lDQWdJR2hwWkdVb0tUdGNiaUFnSUNBZ0lHRjBkR0ZqYUcxbGJuUXVabTlqZFhNb0tUdGNiaUFnSUNBZ0lHeGhjM1JRY21WbWFYZ2dQU0J2TG5CeVpXUnBZM1JPWlhoMFUyVmhjbU5vSUNZbUlHOHVjSEpsWkdsamRFNWxlSFJUWldGeVkyZ29lMXh1SUNBZ0lDQWdJQ0JwYm5CMWREb2dhVzV3ZFhRc1hHNGdJQ0FnSUNBZ0lITnZkWEpqWlRvZ1lYQnBMbk52ZFhKalpTNXpiR2xqWlNncExGeHVJQ0FnSUNBZ0lDQnpaV3hsWTNScGIyNDZJSE4xWjJkbGMzUnBiMjVjYmlBZ0lDQWdJSDBwSUh4OElDY25PMXh1SUNBZ0lDQWdhV1lnS0d4aGMzUlFjbVZtYVhncElIdGNiaUFnSUNBZ0lDQWdaV3d1ZG1Gc2RXVWdQU0JzWVhOMFVISmxabWw0TzF4dUlDQWdJQ0FnSUNCbGJDNXpaV3hsWTNRb0tUdGNiaUFnSUNBZ0lDQWdjMmh2ZHlncE8xeHVJQ0FnSUNBZ0lDQm1hV3gwWlhKcGJtY29LVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQm1kVzVqZEdsdmJpQm1hV3gwWlhKSmRHVnRJQ2dwSUh0Y2JpQWdJQ0FnSUdOdmJuTjBJSFpoYkhWbElEMGdjbVZoWkVsdWNIVjBLQ2s3WEc0Z0lDQWdJQ0JwWmlBb1ptbHNkR1Z5S0haaGJIVmxMQ0J6ZFdkblpYTjBhVzl1S1NrZ2UxeHVJQ0FnSUNBZ0lDQnNhUzVqYkdGemMwNWhiV1VnUFNCc2FTNWpiR0Z6YzA1aGJXVXVjbVZ3YkdGalpTZ3ZJSE5sZVMxb2FXUmxMMmNzSUNjbktUdGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lHTnliM056ZG1WdWRDNW1ZV0p5YVdOaGRHVW9iR2tzSUNkb2IzSnpaWGt0YUdsa1pTY3BPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lHWjFibU4wYVc5dUlHaHBaR1ZKZEdWdElDZ3BJSHRjYmlBZ0lDQWdJR2xtSUNnaGFHbGtaR1Z1S0d4cEtTa2dlMXh1SUNBZ0lDQWdJQ0JzYVM1amJHRnpjMDVoYldVZ0t6MGdKeUJ6WlhrdGFHbGtaU2M3WEc0Z0lDQWdJQ0FnSUdsbUlDaHpaV3hsWTNScGIyNGdQVDA5SUd4cEtTQjdYRzRnSUNBZ0lDQWdJQ0FnZFc1elpXeGxZM1FvS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHSnlaV0ZyZFhCR2IzSklhV2RvYkdsbmFIUmxjaUFvWld3cElIdGNiaUFnSUNCblpYUlVaWGgwUTJocGJHUnlaVzRvWld3cExtWnZja1ZoWTJnb1pXd2dQVDRnZTF4dUlDQWdJQ0FnWTI5dWMzUWdjR0Z5Wlc1MElEMGdaV3d1Y0dGeVpXNTBSV3hsYldWdWREdGNiaUFnSUNBZ0lHTnZibk4wSUhSbGVIUWdQU0JsYkM1MFpYaDBRMjl1ZEdWdWRDQjhmQ0JsYkM1dWIyUmxWbUZzZFdVZ2ZId2dKeWM3WEc0Z0lDQWdJQ0JwWmlBb2RHVjRkQzVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ1kyaGhjaUJ2WmlCMFpYaDBLU0I3WEc0Z0lDQWdJQ0FnSUhCaGNtVnVkQzVwYm5ObGNuUkNaV1p2Y21Vb2MzQmhia1p2Y2loamFHRnlLU3dnWld3cE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NHRnlaVzUwTG5KbGJXOTJaVU5vYVd4a0tHVnNLVHRjYmlBZ0lDQWdJR1oxYm1OMGFXOXVJSE53WVc1R2IzSWdLR05vWVhJcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2MzQmhiaUE5SUdSdll5NWpjbVZoZEdWRmJHVnRaVzUwS0NkemNHRnVKeWs3WEc0Z0lDQWdJQ0FnSUhOd1lXNHVZMnhoYzNOT1lXMWxJRDBnSjNObGVTMWphR0Z5Snp0Y2JpQWdJQ0FnSUNBZ2MzQmhiaTUwWlhoMFEyOXVkR1Z1ZENBOUlITndZVzR1YVc1dVpYSlVaWGgwSUQwZ1kyaGhjanRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSE53WVc0N1hHNGdJQ0FnSUNCOVhHNGdJQ0FnZlNrN1hHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQm9hV2RvYkdsbmFIUWdLR1ZzTENCdVpXVmtiR1VwSUh0Y2JpQWdJQ0JqYjI1emRDQnlkMjl5WkNBOUlDOWJYRnh6TEM1ZlhGeGJYRnhkZTMwb0tTMWRMMmM3WEc0Z0lDQWdZMjl1YzNRZ2QyOXlaSE1nUFNCdVpXVmtiR1V1YzNCc2FYUW9jbmR2Y21RcExtWnBiSFJsY2loM0lEMCtJSGN1YkdWdVozUm9LVHRjYmlBZ0lDQmpiMjV6ZENCbGJHVnRjeUE5SUZzdUxpNWxiQzV4ZFdWeWVWTmxiR1ZqZEc5eVFXeHNLQ2N1YzJWNUxXTm9ZWEluS1YwN1hHNGdJQ0FnYkdWMElHTm9ZWEp6TzF4dUlDQWdJR3hsZENCemRHRnlkRWx1WkdWNElEMGdNRHRjYmx4dUlDQWdJR0poYkdGdVkyVW9LVHRjYmlBZ0lDQnBaaUFvYUdsbmFHeHBaMmgwUTI5dGNHeGxkR1ZYYjNKa2N5a2dlMXh1SUNBZ0lDQWdkMmh2YkdVb0tUdGNiaUFnSUNCOVhHNGdJQ0FnWm5WNmVua29LVHRjYmlBZ0lDQmpiR1ZoY2xKbGJXRnBibVJsY2lncE8xeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z1ltRnNZVzVqWlNBb0tTQjdYRzRnSUNBZ0lDQmphR0Z5Y3lBOUlHVnNaVzF6TG0xaGNDaGxiQ0E5UGlCbGJDNXBibTVsY2xSbGVIUWdmSHdnWld3dWRHVjRkRU52Ym5SbGJuUXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHWjFibU4wYVc5dUlIZG9iMnhsSUNncElIdGNiaUFnSUNBZ0lHWnZjaUFvYkdWMElIZHZjbVFnYjJZZ2QyOXlaSE1wSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJSFJsYlhCSmJtUmxlQ0E5SUhOMFlYSjBTVzVrWlhnN1hHNGdJQ0FnSUNBZ0lISmxkSEo1T2lCM2FHbHNaU0FvZEdWdGNFbHVaR1Y0SUNFOVBTQXRNU2tnZTF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0JwYm1sMElEMGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnY0hKbGRrbHVaR1Y0SUQwZ2RHVnRjRWx1WkdWNE8xeHVJQ0FnSUNBZ0lDQWdJR1p2Y2lBb2JHVjBJR05vWVhJZ2IyWWdkMjl5WkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdhU0E5SUdOb1lYSnpMbWx1WkdWNFQyWW9ZMmhoY2l3Z2NISmxka2x1WkdWNElDc2dNU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbVlXbHNJRDBnYVNBOVBUMGdMVEVnZkh3Z0tDRnBibWwwSUNZbUlIQnlaWFpKYm1SbGVDQXJJREVnSVQwOUlHa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR2x1YVhRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2FXNXBkQ0E5SUdaaGJITmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjBaVzF3U1c1a1pYZ2dQU0JwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1poYVd3cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVZ2NtVjBjbms3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtVjJTVzVrWlhnZ1BTQnBPMXh1SUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQm1iM0lnS0d4bGRDQmxiQ0J2WmlCbGJHVnRjeTV6Y0d4cFkyVW9kR1Z0Y0VsdVpHVjRMQ0F4SUNzZ2NISmxka2x1WkdWNElDMGdkR1Z0Y0VsdVpHVjRLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdiMjRvWld3cE8xeHVJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNCaVlXeGhibU5sS0NrN1hHNGdJQ0FnSUNBZ0lDQWdibVZsWkd4bElEMGdibVZsWkd4bExuSmxjR3hoWTJVb2QyOXlaQ3dnSnljcE8xeHVJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z1puVjZlbmtnS0NrZ2UxeHVJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ2FXNXdkWFFnYjJZZ2JtVmxaR3hsS1NCN1hHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNobGJHVnRjeTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNCc1pYUWdaV3dnUFNCbGJHVnRjeTV6YUdsbWRDZ3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ29aV3d1YVc1dVpYSlVaWGgwSUh4OElHVnNMblJsZUhSRGIyNTBaVzUwSUh4OElDY25LUzUwYjB4dlkyRnNaVXh2ZDJWeVEyRnpaU2dwSUQwOVBTQnBibkIxZEM1MGIweHZZMkZzWlV4dmQyVnlRMkZ6WlNncEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCdmJpaGxiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYjJabUtHVnNLVHRjYmlBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNCbWRXNWpkR2x2YmlCamJHVmhjbEpsYldGcGJtUmxjaUFvS1NCN1hHNGdJQ0FnSUNCM2FHbHNaU0FvWld4bGJYTXViR1Z1WjNSb0tTQjdYRzRnSUNBZ0lDQWdJRzltWmlobGJHVnRjeTV6YUdsbWRDZ3BLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzVjYmlBZ0lDQm1kVzVqZEdsdmJpQnZiaUFvWTJncElIdGNiaUFnSUNBZ0lHTm9MbU5zWVhOelRHbHpkQzVoWkdRb0ozTmxlUzFqYUdGeUxXaHBaMmhzYVdkb2RDY3BPMXh1SUNBZ0lIMWNiaUFnSUNCbWRXNWpkR2x2YmlCdlptWWdLR05vS1NCN1hHNGdJQ0FnSUNCamFDNWpiR0Z6YzB4cGMzUXVjbVZ0YjNabEtDZHpaWGt0WTJoaGNpMW9hV2RvYkdsbmFIUW5LVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJuWlhSVVpYaDBRMmhwYkdSeVpXNGdLR1ZzS1NCN1hHNGdJQ0FnWTI5dWMzUWdkR1Y0ZEhNZ1BTQmJYVHRjYmlBZ0lDQmpiMjV6ZENCM1lXeHJaWElnUFNCa2IyTjFiV1Z1ZEM1amNtVmhkR1ZVY21WbFYyRnNhMlZ5S0dWc0xDQk9iMlJsUm1sc2RHVnlMbE5JVDFkZlZFVllWQ3dnYm5Wc2JDd2dabUZzYzJVcE8xeHVJQ0FnSUd4bGRDQnViMlJsTzF4dUlDQWdJSGRvYVd4bElDaHViMlJsSUQwZ2QyRnNhMlZ5TG01bGVIUk9iMlJsS0NrcElIdGNiaUFnSUNBZ0lIUmxlSFJ6TG5CMWMyZ29ibTlrWlNrN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQjBaWGgwY3p0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlITmxkQ0FvZG1Gc2RXVXBJSHRjYmlBZ0lDQnBaaUFvYnk1aGJtTm9iM0lwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUFvYVhOVVpYaDBLQ2tnUHlCaGNHa3VZWEJ3Wlc1a1ZHVjRkQ0E2SUdGd2FTNWhjSEJsYm1SSVZFMU1LU2huWlhSV1lXeDFaU2gyWVd4MVpTa3BPMXh1SUNBZ0lIMWNiaUFnSUNCMWMyVnlVMlYwS0haaGJIVmxLVHRjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdacGJIUmxjaUFvZG1Gc2RXVXNJSE4xWjJkbGMzUnBiMjRwSUh0Y2JpQWdJQ0JwWmlBb2J5NWhibU5vYjNJcElIdGNiaUFnSUNBZ0lHTnZibk4wSUdsc0lEMGdLR2x6VkdWNGRDZ3BJRDhnWVhCcExtWnBiSFJsY2tGdVkyaHZjbVZrVkdWNGRDQTZJR0Z3YVM1bWFXeDBaWEpCYm1Ob2IzSmxaRWhVVFV3cEtIWmhiSFZsTENCemRXZG5aWE4wYVc5dUtUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCcGJDQS9JSFZ6WlhKR2FXeDBaWElvYVd3dWFXNXdkWFFzSUdsc0xuTjFaMmRsYzNScGIyNHBJRG9nWm1Gc2MyVTdYRzRnSUNBZ2ZWeHVJQ0FnSUhKbGRIVnliaUIxYzJWeVJtbHNkR1Z5S0haaGJIVmxMQ0J6ZFdkblpYTjBhVzl1S1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHbHpWR1Y0ZENBb0tTQjdJSEpsZEhWeWJpQnBjMGx1Y0hWMEtHRjBkR0ZqYUcxbGJuUXBPeUI5WEc0Z0lHWjFibU4wYVc5dUlIWnBjMmxpYkdVZ0tDa2dleUJ5WlhSMWNtNGdZMjl1ZEdGcGJtVnlMbU5zWVhOelRtRnRaUzVwYm1SbGVFOW1LQ2R6WlhrdGMyaHZkeWNwSUNFOVBTQXRNVHNnZlZ4dUlDQm1kVzVqZEdsdmJpQm9hV1JrWlc0Z0tHeHBLU0I3SUhKbGRIVnliaUJzYVM1amJHRnpjMDVoYldVdWFXNWtaWGhQWmlnbmMyVjVMV2hwWkdVbktTQWhQVDBnTFRFN0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCemFHOTNJQ2dwSUh0Y2JpQWdJQ0JsZVdVdWNtVm1jbVZ6YUNncE8xeHVJQ0FnSUdsbUlDZ2hkbWx6YVdKc1pTZ3BLU0I3WEc0Z0lDQWdJQ0JqYjI1MFlXbHVaWEl1WTJ4aGMzTk9ZVzFsSUNzOUlDY2djMlY1TFhOb2IzY25PMXh1SUNBZ0lDQWdZM0p2YzNOMlpXNTBMbVpoWW5KcFkyRjBaU2hoZEhSaFkyaHRaVzUwTENBbmFHOXljMlY1TFhOb2IzY25LVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUIwYjJkbmJHVnlJQ2hsS1NCN1hHNGdJQ0FnWTI5dWMzUWdiR1ZtZENBOUlHVXVkMmhwWTJnZ1BUMDlJREVnSmlZZ0lXVXViV1YwWVV0bGVTQW1KaUFoWlM1amRISnNTMlY1TzF4dUlDQWdJR2xtSUNoc1pXWjBJRDA5UFNCbVlXeHpaU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVPeUF2THlCM1pTQnZibXg1SUdOaGNtVWdZV0p2ZFhRZ2FHOXVaWE4wSUhSdklHZHZaQ0JzWldaMExXTnNhV05yYzF4dUlDQWdJSDFjYmlBZ0lDQjBiMmRuYkdVb0tUdGNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJSFJ2WjJkc1pTQW9LU0I3WEc0Z0lDQWdhV1lnS0NGMmFYTnBZbXhsS0NrcElIdGNiaUFnSUNBZ0lITm9iM2NvS1R0Y2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdhR2xrWlNncE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlITmxiR1ZqZENBb2JHa3BJSHRjYmlBZ0lDQjFibk5sYkdWamRDZ3BPMXh1SUNBZ0lHbG1JQ2hzYVNrZ2UxeHVJQ0FnSUNBZ2MyVnNaV04wYVc5dUlEMGdiR2s3WEc0Z0lDQWdJQ0J6Wld4bFkzUnBiMjR1WTJ4aGMzTk9ZVzFsSUNzOUlDY2djMlY1TFhObGJHVmpkR1ZrSnp0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCMWJuTmxiR1ZqZENBb0tTQjdYRzRnSUNBZ2FXWWdLSE5sYkdWamRHbHZiaWtnZTF4dUlDQWdJQ0FnYzJWc1pXTjBhVzl1TG1Oc1lYTnpUbUZ0WlNBOUlITmxiR1ZqZEdsdmJpNWpiR0Z6YzA1aGJXVXVjbVZ3YkdGalpTZ3ZJSE5sZVMxelpXeGxZM1JsWkM5bkxDQW5KeWs3WEc0Z0lDQWdJQ0J6Wld4bFkzUnBiMjRnUFNCdWRXeHNPMXh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJRzF2ZG1VZ0tIVndMQ0J0YjNabGN5a2dlMXh1SUNBZ0lHTnZibk4wSUhSdmRHRnNJRDBnWVhCcExuTnZkWEpqWlM1c1pXNW5kR2c3WEc0Z0lDQWdhV1lnS0hSdmRHRnNJRDA5UFNBd0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200N1hHNGdJQ0FnZlZ4dUlDQWdJR2xtSUNodGIzWmxjeUErSUhSdmRHRnNLU0I3WEc0Z0lDQWdJQ0IxYm5ObGJHVmpkQ2dwTzF4dUlDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lIMWNiaUFnSUNCamIyNXpkQ0JqWVhRZ1BTQm1hVzVrUTJGMFpXZHZjbmtvYzJWc1pXTjBhVzl1S1NCOGZDQmpZWFJsWjI5eWFXVnpMbVpwY25OMFEyaHBiR1E3WEc0Z0lDQWdZMjl1YzNRZ1ptbHljM1FnUFNCMWNDQS9JQ2RzWVhOMFEyaHBiR1FuSURvZ0oyWnBjbk4wUTJocGJHUW5PMXh1SUNBZ0lHTnZibk4wSUd4aGMzUWdQU0IxY0NBL0lDZG1hWEp6ZEVOb2FXeGtKeUE2SUNkc1lYTjBRMmhwYkdRbk8xeHVJQ0FnSUdOdmJuTjBJRzVsZUhRZ1BTQjFjQ0EvSUNkd2NtVjJhVzkxYzFOcFlteHBibWNuSURvZ0oyNWxlSFJUYVdKc2FXNW5KenRjYmlBZ0lDQmpiMjV6ZENCd2NtVjJJRDBnZFhBZ1B5QW5ibVY0ZEZOcFlteHBibWNuSURvZ0ozQnlaWFpwYjNWelUybGliR2x1WnljN1hHNGdJQ0FnWTI5dWMzUWdiR2tnUFNCbWFXNWtUbVY0ZENncE8xeHVJQ0FnSUhObGJHVmpkQ2hzYVNrN1hHNWNiaUFnSUNCcFppQW9hR2xrWkdWdUtHeHBLU2tnZTF4dUlDQWdJQ0FnYlc5MlpTaDFjQ3dnYlc5MlpYTWdQeUJ0YjNabGN5QXJJREVnT2lBeEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCbWRXNWpkR2x2YmlCbWFXNWtRMkYwWldkdmNua2dLR1ZzS1NCN1hHNGdJQ0FnSUNCM2FHbHNaU0FvWld3cElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hObGEzUnZjaTV0WVhSamFHVnpVMlZzWldOMGIzSW9aV3d1Y0dGeVpXNTBSV3hsYldWdWRDd2dKeTV6WlhrdFkyRjBaV2R2Y25rbktTa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJsYkM1d1lYSmxiblJGYkdWdFpXNTBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdWc0lEMGdaV3d1Y0dGeVpXNTBSV3hsYldWdWREdGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lISmxkSFZ5YmlCdWRXeHNPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHWjFibU4wYVc5dUlHWnBibVJPWlhoMElDZ3BJSHRjYmlBZ0lDQWdJR2xtSUNoelpXeGxZM1JwYjI0cElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hObGJHVmpkR2x2Ymx0dVpYaDBYU2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCelpXeGxZM1JwYjI1YmJtVjRkRjA3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2FXWWdLR05oZEZ0dVpYaDBYU0FtSmlCbWFXNWtUR2x6ZENoallYUmJibVY0ZEYwcFcyWnBjbk4wWFNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQm1hVzVrVEdsemRDaGpZWFJiYm1WNGRGMHBXMlpwY25OMFhUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlHWnBibVJNYVhOMEtHTmhkR1ZuYjNKcFpYTmJabWx5YzNSZEtWdG1hWEp6ZEYwN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ1puVnVZM1JwYjI0Z2FHbGtaU0FvS1NCN1hHNGdJQ0FnWlhsbExuTnNaV1Z3S0NrN1hHNGdJQ0FnWTI5dWRHRnBibVZ5TG1Oc1lYTnpUbUZ0WlNBOUlHTnZiblJoYVc1bGNpNWpiR0Z6YzA1aGJXVXVjbVZ3YkdGalpTZ3ZJSE5sZVMxemFHOTNMMmNzSUNjbktUdGNiaUFnSUNCMWJuTmxiR1ZqZENncE8xeHVJQ0FnSUdOeWIzTnpkbVZ1ZEM1bVlXSnlhV05oZEdVb1lYUjBZV05vYldWdWRDd2dKMmh2Y25ObGVTMW9hV1JsSnlrN1hHNGdJQ0FnYVdZZ0tHVnNMblpoYkhWbElEMDlQU0JzWVhOMFVISmxabWw0S1NCN1hHNGdJQ0FnSUNCbGJDNTJZV3gxWlNBOUlDY25PMXh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJR3RsZVdSdmQyNGdLR1VwSUh0Y2JpQWdJQ0JqYjI1emRDQnphRzkzYmlBOUlIWnBjMmxpYkdVb0tUdGNiaUFnSUNCamIyNXpkQ0IzYUdsamFDQTlJR1V1ZDJocFkyZ2dmSHdnWlM1clpYbERiMlJsTzF4dUlDQWdJR2xtSUNoM2FHbGphQ0E5UFQwZ1MwVlpYMFJQVjA0cElIdGNiaUFnSUNBZ0lHbG1JQ2hoYm5sSmJuQjFkQ0FtSmlCdkxtRjFkRzlUYUc5M1QyNVZjRVJ2ZDI0cElIdGNiaUFnSUNBZ0lDQWdjMmh2ZHlncE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2FXWWdLSE5vYjNkdUtTQjdYRzRnSUNBZ0lDQWdJRzF2ZG1Vb0tUdGNiaUFnSUNBZ0lDQWdjM1J2Y0NobEtUdGNiaUFnSUNBZ0lIMWNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIZG9hV05vSUQwOVBTQkxSVmxmVlZBcElIdGNiaUFnSUNBZ0lHbG1JQ2hoYm5sSmJuQjFkQ0FtSmlCdkxtRjFkRzlUYUc5M1QyNVZjRVJ2ZDI0cElIdGNiaUFnSUNBZ0lDQWdjMmh2ZHlncE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2FXWWdLSE5vYjNkdUtTQjdYRzRnSUNBZ0lDQWdJRzF2ZG1Vb2RISjFaU2s3WEc0Z0lDQWdJQ0FnSUhOMGIzQW9aU2s3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmU0JsYkhObElHbG1JQ2gzYUdsamFDQTlQVDBnUzBWWlgwSkJRMHRUVUVGRFJTa2dlMXh1SUNBZ0lDQWdhV1lnS0dGdWVVbHVjSFYwSUNZbUlHOHVZWFYwYjFOb2IzZFBibFZ3Ukc5M2Jpa2dlMXh1SUNBZ0lDQWdJQ0J6YUc5M0tDazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaHphRzkzYmlrZ2UxeHVJQ0FnSUNBZ2FXWWdLSGRvYVdOb0lEMDlQU0JMUlZsZlJVNVVSVklwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSE5sYkdWamRHbHZiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lHTnliM056ZG1WdWRDNW1ZV0p5YVdOaGRHVW9jMlZzWldOMGFXOXVMQ0FuWTJ4cFkyc25LVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNCb2FXUmxLQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2MzUnZjQ2hsS1R0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb2QyaHBZMmdnUFQwOUlFdEZXVjlGVTBNcElIdGNiaUFnSUNBZ0lDQWdhR2xrWlNncE8xeHVJQ0FnSUNBZ0lDQnpkRzl3S0dVcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlITjBiM0FnS0dVcElIdGNiaUFnSUNCbExuTjBiM0JRY205d1lXZGhkR2x2YmlncE8xeHVJQ0FnSUdVdWNISmxkbVZ1ZEVSbFptRjFiSFFvS1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlITm9iM2RPYjFKbGMzVnNkSE1nS0NrZ2UxeHVJQ0FnSUdsbUlDaHViMjVsVFdGMFkyZ3BJSHRjYmlBZ0lDQWdJRzV2Ym1WTllYUmphQzVqYkdGemMweHBjM1F1Y21WdGIzWmxLQ2R6WlhrdGFHbGtaU2NwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdocFpHVk9iMUpsYzNWc2RITWdLQ2tnZTF4dUlDQWdJR2xtSUNodWIyNWxUV0YwWTJncElIdGNiaUFnSUNBZ0lHNXZibVZOWVhSamFDNWpiR0Z6YzB4cGMzUXVZV1JrS0NkelpYa3RhR2xrWlNjcE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHWnBiSFJsY21sdVp5QW9LU0I3WEc0Z0lDQWdhV1lnS0NGMmFYTnBZbXhsS0NrcElIdGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JpQWdJQ0I5WEc0Z0lDQWdaR1ZpYjNWdVkyVmtURzloWkdsdVp5aDBjblZsS1R0Y2JpQWdJQ0JqY205emMzWmxiblF1Wm1GaWNtbGpZWFJsS0dGMGRHRmphRzFsYm5Rc0lDZG9iM0p6WlhrdFptbHNkR1Z5SnlrN1hHNGdJQ0FnWTI5dWMzUWdkbUZzZFdVZ1BTQnlaV0ZrU1c1d2RYUW9LVHRjYmlBZ0lDQnBaaUFvSVc4dVlteGhibXRUWldGeVkyZ2dKaVlnSVhaaGJIVmxLU0I3WEc0Z0lDQWdJQ0JvYVdSbEtDazdJSEpsZEhWeWJqdGNiaUFnSUNCOVhHNGdJQ0FnWTI5dWMzUWdibTl0WVhSamFDQTlJRzV2VFdGMFkyaGxjeWg3SUhGMVpYSjVPaUIyWVd4MVpTQjlLVHRjYmlBZ0lDQnNaWFFnWTI5MWJuUWdQU0IzWVd4clEyRjBaV2R2Y21sbGN5Z3BPMXh1SUNBZ0lHbG1JQ2hqYjNWdWRDQTlQVDBnTUNBbUppQnViMjFoZEdOb0lDWW1JR2hoYzBsMFpXMXpLU0I3WEc0Z0lDQWdJQ0J6YUc5M1RtOVNaWE4xYkhSektDazdYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUdocFpHVk9iMUpsYzNWc2RITW9LVHRjYmlBZ0lDQjlYRzRnSUNBZ2FXWWdLQ0Z6Wld4bFkzUnBiMjRwSUh0Y2JpQWdJQ0FnSUcxdmRtVW9LVHRjYmlBZ0lDQjlYRzRnSUNBZ2FXWWdLQ0Z6Wld4bFkzUnBiMjRnSmlZZ0lXNXZiV0YwWTJncElIdGNiaUFnSUNBZ0lHaHBaR1VvS1R0Y2JpQWdJQ0I5WEc0Z0lDQWdablZ1WTNScGIyNGdkMkZzYTBOaGRHVm5iM0pwWlhNZ0tDa2dlMXh1SUNBZ0lDQWdiR1YwSUdOaGRHVm5iM0o1SUQwZ1kyRjBaV2R2Y21sbGN5NW1hWEp6ZEVOb2FXeGtPMXh1SUNBZ0lDQWdiR1YwSUdOdmRXNTBJRDBnTUR0Y2JpQWdJQ0FnSUhkb2FXeGxJQ2hqWVhSbFoyOXllU2tnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JzYVhOMElEMGdabWx1WkV4cGMzUW9ZMkYwWldkdmNua3BPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQndZWEowYVdGc0lEMGdkMkZzYTBOaGRHVm5iM0o1S0d4cGMzUXBPMXh1SUNBZ0lDQWdJQ0JwWmlBb2NHRnlkR2xoYkNBOVBUMGdNQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lHTmhkR1ZuYjNKNUxtTnNZWE56VEdsemRDNWhaR1FvSjNObGVTMW9hV1JsSnlrN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdZMkYwWldkdmNua3VZMnhoYzNOTWFYTjBMbkpsYlc5MlpTZ25jMlY1TFdocFpHVW5LVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCamIzVnVkQ0FyUFNCd1lYSjBhV0ZzTzF4dUlDQWdJQ0FnSUNCallYUmxaMjl5ZVNBOUlHTmhkR1ZuYjNKNUxtNWxlSFJUYVdKc2FXNW5PMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlHTnZkVzUwTzF4dUlDQWdJSDFjYmlBZ0lDQm1kVzVqZEdsdmJpQjNZV3hyUTJGMFpXZHZjbmtnS0hWc0tTQjdYRzRnSUNBZ0lDQnNaWFFnYkdrZ1BTQjFiQzVtYVhKemRFTm9hV3hrTzF4dUlDQWdJQ0FnYkdWMElHTnZkVzUwSUQwZ01EdGNiaUFnSUNBZ0lIZG9hV3hsSUNoc2FTa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb1kyOTFiblFnUGowZ2JHbHRhWFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQmpjbTl6YzNabGJuUXVabUZpY21sallYUmxLR3hwTENBbmFHOXljMlY1TFdocFpHVW5LVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNCamNtOXpjM1psYm5RdVptRmljbWxqWVhSbEtHeHBMQ0FuYUc5eWMyVjVMV1pwYkhSbGNpY3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHNhUzVqYkdGemMwNWhiV1V1YVc1a1pYaFBaaWduYzJWNUxXaHBaR1VuS1NBOVBUMGdMVEVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052ZFc1MEt5czdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9hR2xuYUd4cFoyaDBaWElwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnYUdsbmFHeHBaMmgwS0d4cExDQjJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR3hwSUQwZ2JHa3VibVY0ZEZOcFlteHBibWM3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZMjkxYm5RN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ1puVnVZM1JwYjI0Z1pHVm1aWEp5WldSR2FXeDBaWEpwYm1kT2IwVnVkR1Z5SUNobEtTQjdYRzRnSUNBZ1kyOXVjM1FnZDJocFkyZ2dQU0JsTG5kb2FXTm9JSHg4SUdVdWEyVjVRMjlrWlR0Y2JpQWdJQ0JwWmlBb2QyaHBZMmdnUFQwOUlFdEZXVjlGVGxSRlVpa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUgxY2JpQWdJQ0JrWldabGNuSmxaRVpwYkhSbGNtbHVaeWdwTzF4dUlDQjlYRzVjYmlBZ1puVnVZM1JwYjI0Z1pHVm1aWEp5WldSVGFHOTNJQ2hsS1NCN1hHNGdJQ0FnWTI5dWMzUWdkMmhwWTJnZ1BTQmxMbmRvYVdOb0lIeDhJR1V1YTJWNVEyOWtaVHRjYmlBZ0lDQnBaaUFvZDJocFkyZ2dQVDA5SUV0RldWOUZUbFJGVWlCOGZDQjNhR2xqYUNBOVBUMGdTMFZaWDFSQlFpa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUgxY2JpQWdJQ0J6WlhSVWFXMWxiM1YwS0hOb2IzY3NJREFwTzF4dUlDQjlYRzVjYmlBZ1puVnVZM1JwYjI0Z1lYVjBiMk52YlhCc1pYUmxSWFpsYm5SVVlYSm5aWFFnS0dVcElIdGNiaUFnSUNCc1pYUWdkR0Z5WjJWMElEMGdaUzUwWVhKblpYUTdYRzRnSUNBZ2FXWWdLSFJoY21kbGRDQTlQVDBnWVhSMFlXTm9iV1Z1ZENrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0FnSUhkb2FXeGxJQ2gwWVhKblpYUXBJSHRjYmlBZ0lDQWdJR2xtSUNoMFlYSm5aWFFnUFQwOUlHTnZiblJoYVc1bGNpQjhmQ0IwWVhKblpYUWdQVDA5SUdGMGRHRmphRzFsYm5RcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0IwWVhKblpYUWdQU0IwWVhKblpYUXVjR0Z5Wlc1MFRtOWtaVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJvYVdSbFQyNUNiSFZ5SUNobEtTQjdYRzRnSUNBZ1kyOXVjM1FnZDJocFkyZ2dQU0JsTG5kb2FXTm9JSHg4SUdVdWEyVjVRMjlrWlR0Y2JpQWdJQ0JwWmlBb2QyaHBZMmdnUFQwOUlFdEZXVjlVUVVJcElIdGNiaUFnSUNBZ0lHaHBaR1VvS1R0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCb2FXUmxUMjVEYkdsamF5QW9aU2tnZTF4dUlDQWdJR2xtSUNoaGRYUnZZMjl0Y0d4bGRHVkZkbVZ1ZEZSaGNtZGxkQ2hsS1NrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJSDFjYmlBZ0lDQm9hV1JsS0NrN1hHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQnBibkIxZEVWMlpXNTBjeUFvY21WdGIzWmxLU0I3WEc0Z0lDQWdZMjl1YzNRZ2IzQWdQU0J5WlcxdmRtVWdQeUFuY21WdGIzWmxKeUE2SUNkaFpHUW5PMXh1SUNBZ0lHbG1JQ2hsZVdVcElIdGNiaUFnSUNBZ0lHVjVaUzVrWlhOMGNtOTVLQ2s3WEc0Z0lDQWdJQ0JsZVdVZ1BTQnVkV3hzTzF4dUlDQWdJSDFjYmlBZ0lDQnBaaUFvSVhKbGJXOTJaU2tnZTF4dUlDQWdJQ0FnWlhsbElEMGdZblZzYkhObGVXVW9ZMjl1ZEdGcGJtVnlMQ0JoZEhSaFkyaHRaVzUwTENCN1hHNGdJQ0FnSUNBZ0lHTmhjbVYwT2lCaGJubEpibkIxZENBbUppQmhkSFJoWTJodFpXNTBMblJoWjA1aGJXVWdJVDA5SUNkSlRsQlZWQ2NzWEc0Z0lDQWdJQ0FnSUdOdmJuUmxlSFE2SUc4dVlYQndaVzVrVkc5Y2JpQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ2FXWWdLQ0YyYVhOcFlteGxLQ2twSUhzZ1pYbGxMbk5zWldWd0tDazdJSDFjYmlBZ0lDQjlYRzRnSUNBZ2FXWWdLSEpsYlc5MlpTQjhmQ0FvWVc1NVNXNXdkWFFnSmlZZ1pHOWpMbUZqZEdsMlpVVnNaVzFsYm5RZ0lUMDlJR0YwZEdGamFHMWxiblFwS1NCN1hHNGdJQ0FnSUNCamNtOXpjM1psYm5SYmIzQmRLR0YwZEdGamFHMWxiblFzSUNkbWIyTjFjeWNzSUd4dllXUnBibWNwTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQnNiMkZrYVc1bktDazdYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaGhibmxKYm5CMWRDa2dlMXh1SUNBZ0lDQWdZM0p2YzNOMlpXNTBXMjl3WFNoaGRIUmhZMmh0Wlc1MExDQW5hMlY1Y0hKbGMzTW5MQ0JrWldabGNuSmxaRk5vYjNjcE8xeHVJQ0FnSUNBZ1kzSnZjM04yWlc1MFcyOXdYU2hoZEhSaFkyaHRaVzUwTENBbmEyVjVjSEpsYzNNbkxDQmtaV1psY25KbFpFWnBiSFJsY21sdVp5azdYRzRnSUNBZ0lDQmpjbTl6YzNabGJuUmJiM0JkS0dGMGRHRmphRzFsYm5Rc0lDZHJaWGxrYjNkdUp5d2daR1ZtWlhKeVpXUkdhV3gwWlhKcGJtZE9iMFZ1ZEdWeUtUdGNiaUFnSUNBZ0lHTnliM056ZG1WdWRGdHZjRjBvWVhSMFlXTm9iV1Z1ZEN3Z0ozQmhjM1JsSnl3Z1pHVm1aWEp5WldSR2FXeDBaWEpwYm1jcE8xeHVJQ0FnSUNBZ1kzSnZjM04yWlc1MFcyOXdYU2hoZEhSaFkyaHRaVzUwTENBbmEyVjVaRzkzYmljc0lHdGxlV1J2ZDI0cE8xeHVJQ0FnSUNBZ2FXWWdLRzh1WVhWMGIwaHBaR1ZQYmtKc2RYSXBJSHNnWTNKdmMzTjJaVzUwVzI5d1hTaGhkSFJoWTJodFpXNTBMQ0FuYTJWNVpHOTNiaWNzSUdocFpHVlBia0pzZFhJcE95QjlYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUdOeWIzTnpkbVZ1ZEZ0dmNGMG9ZWFIwWVdOb2JXVnVkQ3dnSjJOc2FXTnJKeXdnZEc5bloyeGxjaWs3WEc0Z0lDQWdJQ0JqY205emMzWmxiblJiYjNCZEtHUnZZMFZzWlcxbGJuUXNJQ2RyWlhsa2IzZHVKeXdnYTJWNVpHOTNiaWs3WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2h2TG1GMWRHOUlhV1JsVDI1RGJHbGpheWtnZXlCamNtOXpjM1psYm5SYmIzQmRLR1J2WXl3Z0oyTnNhV05ySnl3Z2FHbGtaVTl1UTJ4cFkyc3BPeUI5WEc0Z0lDQWdhV1lnS0dadmNtMHBJSHNnWTNKdmMzTjJaVzUwVzI5d1hTaG1iM0p0TENBbmMzVmliV2wwSnl3Z2FHbGtaU2s3SUgxY2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHUmxjM1J5YjNrZ0tDa2dlMXh1SUNBZ0lHbHVjSFYwUlhabGJuUnpLSFJ5ZFdVcE8xeHVJQ0FnSUdsbUlDaHdZWEpsYm5RdVkyOXVkR0ZwYm5Nb1kyOXVkR0ZwYm1WeUtTa2dleUJ3WVhKbGJuUXVjbVZ0YjNabFEyaHBiR1FvWTI5dWRHRnBibVZ5S1RzZ2ZWeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdaR1ZtWVhWc2RGTmxkSFJsY2lBb2RtRnNkV1VwSUh0Y2JpQWdJQ0JwWmlBb2RHVjRkRWx1Y0hWMEtTQjdYRzRnSUNBZ0lDQnBaaUFvYzJWMFFYQndaVzVrY3lBOVBUMGdkSEoxWlNrZ2UxeHVJQ0FnSUNBZ0lDQmxiQzUyWVd4MVpTQXJQU0FuSUNjZ0t5QjJZV3gxWlR0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUdWc0xuWmhiSFZsSUQwZ2RtRnNkV1U3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lHbG1JQ2h6WlhSQmNIQmxibVJ6SUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lHVnNMbWx1Ym1WeVNGUk5UQ0FyUFNBbklDY2dLeUIyWVd4MVpUdGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lHVnNMbWx1Ym1WeVNGUk5UQ0E5SUhaaGJIVmxPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJR1JsWm1GMWJIUkpkR1Z0VW1WdVpHVnlaWElnS0d4cExDQnpkV2RuWlhOMGFXOXVLU0I3WEc0Z0lDQWdkR1Y0ZENoc2FTd2daMlYwVkdWNGRDaHpkV2RuWlhOMGFXOXVLU2s3WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCa1pXWmhkV3gwUTJGMFpXZHZjbmxTWlc1a1pYSmxjaUFvWkdsMkxDQmtZWFJoS1NCN1hHNGdJQ0FnYVdZZ0tHUmhkR0V1YVdRZ0lUMDlJQ2RrWldaaGRXeDBKeWtnZTF4dUlDQWdJQ0FnWTI5dWMzUWdhV1FnUFNCMFlXY29KMlJwZGljc0lDZHpaWGt0WTJGMFpXZHZjbmt0YVdRbktUdGNiaUFnSUNBZ0lHUnBkaTVoY0hCbGJtUkRhR2xzWkNocFpDazdYRzRnSUNBZ0lDQjBaWGgwS0dsa0xDQmtZWFJoTG1sa0tUdGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQmtaV1poZFd4MFJtbHNkR1Z5SUNoeExDQnpkV2RuWlhOMGFXOXVLU0I3WEc0Z0lDQWdZMjl1YzNRZ2JtVmxaR3hsSUQwZ2NTNTBiMHh2ZDJWeVEyRnpaU2dwTzF4dUlDQWdJR052Ym5OMElIUmxlSFFnUFNCblpYUlVaWGgwS0hOMVoyZGxjM1JwYjI0cElIeDhJQ2NuTzF4dUlDQWdJR2xtSUNobWRYcDZlWE5sWVhKamFDaHVaV1ZrYkdVc0lIUmxlSFF1ZEc5TWIzZGxja05oYzJVb0tTa3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJSDFjYmlBZ0lDQmpiMjV6ZENCMllXeDFaU0E5SUdkbGRGWmhiSFZsS0hOMVoyZGxjM1JwYjI0cElIeDhJQ2NuTzF4dUlDQWdJR2xtSUNoMGVYQmxiMllnZG1Gc2RXVWdJVDA5SUNkemRISnBibWNuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzRnSUNBZ2ZWeHVJQ0FnSUhKbGRIVnliaUJtZFhwNmVYTmxZWEpqYUNodVpXVmtiR1VzSUhaaGJIVmxMblJ2VEc5M1pYSkRZWE5sS0NrcE8xeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdiRzl2Y0dKaFkydFViMEZ1WTJodmNpQW9kR1Y0ZEN3Z2NDa2dlMXh1SUNBZ0lHeGxkQ0J5WlhOMWJIUWdQU0FuSnp0Y2JpQWdJQ0JzWlhRZ1lXNWphRzl5WldRZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0JzWlhRZ2MzUmhjblFnUFNCd0xuTjBZWEowTzF4dUlDQWdJSGRvYVd4bElDaGhibU5vYjNKbFpDQTlQVDBnWm1Gc2MyVWdKaVlnYzNSaGNuUWdQajBnTUNrZ2UxeHVJQ0FnSUNBZ2NtVnpkV3gwSUQwZ2RHVjRkQzV6ZFdKemRISW9jM1JoY25RZ0xTQXhMQ0J3TG5OMFlYSjBJQzBnYzNSaGNuUWdLeUF4S1R0Y2JpQWdJQ0FnSUdGdVkyaHZjbVZrSUQwZ2NtRnVZMmh2Y214bFpuUXVkR1Z6ZENoeVpYTjFiSFFwTzF4dUlDQWdJQ0FnYzNSaGNuUXRMVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0FnSUhSbGVIUTZJR0Z1WTJodmNtVmtJRDhnY21WemRXeDBJRG9nYm5Wc2JDeGNiaUFnSUNBZ0lITjBZWEowWEc0Z0lDQWdmVHRjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdacGJIUmxja0Z1WTJodmNtVmtWR1Y0ZENBb2NTd2djM1ZuWjJWemRHbHZiaWtnZTF4dUlDQWdJR052Ym5OMElIQnZjMmwwYVc5dUlEMGdjMlZzYkNobGJDazdYRzRnSUNBZ1kyOXVjM1FnYVc1d2RYUWdQU0JzYjI5d1ltRmphMVJ2UVc1amFHOXlLSEVzSUhCdmMybDBhVzl1S1M1MFpYaDBPMXh1SUNBZ0lHbG1JQ2hwYm5CMWRDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIc2dhVzV3ZFhRc0lITjFaMmRsYzNScGIyNGdmVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJoY0hCbGJtUlVaWGgwSUNoMllXeDFaU2tnZTF4dUlDQWdJR052Ym5OMElHTjFjbkpsYm5RZ1BTQmxiQzUyWVd4MVpUdGNiaUFnSUNCamIyNXpkQ0J3YjNOcGRHbHZiaUE5SUhObGJHd29aV3dwTzF4dUlDQWdJR052Ym5OMElHbHVjSFYwSUQwZ2JHOXZjR0poWTJ0VWIwRnVZMmh2Y2loamRYSnlaVzUwTENCd2IzTnBkR2x2YmlrN1hHNGdJQ0FnWTI5dWMzUWdiR1ZtZENBOUlHTjFjbkpsYm5RdWMzVmljM1J5S0RBc0lHbHVjSFYwTG5OMFlYSjBLVHRjYmlBZ0lDQmpiMjV6ZENCeWFXZG9kQ0E5SUdOMWNuSmxiblF1YzNWaWMzUnlLR2x1Y0hWMExuTjBZWEowSUNzZ2FXNXdkWFF1ZEdWNGRDNXNaVzVuZEdnZ0t5QW9jRzl6YVhScGIyNHVaVzVrSUMwZ2NHOXphWFJwYjI0dWMzUmhjblFwS1R0Y2JpQWdJQ0JqYjI1emRDQmlaV1p2Y21VZ1BTQnNaV1owSUNzZ2RtRnNkV1VnS3lBbklDYzdYRzVjYmlBZ0lDQmxiQzUyWVd4MVpTQTlJR0psWm05eVpTQXJJSEpwWjJoME8xeHVJQ0FnSUhObGJHd29aV3dzSUhzZ2MzUmhjblE2SUdKbFptOXlaUzVzWlc1bmRHZ3NJR1Z1WkRvZ1ltVm1iM0psTG14bGJtZDBhQ0I5S1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHWnBiSFJsY2tGdVkyaHZjbVZrU0ZSTlRDQW9LU0I3WEc0Z0lDQWdkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZEJibU5vYjNKcGJtY2dhVzRnWldScGRHRmliR1VnWld4bGJXVnVkSE1nYVhNZ1pHbHpZV0pzWldRZ1lua2daR1ZtWVhWc2RDNG5LVHRjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdGd2NHVnVaRWhVVFV3Z0tDa2dlMXh1SUNBZ0lIUm9jbTkzSUc1bGR5QkZjbkp2Y2lnblFXNWphRzl5YVc1bklHbHVJR1ZrYVhSaFlteGxJR1ZzWlcxbGJuUnpJR2x6SUdScGMyRmliR1ZrSUdKNUlHUmxabUYxYkhRdUp5azdYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJtYVc1a1RHbHpkQ0FvWTJGMFpXZHZjbmtwSUhzZ2NtVjBkWEp1SUhObGEzUnZjaWduTG5ObGVTMXNhWE4wSnl3Z1kyRjBaV2R2Y25rcFd6QmRPeUI5WEc1OVhHNWNibVoxYm1OMGFXOXVJR2x6U1c1d2RYUWdLR1ZzS1NCN0lISmxkSFZ5YmlCbGJDNTBZV2RPWVcxbElEMDlQU0FuU1U1UVZWUW5JSHg4SUdWc0xuUmhaMDVoYldVZ1BUMDlJQ2RVUlZoVVFWSkZRU2M3SUgxY2JseHVablZ1WTNScGIyNGdkR0ZuSUNoMGVYQmxMQ0JqYkdGemMwNWhiV1VwSUh0Y2JpQWdZMjl1YzNRZ1pXd2dQU0JrYjJNdVkzSmxZWFJsUld4bGJXVnVkQ2gwZVhCbEtUdGNiaUFnWld3dVkyeGhjM05PWVcxbElEMGdZMnhoYzNOT1lXMWxPMXh1SUNCeVpYUjFjbTRnWld3N1hHNTlYRzVjYm1aMWJtTjBhVzl1SUdSbFptVnlJQ2htYmlrZ2V5QnlaWFIxY200Z1puVnVZM1JwYjI0Z0tDa2dleUJ6WlhSVWFXMWxiM1YwS0dadUxDQXdLVHNnZlRzZ2ZWeHVablZ1WTNScGIyNGdkR1Y0ZENBb1pXd3NJSFpoYkhWbEtTQjdJR1ZzTG1sdWJtVnlWR1Y0ZENBOUlHVnNMblJsZUhSRGIyNTBaVzUwSUQwZ2RtRnNkV1U3SUgxY2JseHVablZ1WTNScGIyNGdhWE5GWkdsMFlXSnNaU0FvWld3cElIdGNiaUFnWTI5dWMzUWdkbUZzZFdVZ1BTQmxiQzVuWlhSQmRIUnlhV0oxZEdVb0oyTnZiblJsYm5SRlpHbDBZV0pzWlNjcE8xeHVJQ0JwWmlBb2RtRnNkV1VnUFQwOUlDZG1ZV3h6WlNjcElIdGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzRnSUgxY2JpQWdhV1lnS0haaGJIVmxJRDA5UFNBbmRISjFaU2NwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdmVnh1SUNCcFppQW9aV3d1Y0dGeVpXNTBSV3hsYldWdWRDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCcGMwVmthWFJoWW14bEtHVnNMbkJoY21WdWRFVnNaVzFsYm5RcE8xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCbVlXeHpaVHRjYm4xY2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQm9iM0p6WlhrN1hHNGlYWDA9IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdG9hIChhLCBuKSB7IHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhLCBuKTsgfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG52YXIgdGFpbG9ybWFkZSA9IHJlcXVpcmUoJy4vdGFpbG9ybWFkZScpO1xuXG5mdW5jdGlvbiBidWxsc2V5ZSAoZWwsIHRhcmdldCwgb3B0aW9ucykge1xuICB2YXIgbyA9IG9wdGlvbnM7XG4gIHZhciBkb21UYXJnZXQgPSB0YXJnZXQgJiYgdGFyZ2V0LnRhZ05hbWU7XG5cbiAgaWYgKCFkb21UYXJnZXQgJiYgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIG8gPSB0YXJnZXQ7XG4gIH1cbiAgaWYgKCFkb21UYXJnZXQpIHtcbiAgICB0YXJnZXQgPSBlbDtcbiAgfVxuICBpZiAoIW8pIHsgbyA9IHt9OyB9XG5cbiAgdmFyIGRlc3Ryb3llZCA9IGZhbHNlO1xuICB2YXIgdGhyb3R0bGVkV3JpdGUgPSB0aHJvdHRsZSh3cml0ZSwgMzApO1xuICB2YXIgdGFpbG9yT3B0aW9ucyA9IHsgdXBkYXRlOiBvLmF1dG91cGRhdGVUb0NhcmV0ICE9PSBmYWxzZSAmJiB1cGRhdGUgfTtcbiAgdmFyIHRhaWxvciA9IG8uY2FyZXQgJiYgdGFpbG9ybWFkZSh0YXJnZXQsIHRhaWxvck9wdGlvbnMpO1xuXG4gIHdyaXRlKCk7XG5cbiAgaWYgKG8udHJhY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgY3Jvc3N2ZW50LmFkZCh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRXcml0ZSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlYWQ6IHJlYWROdWxsLFxuICAgIHJlZnJlc2g6IHdyaXRlLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3ksXG4gICAgc2xlZXA6IHNsZWVwXG4gIH07XG5cbiAgZnVuY3Rpb24gc2xlZXAgKCkge1xuICAgIHRhaWxvck9wdGlvbnMuc2xlZXBpbmcgPSB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZE51bGwgKCkgeyByZXR1cm4gcmVhZCgpOyB9XG5cbiAgZnVuY3Rpb24gcmVhZCAocmVhZGluZ3MpIHtcbiAgICB2YXIgYm91bmRzID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIGlmICh0YWlsb3IpIHtcbiAgICAgIHJlYWRpbmdzID0gdGFpbG9yLnJlYWQoKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IChyZWFkaW5ncy5hYnNvbHV0ZSA/IDAgOiBib3VuZHMubGVmdCkgKyByZWFkaW5ncy54LFxuICAgICAgICB5OiAocmVhZGluZ3MuYWJzb2x1dGUgPyAwIDogYm91bmRzLnRvcCkgKyBzY3JvbGxUb3AgKyByZWFkaW5ncy55ICsgMjBcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB4OiBib3VuZHMubGVmdCxcbiAgICAgIHk6IGJvdW5kcy50b3AgKyBzY3JvbGxUb3BcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChyZWFkaW5ncykge1xuICAgIHdyaXRlKHJlYWRpbmdzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlIChyZWFkaW5ncykge1xuICAgIGlmIChkZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnVsbHNleWUgY2FuXFwndCByZWZyZXNoIGFmdGVyIGJlaW5nIGRlc3Ryb3llZC4gQ3JlYXRlIGFub3RoZXIgaW5zdGFuY2UgaW5zdGVhZC4nKTtcbiAgICB9XG4gICAgaWYgKHRhaWxvciAmJiAhcmVhZGluZ3MpIHtcbiAgICAgIHRhaWxvck9wdGlvbnMuc2xlZXBpbmcgPSBmYWxzZTtcbiAgICAgIHRhaWxvci5yZWZyZXNoKCk7IHJldHVybjtcbiAgICB9XG4gICAgdmFyIHAgPSByZWFkKHJlYWRpbmdzKTtcbiAgICBpZiAoIXRhaWxvciAmJiB0YXJnZXQgIT09IGVsKSB7XG4gICAgICBwLnkgKz0gdGFyZ2V0Lm9mZnNldEhlaWdodDtcbiAgICB9XG4gICAgdmFyIGNvbnRleHQgPSBvLmNvbnRleHQ7XG4gICAgZWwuc3R5bGUubGVmdCA9IHAueCArICdweCc7XG4gICAgZWwuc3R5bGUudG9wID0gKGNvbnRleHQgPyBjb250ZXh0Lm9mZnNldEhlaWdodCA6IHAueSkgKyAncHgnO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgaWYgKHRhaWxvcikgeyB0YWlsb3IuZGVzdHJveSgpOyB9XG4gICAgY3Jvc3N2ZW50LnJlbW92ZSh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRXcml0ZSk7XG4gICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1bGxzZXllO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VsbCA9IHJlcXVpcmUoJ3NlbGwnKTtcbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciBzZWxlY2Npb24gPSByZXF1aXJlKCdzZWxlY2Npb24nKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciBnZXRTZWxlY3Rpb24gPSBzZWxlY2Npb24uZ2V0O1xudmFyIHByb3BzID0gW1xuICAnZGlyZWN0aW9uJyxcbiAgJ2JveFNpemluZycsXG4gICd3aWR0aCcsXG4gICdoZWlnaHQnLFxuICAnb3ZlcmZsb3dYJyxcbiAgJ292ZXJmbG93WScsXG4gICdib3JkZXJUb3BXaWR0aCcsXG4gICdib3JkZXJSaWdodFdpZHRoJyxcbiAgJ2JvcmRlckJvdHRvbVdpZHRoJyxcbiAgJ2JvcmRlckxlZnRXaWR0aCcsXG4gICdwYWRkaW5nVG9wJyxcbiAgJ3BhZGRpbmdSaWdodCcsXG4gICdwYWRkaW5nQm90dG9tJyxcbiAgJ3BhZGRpbmdMZWZ0JyxcbiAgJ2ZvbnRTdHlsZScsXG4gICdmb250VmFyaWFudCcsXG4gICdmb250V2VpZ2h0JyxcbiAgJ2ZvbnRTdHJldGNoJyxcbiAgJ2ZvbnRTaXplJyxcbiAgJ2ZvbnRTaXplQWRqdXN0JyxcbiAgJ2xpbmVIZWlnaHQnLFxuICAnZm9udEZhbWlseScsXG4gICd0ZXh0QWxpZ24nLFxuICAndGV4dFRyYW5zZm9ybScsXG4gICd0ZXh0SW5kZW50JyxcbiAgJ3RleHREZWNvcmF0aW9uJyxcbiAgJ2xldHRlclNwYWNpbmcnLFxuICAnd29yZFNwYWNpbmcnXG5dO1xudmFyIHdpbiA9IGdsb2JhbDtcbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBmZiA9IHdpbi5tb3pJbm5lclNjcmVlblggIT09IG51bGwgJiYgd2luLm1veklubmVyU2NyZWVuWCAhPT0gdm9pZCAwO1xuXG5mdW5jdGlvbiB0YWlsb3JtYWRlIChlbCwgb3B0aW9ucykge1xuICB2YXIgdGV4dElucHV0ID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnO1xuICB2YXIgdGhyb3R0bGVkUmVmcmVzaCA9IHRocm90dGxlKHJlZnJlc2gsIDMwKTtcbiAgdmFyIG8gPSBvcHRpb25zIHx8IHt9O1xuXG4gIGJpbmQoKTtcblxuICByZXR1cm4ge1xuICAgIHJlYWQ6IHJlYWRQb3NpdGlvbixcbiAgICByZWZyZXNoOiB0aHJvdHRsZWRSZWZyZXNoLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3lcbiAgfTtcblxuICBmdW5jdGlvbiBub29wICgpIHt9XG4gIGZ1bmN0aW9uIHJlYWRQb3NpdGlvbiAoKSB7IHJldHVybiAodGV4dElucHV0ID8gY29vcmRzVGV4dCA6IGNvb3Jkc0hUTUwpKCk7IH1cblxuICBmdW5jdGlvbiByZWZyZXNoICgpIHtcbiAgICBpZiAoby5zbGVlcGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gKG8udXBkYXRlIHx8IG5vb3ApKHJlYWRQb3NpdGlvbigpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc1RleHQgKCkge1xuICAgIHZhciBwID0gc2VsbChlbCk7XG4gICAgdmFyIGNvbnRleHQgPSBwcmVwYXJlKCk7XG4gICAgdmFyIHJlYWRpbmdzID0gcmVhZFRleHRDb29yZHMoY29udGV4dCwgcC5zdGFydCk7XG4gICAgZG9jLmJvZHkucmVtb3ZlQ2hpbGQoY29udGV4dC5taXJyb3IpO1xuICAgIHJldHVybiByZWFkaW5ncztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc0hUTUwgKCkge1xuICAgIHZhciBzZWwgPSBnZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoc2VsLnJhbmdlQ291bnQpIHtcbiAgICAgIHZhciByYW5nZSA9IHNlbC5nZXRSYW5nZUF0KDApO1xuICAgICAgdmFyIG5lZWRzVG9Xb3JrQXJvdW5kTmV3bGluZUJ1ZyA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVOYW1lID09PSAnUCcgJiYgcmFuZ2Uuc3RhcnRPZmZzZXQgPT09IDA7XG4gICAgICBpZiAobmVlZHNUb1dvcmtBcm91bmROZXdsaW5lQnVnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgeDogcmFuZ2Uuc3RhcnRDb250YWluZXIub2Zmc2V0TGVmdCxcbiAgICAgICAgICB5OiByYW5nZS5zdGFydENvbnRhaW5lci5vZmZzZXRUb3AsXG4gICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChyYW5nZS5nZXRDbGllbnRSZWN0cykge1xuICAgICAgICB2YXIgcmVjdHMgPSByYW5nZS5nZXRDbGllbnRSZWN0cygpO1xuICAgICAgICBpZiAocmVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByZWN0c1swXS5sZWZ0LFxuICAgICAgICAgICAgeTogcmVjdHNbMF0udG9wLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHg6IDAsIHk6IDAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUZXh0Q29vcmRzIChjb250ZXh0LCBwKSB7XG4gICAgdmFyIHJlc3QgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciBtaXJyb3IgPSBjb250ZXh0Lm1pcnJvcjtcbiAgICB2YXIgY29tcHV0ZWQgPSBjb250ZXh0LmNvbXB1dGVkO1xuXG4gICAgd3JpdGUobWlycm9yLCByZWFkKGVsKS5zdWJzdHJpbmcoMCwgcCkpO1xuXG4gICAgaWYgKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgIG1pcnJvci50ZXh0Q29udGVudCA9IG1pcnJvci50ZXh0Q29udGVudC5yZXBsYWNlKC9cXHMvZywgJ1xcdTAwYTAnKTtcbiAgICB9XG5cbiAgICB3cml0ZShyZXN0LCByZWFkKGVsKS5zdWJzdHJpbmcocCkgfHwgJy4nKTtcblxuICAgIG1pcnJvci5hcHBlbmRDaGlsZChyZXN0KTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZXN0Lm9mZnNldExlZnQgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyTGVmdFdpZHRoJ10pLFxuICAgICAgeTogcmVzdC5vZmZzZXRUb3AgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyVG9wV2lkdGgnXSlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoZWwpIHtcbiAgICByZXR1cm4gdGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUw7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVwYXJlICgpIHtcbiAgICB2YXIgY29tcHV0ZWQgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUoZWwpIDogZWwuY3VycmVudFN0eWxlO1xuICAgIHZhciBtaXJyb3IgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN0eWxlID0gbWlycm9yLnN0eWxlO1xuXG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQobWlycm9yKTtcblxuICAgIGlmIChlbC50YWdOYW1lICE9PSAnSU5QVVQnKSB7XG4gICAgICBzdHlsZS53b3JkV3JhcCA9ICdicmVhay13b3JkJztcbiAgICB9XG4gICAgc3R5bGUud2hpdGVTcGFjZSA9ICdwcmUtd3JhcCc7XG4gICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICBwcm9wcy5mb3JFYWNoKGNvcHkpO1xuXG4gICAgaWYgKGZmKSB7XG4gICAgICBzdHlsZS53aWR0aCA9IHBhcnNlSW50KGNvbXB1dGVkLndpZHRoKSAtIDIgKyAncHgnO1xuICAgICAgaWYgKGVsLnNjcm9sbEhlaWdodCA+IHBhcnNlSW50KGNvbXB1dGVkLmhlaWdodCkpIHtcbiAgICAgICAgc3R5bGUub3ZlcmZsb3dZID0gJ3Njcm9sbCc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgfVxuICAgIHJldHVybiB7IG1pcnJvcjogbWlycm9yLCBjb21wdXRlZDogY29tcHV0ZWQgfTtcblxuICAgIGZ1bmN0aW9uIGNvcHkgKHByb3ApIHtcbiAgICAgIHN0eWxlW3Byb3BdID0gY29tcHV0ZWRbcHJvcF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKGVsLCB2YWx1ZSkge1xuICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgIGVsLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJpbmQgKHJlbW92ZSkge1xuICAgIHZhciBvcCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2tleWRvd24nLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAna2V5dXAnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnaW5wdXQnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAncGFzdGUnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnY2hhbmdlJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBiaW5kKHRydWUpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGFpbG9ybWFkZTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5aWRXeHNjMlY1WlM5MFlXbHNiM0p0WVdSbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVpTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpZDFjMlVnYzNSeWFXTjBKenRjYmx4dWRtRnlJSE5sYkd3Z1BTQnlaWEYxYVhKbEtDZHpaV3hzSnlrN1hHNTJZWElnWTNKdmMzTjJaVzUwSUQwZ2NtVnhkV2x5WlNnblkzSnZjM04yWlc1MEp5azdYRzUyWVhJZ2MyVnNaV05qYVc5dUlEMGdjbVZ4ZFdseVpTZ25jMlZzWldOamFXOXVKeWs3WEc1MllYSWdkR2h5YjNSMGJHVWdQU0J5WlhGMWFYSmxLQ2N1TDNSb2NtOTBkR3hsSnlrN1hHNTJZWElnWjJWMFUyVnNaV04wYVc5dUlEMGdjMlZzWldOamFXOXVMbWRsZER0Y2JuWmhjaUJ3Y205d2N5QTlJRnRjYmlBZ0oyUnBjbVZqZEdsdmJpY3NYRzRnSUNkaWIzaFRhWHBwYm1jbkxGeHVJQ0FuZDJsa2RHZ25MRnh1SUNBbmFHVnBaMmgwSnl4Y2JpQWdKMjkyWlhKbWJHOTNXQ2NzWEc0Z0lDZHZkbVZ5Wm14dmQxa25MRnh1SUNBblltOXlaR1Z5Vkc5d1YybGtkR2duTEZ4dUlDQW5ZbTl5WkdWeVVtbG5hSFJYYVdSMGFDY3NYRzRnSUNkaWIzSmtaWEpDYjNSMGIyMVhhV1IwYUNjc1hHNGdJQ2RpYjNKa1pYSk1aV1owVjJsa2RHZ25MRnh1SUNBbmNHRmtaR2x1WjFSdmNDY3NYRzRnSUNkd1lXUmthVzVuVW1sbmFIUW5MRnh1SUNBbmNHRmtaR2x1WjBKdmRIUnZiU2NzWEc0Z0lDZHdZV1JrYVc1blRHVm1kQ2NzWEc0Z0lDZG1iMjUwVTNSNWJHVW5MRnh1SUNBblptOXVkRlpoY21saGJuUW5MRnh1SUNBblptOXVkRmRsYVdkb2RDY3NYRzRnSUNkbWIyNTBVM1J5WlhSamFDY3NYRzRnSUNkbWIyNTBVMmw2WlNjc1hHNGdJQ2RtYjI1MFUybDZaVUZrYW5WemRDY3NYRzRnSUNkc2FXNWxTR1ZwWjJoMEp5eGNiaUFnSjJadmJuUkdZVzFwYkhrbkxGeHVJQ0FuZEdWNGRFRnNhV2R1Snl4Y2JpQWdKM1JsZUhSVWNtRnVjMlp2Y20wbkxGeHVJQ0FuZEdWNGRFbHVaR1Z1ZENjc1hHNGdJQ2QwWlhoMFJHVmpiM0poZEdsdmJpY3NYRzRnSUNkc1pYUjBaWEpUY0dGamFXNW5KeXhjYmlBZ0ozZHZjbVJUY0dGamFXNW5KMXh1WFR0Y2JuWmhjaUIzYVc0Z1BTQm5iRzlpWVd3N1hHNTJZWElnWkc5aklEMGdaRzlqZFcxbGJuUTdYRzUyWVhJZ1ptWWdQU0IzYVc0dWJXOTZTVzV1WlhKVFkzSmxaVzVZSUNFOVBTQnVkV3hzSUNZbUlIZHBiaTV0YjNwSmJtNWxjbE5qY21WbGJsZ2dJVDA5SUhadmFXUWdNRHRjYmx4dVpuVnVZM1JwYjI0Z2RHRnBiRzl5YldGa1pTQW9aV3dzSUc5d2RHbHZibk1wSUh0Y2JpQWdkbUZ5SUhSbGVIUkpibkIxZENBOUlHVnNMblJoWjA1aGJXVWdQVDA5SUNkSlRsQlZWQ2NnZkh3Z1pXd3VkR0ZuVG1GdFpTQTlQVDBnSjFSRldGUkJVa1ZCSnp0Y2JpQWdkbUZ5SUhSb2NtOTBkR3hsWkZKbFpuSmxjMmdnUFNCMGFISnZkSFJzWlNoeVpXWnlaWE5vTENBek1DazdYRzRnSUhaaGNpQnZJRDBnYjNCMGFXOXVjeUI4ZkNCN2ZUdGNibHh1SUNCaWFXNWtLQ2s3WEc1Y2JpQWdjbVYwZFhKdUlIdGNiaUFnSUNCeVpXRmtPaUJ5WldGa1VHOXphWFJwYjI0c1hHNGdJQ0FnY21WbWNtVnphRG9nZEdoeWIzUjBiR1ZrVW1WbWNtVnphQ3hjYmlBZ0lDQmtaWE4wY205NU9pQmtaWE4wY205NVhHNGdJSDA3WEc1Y2JpQWdablZ1WTNScGIyNGdibTl2Y0NBb0tTQjdmVnh1SUNCbWRXNWpkR2x2YmlCeVpXRmtVRzl6YVhScGIyNGdLQ2tnZXlCeVpYUjFjbTRnS0hSbGVIUkpibkIxZENBL0lHTnZiM0prYzFSbGVIUWdPaUJqYjI5eVpITklWRTFNS1NncE95QjlYRzVjYmlBZ1puVnVZM1JwYjI0Z2NtVm1jbVZ6YUNBb0tTQjdYRzRnSUNBZ2FXWWdLRzh1YzJ4bFpYQnBibWNwSUh0Y2JpQWdJQ0FnSUhKbGRIVnlianRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUNodkxuVndaR0YwWlNCOGZDQnViMjl3S1NoeVpXRmtVRzl6YVhScGIyNG9LU2s3WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCamIyOXlaSE5VWlhoMElDZ3BJSHRjYmlBZ0lDQjJZWElnY0NBOUlITmxiR3dvWld3cE8xeHVJQ0FnSUhaaGNpQmpiMjUwWlhoMElEMGdjSEpsY0dGeVpTZ3BPMXh1SUNBZ0lIWmhjaUJ5WldGa2FXNW5jeUE5SUhKbFlXUlVaWGgwUTI5dmNtUnpLR052Ym5SbGVIUXNJSEF1YzNSaGNuUXBPMXh1SUNBZ0lHUnZZeTVpYjJSNUxuSmxiVzkyWlVOb2FXeGtLR052Ym5SbGVIUXViV2x5Y205eUtUdGNiaUFnSUNCeVpYUjFjbTRnY21WaFpHbHVaM003WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCamIyOXlaSE5JVkUxTUlDZ3BJSHRjYmlBZ0lDQjJZWElnYzJWc0lEMGdaMlYwVTJWc1pXTjBhVzl1S0NrN1hHNGdJQ0FnYVdZZ0tITmxiQzV5WVc1blpVTnZkVzUwS1NCN1hHNGdJQ0FnSUNCMllYSWdjbUZ1WjJVZ1BTQnpaV3d1WjJWMFVtRnVaMlZCZENnd0tUdGNiaUFnSUNBZ0lIWmhjaUJ1WldWa2MxUnZWMjl5YTBGeWIzVnVaRTVsZDJ4cGJtVkNkV2NnUFNCeVlXNW5aUzV6ZEdGeWRFTnZiblJoYVc1bGNpNXViMlJsVG1GdFpTQTlQVDBnSjFBbklDWW1JSEpoYm1kbExuTjBZWEowVDJabWMyVjBJRDA5UFNBd08xeHVJQ0FnSUNBZ2FXWWdLRzVsWldSelZHOVhiM0pyUVhKdmRXNWtUbVYzYkdsdVpVSjFaeWtnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZTF4dUlDQWdJQ0FnSUNBZ0lIZzZJSEpoYm1kbExuTjBZWEowUTI5dWRHRnBibVZ5TG05bVpuTmxkRXhsWm5Rc1hHNGdJQ0FnSUNBZ0lDQWdlVG9nY21GdVoyVXVjM1JoY25SRGIyNTBZV2x1WlhJdWIyWm1jMlYwVkc5d0xGeHVJQ0FnSUNBZ0lDQWdJR0ZpYzI5c2RYUmxPaUIwY25WbFhHNGdJQ0FnSUNBZ0lIMDdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnBaaUFvY21GdVoyVXVaMlYwUTJ4cFpXNTBVbVZqZEhNcElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUhKbFkzUnpJRDBnY21GdVoyVXVaMlYwUTJ4cFpXNTBVbVZqZEhNb0tUdGNiaUFnSUNBZ0lDQWdhV1lnS0hKbFkzUnpMbXhsYm1kMGFDQStJREFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZURvZ2NtVmpkSE5iTUYwdWJHVm1kQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lIazZJSEpsWTNSeld6QmRMblJ2Y0N4Y2JpQWdJQ0FnSUNBZ0lDQWdJR0ZpYzI5c2RYUmxPaUIwY25WbFhHNGdJQ0FnSUNBZ0lDQWdmVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2V5QjRPaUF3TENCNU9pQXdJSDA3WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCeVpXRmtWR1Y0ZEVOdmIzSmtjeUFvWTI5dWRHVjRkQ3dnY0NrZ2UxeHVJQ0FnSUhaaGNpQnlaWE4wSUQwZ1pHOWpMbU55WldGMFpVVnNaVzFsYm5Rb0ozTndZVzRuS1R0Y2JpQWdJQ0IyWVhJZ2JXbHljbTl5SUQwZ1kyOXVkR1Y0ZEM1dGFYSnliM0k3WEc0Z0lDQWdkbUZ5SUdOdmJYQjFkR1ZrSUQwZ1kyOXVkR1Y0ZEM1amIyMXdkWFJsWkR0Y2JseHVJQ0FnSUhkeWFYUmxLRzFwY25KdmNpd2djbVZoWkNobGJDa3VjM1ZpYzNSeWFXNW5LREFzSUhBcEtUdGNibHh1SUNBZ0lHbG1JQ2hsYkM1MFlXZE9ZVzFsSUQwOVBTQW5TVTVRVlZRbktTQjdYRzRnSUNBZ0lDQnRhWEp5YjNJdWRHVjRkRU52Ym5SbGJuUWdQU0J0YVhKeWIzSXVkR1Y0ZEVOdmJuUmxiblF1Y21Wd2JHRmpaU2d2WEZ4ekwyY3NJQ2RjWEhVd01HRXdKeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdkM0pwZEdVb2NtVnpkQ3dnY21WaFpDaGxiQ2t1YzNWaWMzUnlhVzVuS0hBcElIeDhJQ2N1SnlrN1hHNWNiaUFnSUNCdGFYSnliM0l1WVhCd1pXNWtRMmhwYkdRb2NtVnpkQ2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdlMXh1SUNBZ0lDQWdlRG9nY21WemRDNXZabVp6WlhSTVpXWjBJQ3NnY0dGeWMyVkpiblFvWTI5dGNIVjBaV1JiSjJKdmNtUmxja3hsWm5SWGFXUjBhQ2RkS1N4Y2JpQWdJQ0FnSUhrNklISmxjM1F1YjJabWMyVjBWRzl3SUNzZ2NHRnljMlZKYm5Rb1kyOXRjSFYwWldSYkoySnZjbVJsY2xSdmNGZHBaSFJvSjEwcFhHNGdJQ0FnZlR0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlISmxZV1FnS0dWc0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSbGVIUkpibkIxZENBL0lHVnNMblpoYkhWbElEb2daV3d1YVc1dVpYSklWRTFNTzF4dUlDQjlYRzVjYmlBZ1puVnVZM1JwYjI0Z2NISmxjR0Z5WlNBb0tTQjdYRzRnSUNBZ2RtRnlJR052YlhCMWRHVmtJRDBnZDJsdUxtZGxkRU52YlhCMWRHVmtVM1I1YkdVZ1B5Qm5aWFJEYjIxd2RYUmxaRk4wZVd4bEtHVnNLU0E2SUdWc0xtTjFjbkpsYm5SVGRIbHNaVHRjYmlBZ0lDQjJZWElnYldseWNtOXlJRDBnWkc5akxtTnlaV0YwWlVWc1pXMWxiblFvSjJScGRpY3BPMXh1SUNBZ0lIWmhjaUJ6ZEhsc1pTQTlJRzFwY25KdmNpNXpkSGxzWlR0Y2JseHVJQ0FnSUdSdll5NWliMlI1TG1Gd2NHVnVaRU5vYVd4a0tHMXBjbkp2Y2lrN1hHNWNiaUFnSUNCcFppQW9aV3d1ZEdGblRtRnRaU0FoUFQwZ0owbE9VRlZVSnlrZ2UxeHVJQ0FnSUNBZ2MzUjViR1V1ZDI5eVpGZHlZWEFnUFNBblluSmxZV3N0ZDI5eVpDYzdYRzRnSUNBZ2ZWeHVJQ0FnSUhOMGVXeGxMbmRvYVhSbFUzQmhZMlVnUFNBbmNISmxMWGR5WVhBbk8xeHVJQ0FnSUhOMGVXeGxMbkJ2YzJsMGFXOXVJRDBnSjJGaWMyOXNkWFJsSnp0Y2JpQWdJQ0J6ZEhsc1pTNTJhWE5wWW1sc2FYUjVJRDBnSjJocFpHUmxiaWM3WEc0Z0lDQWdjSEp2Y0hNdVptOXlSV0ZqYUNoamIzQjVLVHRjYmx4dUlDQWdJR2xtSUNobVppa2dlMXh1SUNBZ0lDQWdjM1I1YkdVdWQybGtkR2dnUFNCd1lYSnpaVWx1ZENoamIyMXdkWFJsWkM1M2FXUjBhQ2tnTFNBeUlDc2dKM0I0Snp0Y2JpQWdJQ0FnSUdsbUlDaGxiQzV6WTNKdmJHeElaV2xuYUhRZ1BpQndZWEp6WlVsdWRDaGpiMjF3ZFhSbFpDNW9aV2xuYUhRcEtTQjdYRzRnSUNBZ0lDQWdJSE4wZVd4bExtOTJaWEptYkc5M1dTQTlJQ2R6WTNKdmJHd25PMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCemRIbHNaUzV2ZG1WeVpteHZkeUE5SUNkb2FXUmtaVzRuTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2V5QnRhWEp5YjNJNklHMXBjbkp2Y2l3Z1kyOXRjSFYwWldRNklHTnZiWEIxZEdWa0lIMDdYRzVjYmlBZ0lDQm1kVzVqZEdsdmJpQmpiM0I1SUNod2NtOXdLU0I3WEc0Z0lDQWdJQ0J6ZEhsc1pWdHdjbTl3WFNBOUlHTnZiWEIxZEdWa1czQnliM0JkTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUhkeWFYUmxJQ2hsYkN3Z2RtRnNkV1VwSUh0Y2JpQWdJQ0JwWmlBb2RHVjRkRWx1Y0hWMEtTQjdYRzRnSUNBZ0lDQmxiQzUwWlhoMFEyOXVkR1Z1ZENBOUlIWmhiSFZsTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQmxiQzVwYm01bGNraFVUVXdnUFNCMllXeDFaVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJpYVc1a0lDaHlaVzF2ZG1VcElIdGNiaUFnSUNCMllYSWdiM0FnUFNCeVpXMXZkbVVnUHlBbmNtVnRiM1psSnlBNklDZGhaR1FuTzF4dUlDQWdJR055YjNOemRtVnVkRnR2Y0Ywb1pXd3NJQ2RyWlhsa2IzZHVKeXdnZEdoeWIzUjBiR1ZrVW1WbWNtVnphQ2s3WEc0Z0lDQWdZM0p2YzNOMlpXNTBXMjl3WFNobGJDd2dKMnRsZVhWd0p5d2dkR2h5YjNSMGJHVmtVbVZtY21WemFDazdYRzRnSUNBZ1kzSnZjM04yWlc1MFcyOXdYU2hsYkN3Z0oybHVjSFYwSnl3Z2RHaHliM1IwYkdWa1VtVm1jbVZ6YUNrN1hHNGdJQ0FnWTNKdmMzTjJaVzUwVzI5d1hTaGxiQ3dnSjNCaGMzUmxKeXdnZEdoeWIzUjBiR1ZrVW1WbWNtVnphQ2s3WEc0Z0lDQWdZM0p2YzNOMlpXNTBXMjl3WFNobGJDd2dKMk5vWVc1blpTY3NJSFJvY205MGRHeGxaRkpsWm5KbGMyZ3BPMXh1SUNCOVhHNWNiaUFnWm5WdVkzUnBiMjRnWkdWemRISnZlU0FvS1NCN1hHNGdJQ0FnWW1sdVpDaDBjblZsS1R0Y2JpQWdmVnh1ZlZ4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlIUmhhV3h2Y20xaFpHVTdYRzRpWFgwPSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdGhyb3R0bGUgKGZuLCBib3VuZGFyeSkge1xuICB2YXIgbGFzdCA9IC1JbmZpbml0eTtcbiAgdmFyIHRpbWVyO1xuICByZXR1cm4gZnVuY3Rpb24gYm91bmNlZCAoKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuYm91bmQoKTtcblxuICAgIGZ1bmN0aW9uIHVuYm91bmQgKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIHZhciBuZXh0ID0gbGFzdCArIGJvdW5kYXJ5O1xuICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICBpZiAobm93ID4gbmV4dCkge1xuICAgICAgICBsYXN0ID0gbm93O1xuICAgICAgICBmbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHVuYm91bmQsIG5leHQgLSBub3cpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRpY2t5ID0gcmVxdWlyZSgndGlja3knKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkge1xuICBpZiAoIWZuKSB7IHJldHVybjsgfVxuICB0aWNreShmdW5jdGlvbiBydW4gKCkge1xuICAgIGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXRvYSA9IHJlcXVpcmUoJ2F0b2EnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBldnQgPSB7fTtcbiAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICB0aGluZy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmICghZXZ0W3R5cGVdKSB7XG4gICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgIH0gZWxzZSB7XG4gICAgICBldnRbdHlwZV0ucHVzaChmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGZuLl9vbmNlID0gdHJ1ZTsgLy8gdGhpbmcub2ZmKGZuKSBzdGlsbCB3b3JrcyFcbiAgICB0aGluZy5vbih0eXBlLCBmbik7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vZmYgPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGMgPT09IDEpIHtcbiAgICAgIGRlbGV0ZSBldnRbdHlwZV07XG4gICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICBldnQgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgaWYgKCFldCkgeyByZXR1cm4gdGhpbmc7IH1cbiAgICAgIGV0LnNwbGljZShldC5pbmRleE9mKGZuKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGF0b2EoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdGhpbmcuZW1pdHRlclNuYXBzaG90KGFyZ3Muc2hpZnQoKSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG4gIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGV0ID0gKGV2dFt0eXBlXSB8fCBbXSkuc2xpY2UoMCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgdmFyIGN0eCA9IHRoaXMgfHwgdGhpbmc7XG4gICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0Lmxlbmd0aCkgeyB0aHJvdyBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzOyB9XG4gICAgICBldC5mb3JFYWNoKGZ1bmN0aW9uIGVtaXR0ZXIgKGxpc3Rlbikge1xuICAgICAgICBpZiAob3B0cy5hc3luYykgeyBkZWJvdW5jZShsaXN0ZW4sIGFyZ3MsIGN0eCk7IH0gZWxzZSB7IGxpc3Rlbi5hcHBseShjdHgsIGFyZ3MpOyB9XG4gICAgICAgIGlmIChsaXN0ZW4uX29uY2UpIHsgdGhpbmcub2ZmKHR5cGUsIGxpc3Rlbik7IH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gIH07XG4gIHJldHVybiB0aGluZztcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjdXN0b21FdmVudCA9IHJlcXVpcmUoJ2N1c3RvbS1ldmVudCcpO1xudmFyIGV2ZW50bWFwID0gcmVxdWlyZSgnLi9ldmVudG1hcCcpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBsaXN0ZW5lciA9IHVud3JhcChlbCwgdHlwZSwgZm4pO1xuICBpZiAobGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUsIG1vZGVsKSB7XG4gIHZhciBlID0gZXZlbnRtYXAuaW5kZXhPZih0eXBlKSA9PT0gLTEgPyBtYWtlQ3VzdG9tRXZlbnQoKSA6IG1ha2VDbGFzc2ljRXZlbnQoKTtcbiAgaWYgKGVsLmRpc3BhdGNoRXZlbnQpIHtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUNsYXNzaWNFdmVudCAoKSB7XG4gICAgdmFyIGU7XG4gICAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiBlO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDdXN0b21FdmVudCAoKSB7XG4gICAgcmV0dXJuIG5ldyBjdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogbW9kZWwgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZS53aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWpjbTl6YzNabGJuUXZjM0pqTDJOeWIzTnpkbVZ1ZEM1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SW5kWE5sSUhOMGNtbGpkQ2M3WEc1Y2JuWmhjaUJqZFhOMGIyMUZkbVZ1ZENBOUlISmxjWFZwY21Vb0oyTjFjM1J2YlMxbGRtVnVkQ2NwTzF4dWRtRnlJR1YyWlc1MGJXRndJRDBnY21WeGRXbHlaU2duTGk5bGRtVnVkRzFoY0NjcE8xeHVkbUZ5SUdSdll5QTlJR2RzYjJKaGJDNWtiMk4xYldWdWREdGNiblpoY2lCaFpHUkZkbVZ1ZENBOUlHRmtaRVYyWlc1MFJXRnplVHRjYm5aaGNpQnlaVzF2ZG1WRmRtVnVkQ0E5SUhKbGJXOTJaVVYyWlc1MFJXRnplVHRjYm5aaGNpQm9ZWEprUTJGamFHVWdQU0JiWFR0Y2JseHVhV1lnS0NGbmJHOWlZV3d1WVdSa1JYWmxiblJNYVhOMFpXNWxjaWtnZTF4dUlDQmhaR1JGZG1WdWRDQTlJR0ZrWkVWMlpXNTBTR0Z5WkR0Y2JpQWdjbVZ0YjNabFJYWmxiblFnUFNCeVpXMXZkbVZGZG1WdWRFaGhjbVE3WEc1OVhHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdlMXh1SUNCaFpHUTZJR0ZrWkVWMlpXNTBMRnh1SUNCeVpXMXZkbVU2SUhKbGJXOTJaVVYyWlc1MExGeHVJQ0JtWVdKeWFXTmhkR1U2SUdaaFluSnBZMkYwWlVWMlpXNTBYRzU5TzF4dVhHNW1kVzVqZEdsdmJpQmhaR1JGZG1WdWRFVmhjM2tnS0dWc0xDQjBlWEJsTENCbWJpd2dZMkZ3ZEhWeWFXNW5LU0I3WEc0Z0lISmxkSFZ5YmlCbGJDNWhaR1JGZG1WdWRFeHBjM1JsYm1WeUtIUjVjR1VzSUdadUxDQmpZWEIwZFhKcGJtY3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmhaR1JGZG1WdWRFaGhjbVFnS0dWc0xDQjBlWEJsTENCbWJpa2dlMXh1SUNCeVpYUjFjbTRnWld3dVlYUjBZV05vUlhabGJuUW9KMjl1SnlBcklIUjVjR1VzSUhkeVlYQW9aV3dzSUhSNWNHVXNJR1p1S1NrN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUhKbGJXOTJaVVYyWlc1MFJXRnplU0FvWld3c0lIUjVjR1VzSUdadUxDQmpZWEIwZFhKcGJtY3BJSHRjYmlBZ2NtVjBkWEp1SUdWc0xuSmxiVzkyWlVWMlpXNTBUR2x6ZEdWdVpYSW9kSGx3WlN3Z1ptNHNJR05oY0hSMWNtbHVaeWs3WEc1OVhHNWNibVoxYm1OMGFXOXVJSEpsYlc5MlpVVjJaVzUwU0dGeVpDQW9aV3dzSUhSNWNHVXNJR1p1S1NCN1hHNGdJSFpoY2lCc2FYTjBaVzVsY2lBOUlIVnVkM0poY0NobGJDd2dkSGx3WlN3Z1ptNHBPMXh1SUNCcFppQW9iR2x6ZEdWdVpYSXBJSHRjYmlBZ0lDQnlaWFIxY200Z1pXd3VaR1YwWVdOb1JYWmxiblFvSjI5dUp5QXJJSFI1Y0dVc0lHeHBjM1JsYm1WeUtUdGNiaUFnZlZ4dWZWeHVYRzVtZFc1amRHbHZiaUJtWVdKeWFXTmhkR1ZGZG1WdWRDQW9aV3dzSUhSNWNHVXNJRzF2WkdWc0tTQjdYRzRnSUhaaGNpQmxJRDBnWlhabGJuUnRZWEF1YVc1a1pYaFBaaWgwZVhCbEtTQTlQVDBnTFRFZ1B5QnRZV3RsUTNWemRHOXRSWFpsYm5Rb0tTQTZJRzFoYTJWRGJHRnpjMmxqUlhabGJuUW9LVHRjYmlBZ2FXWWdLR1ZzTG1ScGMzQmhkR05vUlhabGJuUXBJSHRjYmlBZ0lDQmxiQzVrYVhOd1lYUmphRVYyWlc1MEtHVXBPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJR1ZzTG1acGNtVkZkbVZ1ZENnbmIyNG5JQ3NnZEhsd1pTd2daU2s3WEc0Z0lIMWNiaUFnWm5WdVkzUnBiMjRnYldGclpVTnNZWE56YVdORmRtVnVkQ0FvS1NCN1hHNGdJQ0FnZG1GeUlHVTdYRzRnSUNBZ2FXWWdLR1J2WXk1amNtVmhkR1ZGZG1WdWRDa2dlMXh1SUNBZ0lDQWdaU0E5SUdSdll5NWpjbVZoZEdWRmRtVnVkQ2duUlhabGJuUW5LVHRjYmlBZ0lDQWdJR1V1YVc1cGRFVjJaVzUwS0hSNWNHVXNJSFJ5ZFdVc0lIUnlkV1VwTzF4dUlDQWdJSDBnWld4elpTQnBaaUFvWkc5akxtTnlaV0YwWlVWMlpXNTBUMkpxWldOMEtTQjdYRzRnSUNBZ0lDQmxJRDBnWkc5akxtTnlaV0YwWlVWMlpXNTBUMkpxWldOMEtDazdYRzRnSUNBZ2ZWeHVJQ0FnSUhKbGRIVnliaUJsTzF4dUlDQjlYRzRnSUdaMWJtTjBhVzl1SUcxaGEyVkRkWE4wYjIxRmRtVnVkQ0FvS1NCN1hHNGdJQ0FnY21WMGRYSnVJRzVsZHlCamRYTjBiMjFGZG1WdWRDaDBlWEJsTENCN0lHUmxkR0ZwYkRvZ2JXOWtaV3dnZlNrN1hHNGdJSDFjYm4xY2JseHVablZ1WTNScGIyNGdkM0poY0hCbGNrWmhZM1J2Y25rZ0tHVnNMQ0IwZVhCbExDQm1iaWtnZTF4dUlDQnlaWFIxY200Z1puVnVZM1JwYjI0Z2QzSmhjSEJsY2lBb2IzSnBaMmx1WVd4RmRtVnVkQ2tnZTF4dUlDQWdJSFpoY2lCbElEMGdiM0pwWjJsdVlXeEZkbVZ1ZENCOGZDQm5iRzlpWVd3dVpYWmxiblE3WEc0Z0lDQWdaUzUwWVhKblpYUWdQU0JsTG5SaGNtZGxkQ0I4ZkNCbExuTnlZMFZzWlcxbGJuUTdYRzRnSUNBZ1pTNXdjbVYyWlc1MFJHVm1ZWFZzZENBOUlHVXVjSEpsZG1WdWRFUmxabUYxYkhRZ2ZId2dablZ1WTNScGIyNGdjSEpsZG1WdWRFUmxabUYxYkhRZ0tDa2dleUJsTG5KbGRIVnlibFpoYkhWbElEMGdabUZzYzJVN0lIMDdYRzRnSUNBZ1pTNXpkRzl3VUhKdmNHRm5ZWFJwYjI0Z1BTQmxMbk4wYjNCUWNtOXdZV2RoZEdsdmJpQjhmQ0JtZFc1amRHbHZiaUJ6ZEc5d1VISnZjR0ZuWVhScGIyNGdLQ2tnZXlCbExtTmhibU5sYkVKMVltSnNaU0E5SUhSeWRXVTdJSDA3WEc0Z0lDQWdaUzUzYUdsamFDQTlJR1V1ZDJocFkyZ2dmSHdnWlM1clpYbERiMlJsTzF4dUlDQWdJR1p1TG1OaGJHd29aV3dzSUdVcE8xeHVJQ0I5TzF4dWZWeHVYRzVtZFc1amRHbHZiaUIzY21Gd0lDaGxiQ3dnZEhsd1pTd2dabTRwSUh0Y2JpQWdkbUZ5SUhkeVlYQndaWElnUFNCMWJuZHlZWEFvWld3c0lIUjVjR1VzSUdadUtTQjhmQ0IzY21Gd2NHVnlSbUZqZEc5eWVTaGxiQ3dnZEhsd1pTd2dabTRwTzF4dUlDQm9ZWEprUTJGamFHVXVjSFZ6YUNoN1hHNGdJQ0FnZDNKaGNIQmxjam9nZDNKaGNIQmxjaXhjYmlBZ0lDQmxiR1Z0Wlc1ME9pQmxiQ3hjYmlBZ0lDQjBlWEJsT2lCMGVYQmxMRnh1SUNBZ0lHWnVPaUJtYmx4dUlDQjlLVHRjYmlBZ2NtVjBkWEp1SUhkeVlYQndaWEk3WEc1OVhHNWNibVoxYm1OMGFXOXVJSFZ1ZDNKaGNDQW9aV3dzSUhSNWNHVXNJR1p1S1NCN1hHNGdJSFpoY2lCcElEMGdabWx1WkNobGJDd2dkSGx3WlN3Z1ptNHBPMXh1SUNCcFppQW9hU2tnZTF4dUlDQWdJSFpoY2lCM2NtRndjR1Z5SUQwZ2FHRnlaRU5oWTJobFcybGRMbmR5WVhCd1pYSTdYRzRnSUNBZ2FHRnlaRU5oWTJobExuTndiR2xqWlNocExDQXhLVHNnTHk4Z1puSmxaU0IxY0NCaElIUmhaQ0J2WmlCdFpXMXZjbmxjYmlBZ0lDQnlaWFIxY200Z2QzSmhjSEJsY2p0Y2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQm1hVzVrSUNobGJDd2dkSGx3WlN3Z1ptNHBJSHRjYmlBZ2RtRnlJR2tzSUdsMFpXMDdYRzRnSUdadmNpQW9hU0E5SURBN0lHa2dQQ0JvWVhKa1EyRmphR1V1YkdWdVozUm9PeUJwS3lzcElIdGNiaUFnSUNCcGRHVnRJRDBnYUdGeVpFTmhZMmhsVzJsZE8xeHVJQ0FnSUdsbUlDaHBkR1Z0TG1Wc1pXMWxiblFnUFQwOUlHVnNJQ1ltSUdsMFpXMHVkSGx3WlNBOVBUMGdkSGx3WlNBbUppQnBkR1Z0TG1adUlEMDlQU0JtYmlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdrN1hHNGdJQ0FnZlZ4dUlDQjlYRzU5WEc0aVhYMD0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBldmVudG1hcCA9IFtdO1xudmFyIGV2ZW50bmFtZSA9ICcnO1xudmFyIHJvbiA9IC9eb24vO1xuXG5mb3IgKGV2ZW50bmFtZSBpbiBnbG9iYWwpIHtcbiAgaWYgKHJvbi50ZXN0KGV2ZW50bmFtZSkpIHtcbiAgICBldmVudG1hcC5wdXNoKGV2ZW50bmFtZS5zbGljZSgyKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudG1hcDtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5amNtOXpjM1psYm5RdmMzSmpMMlYyWlc1MGJXRndMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJbmRYTmxJSE4wY21samRDYzdYRzVjYm5aaGNpQmxkbVZ1ZEcxaGNDQTlJRnRkTzF4dWRtRnlJR1YyWlc1MGJtRnRaU0E5SUNjbk8xeHVkbUZ5SUhKdmJpQTlJQzllYjI0dk8xeHVYRzVtYjNJZ0tHVjJaVzUwYm1GdFpTQnBiaUJuYkc5aVlXd3BJSHRjYmlBZ2FXWWdLSEp2Ymk1MFpYTjBLR1YyWlc1MGJtRnRaU2twSUh0Y2JpQWdJQ0JsZG1WdWRHMWhjQzV3ZFhOb0tHVjJaVzUwYm1GdFpTNXpiR2xqWlNneUtTazdYRzRnSUgxY2JuMWNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0JsZG1WdWRHMWhjRHRjYmlKZGZRPT0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG5cbnZhciBOYXRpdmVDdXN0b21FdmVudCA9IGdsb2JhbC5DdXN0b21FdmVudDtcblxuZnVuY3Rpb24gdXNlTmF0aXZlICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcCA9IG5ldyBOYXRpdmVDdXN0b21FdmVudCgnY2F0JywgeyBkZXRhaWw6IHsgZm9vOiAnYmFyJyB9IH0pO1xuICAgIHJldHVybiAgJ2NhdCcgPT09IHAudHlwZSAmJiAnYmFyJyA9PT0gcC5kZXRhaWwuZm9vO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyb3NzLWJyb3dzZXIgYEN1c3RvbUV2ZW50YCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQuQ3VzdG9tRXZlbnRcbiAqXG4gKiBAcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VOYXRpdmUoKSA/IE5hdGl2ZUN1c3RvbUV2ZW50IDpcblxuLy8gSUUgPj0gOVxuJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID8gZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgfSBlbHNlIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIHZvaWQgMCk7XG4gIH1cbiAgcmV0dXJuIGU7XG59IDpcblxuLy8gSUUgPD0gOFxuZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gIGUudHlwZSA9IHR5cGU7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmJ1YmJsZXMgPSBCb29sZWFuKHBhcmFtcy5idWJibGVzKTtcbiAgICBlLmNhbmNlbGFibGUgPSBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKTtcbiAgICBlLmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gIH0gZWxzZSB7XG4gICAgZS5idWJibGVzID0gZmFsc2U7XG4gICAgZS5jYW5jZWxhYmxlID0gZmFsc2U7XG4gICAgZS5kZXRhaWwgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWpkWE4wYjIwdFpYWmxiblF2YVc1a1pYZ3Vhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SmNiblpoY2lCT1lYUnBkbVZEZFhOMGIyMUZkbVZ1ZENBOUlHZHNiMkpoYkM1RGRYTjBiMjFGZG1WdWREdGNibHh1Wm5WdVkzUnBiMjRnZFhObFRtRjBhWFpsSUNncElIdGNiaUFnZEhKNUlIdGNiaUFnSUNCMllYSWdjQ0E5SUc1bGR5Qk9ZWFJwZG1WRGRYTjBiMjFGZG1WdWRDZ25ZMkYwSnl3Z2V5QmtaWFJoYVd3NklIc2dabTl2T2lBblltRnlKeUI5SUgwcE8xeHVJQ0FnSUhKbGRIVnliaUFnSjJOaGRDY2dQVDA5SUhBdWRIbHdaU0FtSmlBblltRnlKeUE5UFQwZ2NDNWtaWFJoYVd3dVptOXZPMXh1SUNCOUlHTmhkR05vSUNobEtTQjdYRzRnSUgxY2JpQWdjbVYwZFhKdUlHWmhiSE5sTzF4dWZWeHVYRzR2S2lwY2JpQXFJRU55YjNOekxXSnliM2R6WlhJZ1lFTjFjM1J2YlVWMlpXNTBZQ0JqYjI1emRISjFZM1J2Y2k1Y2JpQXFYRzRnS2lCb2RIUndjem92TDJSbGRtVnNiM0JsY2k1dGIzcHBiR3hoTG05eVp5OWxiaTFWVXk5a2IyTnpMMWRsWWk5QlVFa3ZRM1Z6ZEc5dFJYWmxiblF1UTNWemRHOXRSWFpsYm5SY2JpQXFYRzRnS2lCQWNIVmliR2xqWEc0Z0tpOWNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0IxYzJWT1lYUnBkbVVvS1NBL0lFNWhkR2wyWlVOMWMzUnZiVVYyWlc1MElEcGNibHh1THk4Z1NVVWdQajBnT1Z4dUoyWjFibU4wYVc5dUp5QTlQVDBnZEhsd1pXOW1JR1J2WTNWdFpXNTBMbU55WldGMFpVVjJaVzUwSUQ4Z1puVnVZM1JwYjI0Z1EzVnpkRzl0UlhabGJuUWdLSFI1Y0dVc0lIQmhjbUZ0Y3lrZ2UxeHVJQ0IyWVhJZ1pTQTlJR1J2WTNWdFpXNTBMbU55WldGMFpVVjJaVzUwS0NkRGRYTjBiMjFGZG1WdWRDY3BPMXh1SUNCcFppQW9jR0Z5WVcxektTQjdYRzRnSUNBZ1pTNXBibWwwUTNWemRHOXRSWFpsYm5Rb2RIbHdaU3dnY0dGeVlXMXpMbUoxWW1Kc1pYTXNJSEJoY21GdGN5NWpZVzVqWld4aFlteGxMQ0J3WVhKaGJYTXVaR1YwWVdsc0tUdGNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQmxMbWx1YVhSRGRYTjBiMjFGZG1WdWRDaDBlWEJsTENCbVlXeHpaU3dnWm1Gc2MyVXNJSFp2YVdRZ01DazdYRzRnSUgxY2JpQWdjbVYwZFhKdUlHVTdYRzU5SURwY2JseHVMeThnU1VVZ1BEMGdPRnh1Wm5WdVkzUnBiMjRnUTNWemRHOXRSWFpsYm5RZ0tIUjVjR1VzSUhCaGNtRnRjeWtnZTF4dUlDQjJZWElnWlNBOUlHUnZZM1Z0Wlc1MExtTnlaV0YwWlVWMlpXNTBUMkpxWldOMEtDazdYRzRnSUdVdWRIbHdaU0E5SUhSNWNHVTdYRzRnSUdsbUlDaHdZWEpoYlhNcElIdGNiaUFnSUNCbExtSjFZbUpzWlhNZ1BTQkNiMjlzWldGdUtIQmhjbUZ0Y3k1aWRXSmliR1Z6S1R0Y2JpQWdJQ0JsTG1OaGJtTmxiR0ZpYkdVZ1BTQkNiMjlzWldGdUtIQmhjbUZ0Y3k1allXNWpaV3hoWW14bEtUdGNiaUFnSUNCbExtUmxkR0ZwYkNBOUlIQmhjbUZ0Y3k1a1pYUmhhV3c3WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnWlM1aWRXSmliR1Z6SUQwZ1ptRnNjMlU3WEc0Z0lDQWdaUzVqWVc1alpXeGhZbXhsSUQwZ1ptRnNjMlU3WEc0Z0lDQWdaUzVrWlhSaGFXd2dQU0IyYjJsa0lEQTdYRzRnSUgxY2JpQWdjbVYwZFhKdUlHVTdYRzU5WEc0aVhYMD0iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGZ1enp5c2VhcmNoIChuZWVkbGUsIGhheXN0YWNrKSB7XG4gIHZhciB0bGVuID0gaGF5c3RhY2subGVuZ3RoO1xuICB2YXIgcWxlbiA9IG5lZWRsZS5sZW5ndGg7XG4gIGlmIChxbGVuID4gdGxlbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocWxlbiA9PT0gdGxlbikge1xuICAgIHJldHVybiBuZWVkbGUgPT09IGhheXN0YWNrO1xuICB9XG4gIG91dGVyOiBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBxbGVuOyBpKyspIHtcbiAgICB2YXIgbmNoID0gbmVlZGxlLmNoYXJDb2RlQXQoaSk7XG4gICAgd2hpbGUgKGogPCB0bGVuKSB7XG4gICAgICBpZiAoaGF5c3RhY2suY2hhckNvZGVBdChqKyspID09PSBuY2gpIHtcbiAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdXp6eXNlYXJjaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcGFkIChoYXNoLCBsZW4pIHtcbiAgd2hpbGUgKGhhc2gubGVuZ3RoIDwgbGVuKSB7XG4gICAgaGFzaCA9ICcwJyArIGhhc2g7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvbGQgKGhhc2gsIHRleHQpIHtcbiAgdmFyIGk7XG4gIHZhciBjaHI7XG4gIHZhciBsZW47XG4gIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBoYXNoO1xuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRleHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjaHIgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hyO1xuICAgIGhhc2ggfD0gMDtcbiAgfVxuICByZXR1cm4gaGFzaCA8IDAgPyBoYXNoICogLTIgOiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb2xkT2JqZWN0IChoYXNoLCBvLCBzZWVuKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvKS5zb3J0KCkucmVkdWNlKGZvbGRLZXksIGhhc2gpO1xuICBmdW5jdGlvbiBmb2xkS2V5IChoYXNoLCBrZXkpIHtcbiAgICByZXR1cm4gZm9sZFZhbHVlKGhhc2gsIG9ba2V5XSwga2V5LCBzZWVuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb2xkVmFsdWUgKGlucHV0LCB2YWx1ZSwga2V5LCBzZWVuKSB7XG4gIHZhciBoYXNoID0gZm9sZChmb2xkKGZvbGQoaW5wdXQsIGtleSksIHRvU3RyaW5nKHZhbHVlKSksIHR5cGVvZiB2YWx1ZSk7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmb2xkKGhhc2gsICdudWxsJyk7XG4gIH1cbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm9sZChoYXNoLCAndW5kZWZpbmVkJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBmb2xkKGhhc2gsICdbQ2lyY3VsYXJdJyArIGtleSk7XG4gICAgfVxuICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIGZvbGRPYmplY3QoaGFzaCwgdmFsdWUsIHNlZW4pO1xuICB9XG4gIHJldHVybiBmb2xkKGhhc2gsIHZhbHVlLnRvU3RyaW5nKCkpO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZyAobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBzdW0gKG8pIHtcbiAgcmV0dXJuIHBhZChmb2xkVmFsdWUoMCwgbywgJycsIFtdKS50b1N0cmluZygxNiksIDgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1bTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBub3cgPSByZXF1aXJlKCcuL25vdycpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb25cbiAqIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50IGNhbGxzXG4gKiB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXMgaW52b2tlZFxuICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGxhc3RJbnZva2VUaW1lID0gMDtcbiAgICBsYXN0QXJncyA9IGxhc3RDYWxsVGltZSA9IGxhc3RUaGlzID0gdGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHJldHVybiB0aW1lcklkID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiB0cmFpbGluZ0VkZ2Uobm93KCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCksXG4gICAgICAgIGlzSW52b2tpbmcgPSBzaG91bGRJbnZva2UodGltZSk7XG5cbiAgICBsYXN0QXJncyA9IGFyZ3VtZW50cztcbiAgICBsYXN0VGhpcyA9IHRoaXM7XG4gICAgbGFzdENhbGxUaW1lID0gdGltZTtcblxuICAgIGlmIChpc0ludm9raW5nKSB7XG4gICAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBsZWFkaW5nRWRnZShsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgICAgaWYgKG1heGluZykge1xuICAgICAgICAvLyBIYW5kbGUgaW52b2NhdGlvbnMgaW4gYSB0aWdodCBsb29wLlxuICAgICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgICAgICByZXR1cm4gaW52b2tlRnVuYyhsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIGRlYm91bmNlZC5mbHVzaCA9IGZsdXNoO1xuICByZXR1cm4gZGVib3VuY2VkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBhbmQgd2VhayBtYXAgY29uc3RydWN0b3JzLFxuICAvLyBhbmQgUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsIi8qKlxuICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlXG4gKiB0aGUgVW5peCBlcG9jaCAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDIuNC4wXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXN0YW1wLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IExvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGludm9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIG5vdygpIHtcbiAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IGlzRnVuY3Rpb24odmFsdWUudmFsdWVPZikgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXhwYW5kbyA9ICdzZWt0b3ItJyArIERhdGUubm93KCk7XG52YXIgcnNpYmxpbmdzID0gL1srfl0vO1xudmFyIGRvY3VtZW50ID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGRlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB7fTtcbnZhciBtYXRjaCA9IChcbiAgZGVsLm1hdGNoZXMgfHxcbiAgZGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICBkZWwubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5vTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tc01hdGNoZXNTZWxlY3RvciB8fFxuICBuZXZlclxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWt0b3I7XG5cbnNla3Rvci5tYXRjaGVzID0gbWF0Y2hlcztcbnNla3Rvci5tYXRjaGVzU2VsZWN0b3IgPSBtYXRjaGVzU2VsZWN0b3I7XG5cbmZ1bmN0aW9uIHFzYSAoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyIGV4aXN0ZWQsIGlkLCBwcmVmaXgsIHByZWZpeGVkLCBhZGFwdGVyLCBoYWNrID0gY29udGV4dCAhPT0gZG9jdW1lbnQ7XG4gIGlmIChoYWNrKSB7IC8vIGlkIGhhY2sgZm9yIGNvbnRleHQtcm9vdGVkIHF1ZXJpZXNcbiAgICBleGlzdGVkID0gY29udGV4dC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgaWQgPSBleGlzdGVkIHx8IGV4cGFuZG87XG4gICAgcHJlZml4ID0gJyMnICsgaWQgKyAnICc7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXggKyBzZWxlY3Rvci5yZXBsYWNlKC8sL2csICcsJyArIHByZWZpeCk7XG4gICAgYWRhcHRlciA9IHJzaWJsaW5ncy50ZXN0KHNlbGVjdG9yKSAmJiBjb250ZXh0LnBhcmVudE5vZGU7XG4gICAgaWYgKCFleGlzdGVkKSB7IGNvbnRleHQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTsgfVxuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIChhZGFwdGVyIHx8IGNvbnRleHQpLnF1ZXJ5U2VsZWN0b3JBbGwocHJlZml4ZWQgfHwgc2VsZWN0b3IpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChleGlzdGVkID09PSBudWxsKSB7IGNvbnRleHQucmVtb3ZlQXR0cmlidXRlKCdpZCcpOyB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VrdG9yIChzZWxlY3RvciwgY3R4LCBjb2xsZWN0aW9uLCBzZWVkKSB7XG4gIHZhciBlbGVtZW50O1xuICB2YXIgY29udGV4dCA9IGN0eCB8fCBkb2N1bWVudDtcbiAgdmFyIHJlc3VsdHMgPSBjb2xsZWN0aW9uIHx8IFtdO1xuICB2YXIgaSA9IDA7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgaWYgKGNvbnRleHQubm9kZVR5cGUgIT09IDEgJiYgY29udGV4dC5ub2RlVHlwZSAhPT0gOSkge1xuICAgIHJldHVybiBbXTsgLy8gYmFpbCBpZiBjb250ZXh0IGlzIG5vdCBhbiBlbGVtZW50IG9yIGRvY3VtZW50XG4gIH1cbiAgaWYgKHNlZWQpIHtcbiAgICB3aGlsZSAoKGVsZW1lbnQgPSBzZWVkW2krK10pKSB7XG4gICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBxc2Eoc2VsZWN0b3IsIGNvbnRleHQpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuZnVuY3Rpb24gbWF0Y2hlcyAoc2VsZWN0b3IsIGVsZW1lbnRzKSB7XG4gIHJldHVybiBzZWt0b3Ioc2VsZWN0b3IsIG51bGwsIG51bGwsIGVsZW1lbnRzKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yIChlbGVtZW50LCBzZWxlY3Rvcikge1xuICByZXR1cm4gbWF0Y2guY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIG5ldmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXpaV3QwYjNJdmMzSmpMM05sYTNSdmNpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJbmRYTmxJSE4wY21samRDYzdYRzVjYm5aaGNpQmxlSEJoYm1SdklEMGdKM05sYTNSdmNpMG5JQ3NnUkdGMFpTNXViM2NvS1R0Y2JuWmhjaUJ5YzJsaWJHbHVaM01nUFNBdld5dCtYUzg3WEc1MllYSWdaRzlqZFcxbGJuUWdQU0JuYkc5aVlXd3VaRzlqZFcxbGJuUTdYRzUyWVhJZ1pHVnNJRDBnWkc5amRXMWxiblF1Wkc5amRXMWxiblJGYkdWdFpXNTBJSHg4SUh0OU8xeHVkbUZ5SUcxaGRHTm9JRDBnS0Z4dUlDQmtaV3d1YldGMFkyaGxjeUI4ZkZ4dUlDQmtaV3d1ZDJWaWEybDBUV0YwWTJobGMxTmxiR1ZqZEc5eUlIeDhYRzRnSUdSbGJDNXRiM3BOWVhSamFHVnpVMlZzWldOMGIzSWdmSHhjYmlBZ1pHVnNMbTlOWVhSamFHVnpVMlZzWldOMGIzSWdmSHhjYmlBZ1pHVnNMbTF6VFdGMFkyaGxjMU5sYkdWamRHOXlJSHg4WEc0Z0lHNWxkbVZ5WEc0cE8xeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJSE5sYTNSdmNqdGNibHh1YzJWcmRHOXlMbTFoZEdOb1pYTWdQU0J0WVhSamFHVnpPMXh1YzJWcmRHOXlMbTFoZEdOb1pYTlRaV3hsWTNSdmNpQTlJRzFoZEdOb1pYTlRaV3hsWTNSdmNqdGNibHh1Wm5WdVkzUnBiMjRnY1hOaElDaHpaV3hsWTNSdmNpd2dZMjl1ZEdWNGRDa2dlMXh1SUNCMllYSWdaWGhwYzNSbFpDd2dhV1FzSUhCeVpXWnBlQ3dnY0hKbFptbDRaV1FzSUdGa1lYQjBaWElzSUdoaFkyc2dQU0JqYjI1MFpYaDBJQ0U5UFNCa2IyTjFiV1Z1ZER0Y2JpQWdhV1lnS0doaFkyc3BJSHNnTHk4Z2FXUWdhR0ZqYXlCbWIzSWdZMjl1ZEdWNGRDMXliMjkwWldRZ2NYVmxjbWxsYzF4dUlDQWdJR1Y0YVhOMFpXUWdQU0JqYjI1MFpYaDBMbWRsZEVGMGRISnBZblYwWlNnbmFXUW5LVHRjYmlBZ0lDQnBaQ0E5SUdWNGFYTjBaV1FnZkh3Z1pYaHdZVzVrYnp0Y2JpQWdJQ0J3Y21WbWFYZ2dQU0FuSXljZ0t5QnBaQ0FySUNjZ0p6dGNiaUFnSUNCd2NtVm1hWGhsWkNBOUlIQnlaV1pwZUNBcklITmxiR1ZqZEc5eUxuSmxjR3hoWTJVb0x5d3ZaeXdnSnl3bklDc2djSEpsWm1sNEtUdGNiaUFnSUNCaFpHRndkR1Z5SUQwZ2NuTnBZbXhwYm1kekxuUmxjM1FvYzJWc1pXTjBiM0lwSUNZbUlHTnZiblJsZUhRdWNHRnlaVzUwVG05a1pUdGNiaUFnSUNCcFppQW9JV1Y0YVhOMFpXUXBJSHNnWTI5dWRHVjRkQzV6WlhSQmRIUnlhV0oxZEdVb0oybGtKeXdnYVdRcE95QjlYRzRnSUgxY2JpQWdkSEo1SUh0Y2JpQWdJQ0J5WlhSMWNtNGdLR0ZrWVhCMFpYSWdmSHdnWTI5dWRHVjRkQ2t1Y1hWbGNubFRaV3hsWTNSdmNrRnNiQ2h3Y21WbWFYaGxaQ0I4ZkNCelpXeGxZM1J2Y2lrN1hHNGdJSDBnWTJGMFkyZ2dLR1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdXMTA3WEc0Z0lIMGdabWx1WVd4c2VTQjdYRzRnSUNBZ2FXWWdLR1Y0YVhOMFpXUWdQVDA5SUc1MWJHd3BJSHNnWTI5dWRHVjRkQzV5WlcxdmRtVkJkSFJ5YVdKMWRHVW9KMmxrSnlrN0lIMWNiaUFnZlZ4dWZWeHVYRzVtZFc1amRHbHZiaUJ6Wld0MGIzSWdLSE5sYkdWamRHOXlMQ0JqZEhnc0lHTnZiR3hsWTNScGIyNHNJSE5sWldRcElIdGNiaUFnZG1GeUlHVnNaVzFsYm5RN1hHNGdJSFpoY2lCamIyNTBaWGgwSUQwZ1kzUjRJSHg4SUdSdlkzVnRaVzUwTzF4dUlDQjJZWElnY21WemRXeDBjeUE5SUdOdmJHeGxZM1JwYjI0Z2ZId2dXMTA3WEc0Z0lIWmhjaUJwSUQwZ01EdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCelpXeGxZM1J2Y2lBaFBUMGdKM04wY21sdVp5Y3BJSHRjYmlBZ0lDQnlaWFIxY200Z2NtVnpkV3gwY3p0Y2JpQWdmVnh1SUNCcFppQW9ZMjl1ZEdWNGRDNXViMlJsVkhsd1pTQWhQVDBnTVNBbUppQmpiMjUwWlhoMExtNXZaR1ZVZVhCbElDRTlQU0E1S1NCN1hHNGdJQ0FnY21WMGRYSnVJRnRkT3lBdkx5QmlZV2xzSUdsbUlHTnZiblJsZUhRZ2FYTWdibTkwSUdGdUlHVnNaVzFsYm5RZ2IzSWdaRzlqZFcxbGJuUmNiaUFnZlZ4dUlDQnBaaUFvYzJWbFpDa2dlMXh1SUNBZ0lIZG9hV3hsSUNnb1pXeGxiV1Z1ZENBOUlITmxaV1JiYVNzclhTa3BJSHRjYmlBZ0lDQWdJR2xtSUNodFlYUmphR1Z6VTJWc1pXTjBiM0lvWld4bGJXVnVkQ3dnYzJWc1pXTjBiM0lwS1NCN1hHNGdJQ0FnSUNBZ0lISmxjM1ZzZEhNdWNIVnphQ2hsYkdWdFpXNTBLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdjbVZ6ZFd4MGN5NXdkWE5vTG1Gd2NHeDVLSEpsYzNWc2RITXNJSEZ6WVNoelpXeGxZM1J2Y2l3Z1kyOXVkR1Y0ZENrcE8xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFJ6TzF4dWZWeHVYRzVtZFc1amRHbHZiaUJ0WVhSamFHVnpJQ2h6Wld4bFkzUnZjaXdnWld4bGJXVnVkSE1wSUh0Y2JpQWdjbVYwZFhKdUlITmxhM1J2Y2loelpXeGxZM1J2Y2l3Z2JuVnNiQ3dnYm5Wc2JDd2daV3hsYldWdWRITXBPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnRZWFJqYUdWelUyVnNaV04wYjNJZ0tHVnNaVzFsYm5Rc0lITmxiR1ZqZEc5eUtTQjdYRzRnSUhKbGRIVnliaUJ0WVhSamFDNWpZV3hzS0dWc1pXMWxiblFzSUhObGJHVmpkRzl5S1R0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnYm1WMlpYSWdLQ2tnZXlCeVpYUjFjbTRnWm1Gc2MyVTdJSDFjYmlKZGZRPT0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb247XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGdldFNlbGVjdGlvblJhdyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uUmF3Jyk7XG52YXIgZ2V0U2VsZWN0aW9uTnVsbE9wID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25OdWxsT3AnKTtcbnZhciBnZXRTZWxlY3Rpb25TeW50aGV0aWMgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblN5bnRoZXRpYycpO1xudmFyIGlzSG9zdCA9IHJlcXVpcmUoJy4vaXNIb3N0Jyk7XG5pZiAoaXNIb3N0Lm1ldGhvZChnbG9iYWwsICdnZXRTZWxlY3Rpb24nKSkge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25SYXc7XG59IGVsc2UgaWYgKHR5cGVvZiBkb2Muc2VsZWN0aW9uID09PSAnb2JqZWN0JyAmJiBkb2Muc2VsZWN0aW9uKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblN5bnRoZXRpYztcbn0gZWxzZSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbk51bGxPcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXpaV3hsWTJOcGIyNHZjM0pqTDJkbGRGTmxiR1ZqZEdsdmJpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJbmRYTmxJSE4wY21samRDYzdYRzVjYm5aaGNpQm5aWFJUWld4bFkzUnBiMjQ3WEc1MllYSWdaRzlqSUQwZ1oyeHZZbUZzTG1SdlkzVnRaVzUwTzF4dWRtRnlJR2RsZEZObGJHVmpkR2x2YmxKaGR5QTlJSEpsY1hWcGNtVW9KeTR2WjJWMFUyVnNaV04wYVc5dVVtRjNKeWs3WEc1MllYSWdaMlYwVTJWc1pXTjBhVzl1VG5Wc2JFOXdJRDBnY21WeGRXbHlaU2duTGk5blpYUlRaV3hsWTNScGIyNU9kV3hzVDNBbktUdGNiblpoY2lCblpYUlRaV3hsWTNScGIyNVRlVzUwYUdWMGFXTWdQU0J5WlhGMWFYSmxLQ2N1TDJkbGRGTmxiR1ZqZEdsdmJsTjViblJvWlhScFl5Y3BPMXh1ZG1GeUlHbHpTRzl6ZENBOUlISmxjWFZwY21Vb0p5NHZhWE5JYjNOMEp5azdYRzVwWmlBb2FYTkliM04wTG0xbGRHaHZaQ2huYkc5aVlXd3NJQ2RuWlhSVFpXeGxZM1JwYjI0bktTa2dlMXh1SUNCblpYUlRaV3hsWTNScGIyNGdQU0JuWlhSVFpXeGxZM1JwYjI1U1lYYzdYRzU5SUdWc2MyVWdhV1lnS0hSNWNHVnZaaUJrYjJNdWMyVnNaV04wYVc5dUlEMDlQU0FuYjJKcVpXTjBKeUFtSmlCa2IyTXVjMlZzWldOMGFXOXVLU0I3WEc0Z0lHZGxkRk5sYkdWamRHbHZiaUE5SUdkbGRGTmxiR1ZqZEdsdmJsTjViblJvWlhScFl6dGNibjBnWld4elpTQjdYRzRnSUdkbGRGTmxiR1ZqZEdsdmJpQTlJR2RsZEZObGJHVmpkR2x2Yms1MWJHeFBjRHRjYm4xY2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQm5aWFJUWld4bFkzUnBiMjQ3WEc0aVhYMD0iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uTnVsbE9wICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZW1vdmVBbGxSYW5nZXM6IG5vb3AsXG4gICAgYWRkUmFuZ2U6IG5vb3BcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb25OdWxsT3A7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvblJhdyAoKSB7XG4gIHJldHVybiBnbG9iYWwuZ2V0U2VsZWN0aW9uKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uUmF3O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl6Wld4bFkyTnBiMjR2YzNKakwyZGxkRk5sYkdWamRHbHZibEpoZHk1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU0lzSW1acGJHVWlPaUpuWlc1bGNtRjBaV1F1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaUozVnpaU0J6ZEhKcFkzUW5PMXh1WEc1bWRXNWpkR2x2YmlCblpYUlRaV3hsWTNScGIyNVNZWGNnS0NrZ2UxeHVJQ0J5WlhSMWNtNGdaMnh2WW1Gc0xtZGxkRk5sYkdWamRHbHZiaWdwTzF4dWZWeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJR2RsZEZObGJHVmpkR2x2YmxKaGR6dGNiaUpkZlE9PSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHJhbmdlVG9UZXh0UmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlVG9UZXh0UmFuZ2UnKTtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xudmFyIEdldFNlbGVjdGlvblByb3RvID0gR2V0U2VsZWN0aW9uLnByb3RvdHlwZTtcblxuZnVuY3Rpb24gR2V0U2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcblxuICB0aGlzLl9zZWxlY3Rpb24gPSBzZWxlY3Rpb247XG4gIHRoaXMuX3JhbmdlcyA9IFtdO1xuXG4gIGlmIChzZWxlY3Rpb24udHlwZSA9PT0gJ0NvbnRyb2wnKSB7XG4gICAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWxmKTtcbiAgfSBlbHNlIGlmIChpc1RleHRSYW5nZShyYW5nZSkpIHtcbiAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbGYsIHJhbmdlKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWxmKTtcbiAgfVxufVxuXG5HZXRTZWxlY3Rpb25Qcm90by5yZW1vdmVBbGxSYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0ZXh0UmFuZ2U7XG4gIHRyeSB7XG4gICAgdGhpcy5fc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnTm9uZScpIHtcbiAgICAgIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gICAgICB0ZXh0UmFuZ2Uuc2VsZWN0KCk7XG4gICAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgfVxuICB1cGRhdGVFbXB0eVNlbGVjdGlvbih0aGlzKTtcbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmFkZFJhbmdlID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIGlmICh0aGlzLl9zZWxlY3Rpb24udHlwZSA9PT0gJ0NvbnRyb2wnKSB7XG4gICAgYWRkUmFuZ2VUb0NvbnRyb2xTZWxlY3Rpb24odGhpcywgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlVG9UZXh0UmFuZ2UocmFuZ2UpLnNlbGVjdCgpO1xuICAgIHRoaXMuX3Jhbmdlc1swXSA9IHJhbmdlO1xuICAgIHRoaXMucmFuZ2VDb3VudCA9IDE7XG4gICAgdGhpcy5pc0NvbGxhcHNlZCA9IHRoaXMuX3Jhbmdlc1swXS5jb2xsYXBzZWQ7XG4gICAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UodGhpcywgcmFuZ2UsIGZhbHNlKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uc2V0UmFuZ2VzID0gZnVuY3Rpb24gKHJhbmdlcykge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB2YXIgcmFuZ2VDb3VudCA9IHJhbmdlcy5sZW5ndGg7XG4gIGlmIChyYW5nZUNvdW50ID4gMSkge1xuICAgIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24odGhpcywgcmFuZ2VzKTtcbiAgfSBlbHNlIGlmIChyYW5nZUNvdW50KSB7XG4gICAgdGhpcy5hZGRSYW5nZShyYW5nZXNbMF0pO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5nZXRSYW5nZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5yYW5nZUNvdW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRSYW5nZUF0KCk6IGluZGV4IG91dCBvZiBib3VuZHMnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5fcmFuZ2VzW2luZGV4XS5jbG9uZVJhbmdlKCk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZVJhbmdlID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIGlmICh0aGlzLl9zZWxlY3Rpb24udHlwZSAhPT0gJ0NvbnRyb2wnKSB7XG4gICAgcmVtb3ZlUmFuZ2VNYW51YWxseSh0aGlzLCByYW5nZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjb250cm9sUmFuZ2UgPSB0aGlzLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgdmFyIGVsO1xuICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29udHJvbFJhbmdlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgZWwgPSBjb250cm9sUmFuZ2UuaXRlbShpKTtcbiAgICBpZiAoZWwgIT09IHJhbmdlRWxlbWVudCB8fCByZW1vdmVkKSB7XG4gICAgICBuZXdDb250cm9sUmFuZ2UuYWRkKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzKTtcbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmVhY2hSYW5nZSA9IGZ1bmN0aW9uIChmbiwgcmV0dXJuVmFsdWUpIHtcbiAgdmFyIGkgPSAwO1xuICB2YXIgbGVuID0gdGhpcy5fcmFuZ2VzLmxlbmd0aDtcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGZuKHRoaXMuZ2V0UmFuZ2VBdChpKSkpIHtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldEFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhbmdlcyA9IFtdO1xuICB0aGlzLmVhY2hSYW5nZShmdW5jdGlvbiAocmFuZ2UpIHtcbiAgICByYW5nZXMucHVzaChyYW5nZSk7XG4gIH0pO1xuICByZXR1cm4gcmFuZ2VzO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uc2V0U2luZ2xlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgdGhpcy5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgdGhpcy5hZGRSYW5nZShyYW5nZSk7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVDb250cm9sU2VsZWN0aW9uIChzZWwsIHJhbmdlcykge1xuICB2YXIgY29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGVsLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB0cnkge1xuICAgICAgY29udHJvbFJhbmdlLmFkZChlbCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZXRSYW5nZXMoKTogRWxlbWVudCBjb3VsZCBub3QgYmUgYWRkZWQgdG8gY29udHJvbCBzZWxlY3Rpb24nKTtcbiAgICB9XG4gIH1cbiAgY29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJhbmdlTWFudWFsbHkgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIHJhbmdlcyA9IHNlbC5nZXRBbGxSYW5nZXMoKTtcbiAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gcmFuZ2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKCFpc1NhbWVSYW5nZShyYW5nZSwgcmFuZ2VzW2ldKSkge1xuICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlc1tpXSk7XG4gICAgfVxuICB9XG4gIGlmICghc2VsLnJhbmdlQ291bnQpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHZhciBhbmNob3JQcmVmaXggPSAnc3RhcnQnO1xuICB2YXIgZm9jdXNQcmVmaXggPSAnZW5kJztcbiAgc2VsLmFuY2hvck5vZGUgPSByYW5nZVthbmNob3JQcmVmaXggKyAnQ29udGFpbmVyJ107XG4gIHNlbC5hbmNob3JPZmZzZXQgPSByYW5nZVthbmNob3JQcmVmaXggKyAnT2Zmc2V0J107XG4gIHNlbC5mb2N1c05vZGUgPSByYW5nZVtmb2N1c1ByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmZvY3VzT2Zmc2V0ID0gcmFuZ2VbZm9jdXNQcmVmaXggKyAnT2Zmc2V0J107XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUVtcHR5U2VsZWN0aW9uIChzZWwpIHtcbiAgc2VsLmFuY2hvck5vZGUgPSBzZWwuZm9jdXNOb2RlID0gbnVsbDtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHNlbC5mb2N1c09mZnNldCA9IDA7XG4gIHNlbC5yYW5nZUNvdW50ID0gMDtcbiAgc2VsLmlzQ29sbGFwc2VkID0gdHJ1ZTtcbiAgc2VsLl9yYW5nZXMubGVuZ3RoID0gMDtcbn1cblxuZnVuY3Rpb24gcmFuZ2VDb250YWluc1NpbmdsZUVsZW1lbnQgKHJhbmdlTm9kZXMpIHtcbiAgaWYgKCFyYW5nZU5vZGVzLmxlbmd0aCB8fCByYW5nZU5vZGVzWzBdLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSByYW5nZU5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKCFpc0FuY2VzdG9yT2YocmFuZ2VOb2Rlc1swXSwgcmFuZ2VOb2Rlc1tpXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UgKHJhbmdlKSB7XG4gIHZhciBub2RlcyA9IHJhbmdlLmdldE5vZGVzKCk7XG4gIGlmICghcmFuZ2VDb250YWluc1NpbmdsZUVsZW1lbnQobm9kZXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKCk6IHJhbmdlIGRpZCBub3QgY29uc2lzdCBvZiBhIHNpbmdsZSBlbGVtZW50Jyk7XG4gIH1cbiAgcmV0dXJuIG5vZGVzWzBdO1xufVxuXG5mdW5jdGlvbiBpc1RleHRSYW5nZSAocmFuZ2UpIHtcbiAgcmV0dXJuIHJhbmdlICYmIHJhbmdlLnRleHQgIT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRnJvbVRleHRSYW5nZSAoc2VsLCByYW5nZSkge1xuICBzZWwuX3JhbmdlcyA9IFtyYW5nZV07XG4gIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgcmFuZ2UsIGZhbHNlKTtcbiAgc2VsLnJhbmdlQ291bnQgPSAxO1xuICBzZWwuaXNDb2xsYXBzZWQgPSByYW5nZS5jb2xsYXBzZWQ7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xuICBpZiAoc2VsLl9zZWxlY3Rpb24udHlwZSA9PT0gJ05vbmUnKSB7XG4gICAgdXBkYXRlRW1wdHlTZWxlY3Rpb24oc2VsKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgICBpZiAoaXNUZXh0UmFuZ2UoY29udHJvbFJhbmdlKSkge1xuICAgICAgdXBkYXRlRnJvbVRleHRSYW5nZShzZWwsIGNvbnRyb2xSYW5nZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbC5yYW5nZUNvdW50ID0gY29udHJvbFJhbmdlLmxlbmd0aDtcbiAgICAgIHZhciByYW5nZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsLnJhbmdlQ291bnQ7ICsraSkge1xuICAgICAgICByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgICAgICByYW5nZS5zZWxlY3ROb2RlKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgICAgICAgc2VsLl9yYW5nZXMucHVzaChyYW5nZSk7XG4gICAgICB9XG4gICAgICBzZWwuaXNDb2xsYXBzZWQgPSBzZWwucmFuZ2VDb3VudCA9PT0gMSAmJiBzZWwuX3Jhbmdlc1swXS5jb2xsYXBzZWQ7XG4gICAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZShzZWwsIHNlbC5fcmFuZ2VzW3NlbC5yYW5nZUNvdW50IC0gMV0sIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkUmFuZ2VUb0NvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHNlbC5fc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciByYW5nZUVsZW1lbnQgPSBnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKHJhbmdlKTtcbiAgdmFyIG5ld0NvbnRyb2xSYW5nZSA9IGJvZHkuY3JlYXRlQ29udHJvbFJhbmdlKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBuZXdDb250cm9sUmFuZ2UuYWRkKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgfVxuICB0cnkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQocmFuZ2VFbGVtZW50KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkUmFuZ2UoKTogRWxlbWVudCBjb3VsZCBub3QgYmUgYWRkZWQgdG8gY29udHJvbCBzZWxlY3Rpb24nKTtcbiAgfVxuICBuZXdDb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lUmFuZ2UgKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiAoXG4gICAgbGVmdC5zdGFydENvbnRhaW5lciA9PT0gcmlnaHQuc3RhcnRDb250YWluZXIgJiZcbiAgICBsZWZ0LnN0YXJ0T2Zmc2V0ID09PSByaWdodC5zdGFydE9mZnNldCAmJlxuICAgIGxlZnQuZW5kQ29udGFpbmVyID09PSByaWdodC5lbmRDb250YWluZXIgJiZcbiAgICBsZWZ0LmVuZE9mZnNldCA9PT0gcmlnaHQuZW5kT2Zmc2V0XG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzQW5jZXN0b3JPZiAoYW5jZXN0b3IsIGRlc2NlbmRhbnQpIHtcbiAgdmFyIG5vZGUgPSBkZXNjZW5kYW50O1xuICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSA9PT0gYW5jZXN0b3IpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBHZXRTZWxlY3Rpb24oZ2xvYmFsLmRvY3VtZW50LnNlbGVjdGlvbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl6Wld4bFkyTnBiMjR2YzNKakwyZGxkRk5sYkdWamRHbHZibE41Ym5Sb1pYUnBZeTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpSjNWelpTQnpkSEpwWTNRbk8xeHVYRzUyWVhJZ2NtRnVaMlZVYjFSbGVIUlNZVzVuWlNBOUlISmxjWFZwY21Vb0p5NHZjbUZ1WjJWVWIxUmxlSFJTWVc1blpTY3BPMXh1ZG1GeUlHUnZZeUE5SUdkc2IySmhiQzVrYjJOMWJXVnVkRHRjYm5aaGNpQmliMlI1SUQwZ1pHOWpMbUp2WkhrN1hHNTJZWElnUjJWMFUyVnNaV04wYVc5dVVISnZkRzhnUFNCSFpYUlRaV3hsWTNScGIyNHVjSEp2ZEc5MGVYQmxPMXh1WEc1bWRXNWpkR2x2YmlCSFpYUlRaV3hsWTNScGIyNGdLSE5sYkdWamRHbHZiaWtnZTF4dUlDQjJZWElnYzJWc1ppQTlJSFJvYVhNN1hHNGdJSFpoY2lCeVlXNW5aU0E5SUhObGJHVmpkR2x2Ymk1amNtVmhkR1ZTWVc1blpTZ3BPMXh1WEc0Z0lIUm9hWE11WDNObGJHVmpkR2x2YmlBOUlITmxiR1ZqZEdsdmJqdGNiaUFnZEdocGN5NWZjbUZ1WjJWeklEMGdXMTA3WEc1Y2JpQWdhV1lnS0hObGJHVmpkR2x2Ymk1MGVYQmxJRDA5UFNBblEyOXVkSEp2YkNjcElIdGNiaUFnSUNCMWNHUmhkR1ZEYjI1MGNtOXNVMlZzWldOMGFXOXVLSE5sYkdZcE8xeHVJQ0I5SUdWc2MyVWdhV1lnS0dselZHVjRkRkpoYm1kbEtISmhibWRsS1NrZ2UxeHVJQ0FnSUhWd1pHRjBaVVp5YjIxVVpYaDBVbUZ1WjJVb2MyVnNaaXdnY21GdVoyVXBPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJSFZ3WkdGMFpVVnRjSFI1VTJWc1pXTjBhVzl1S0hObGJHWXBPMXh1SUNCOVhHNTlYRzVjYmtkbGRGTmxiR1ZqZEdsdmJsQnliM1J2TG5KbGJXOTJaVUZzYkZKaGJtZGxjeUE5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnZG1GeUlIUmxlSFJTWVc1blpUdGNiaUFnZEhKNUlIdGNiaUFnSUNCMGFHbHpMbDl6Wld4bFkzUnBiMjR1Wlcxd2RIa29LVHRjYmlBZ0lDQnBaaUFvZEdocGN5NWZjMlZzWldOMGFXOXVMblI1Y0dVZ0lUMDlJQ2RPYjI1bEp5a2dlMXh1SUNBZ0lDQWdkR1Y0ZEZKaGJtZGxJRDBnWW05a2VTNWpjbVZoZEdWVVpYaDBVbUZ1WjJVb0tUdGNiaUFnSUNBZ0lIUmxlSFJTWVc1blpTNXpaV3hsWTNRb0tUdGNiaUFnSUNBZ0lIUm9hWE11WDNObGJHVmpkR2x2Ymk1bGJYQjBlU2dwTzF4dUlDQWdJSDFjYmlBZ2ZTQmpZWFJqYUNBb1pTa2dlMXh1SUNCOVhHNGdJSFZ3WkdGMFpVVnRjSFI1VTJWc1pXTjBhVzl1S0hSb2FYTXBPMXh1ZlR0Y2JseHVSMlYwVTJWc1pXTjBhVzl1VUhKdmRHOHVZV1JrVW1GdVoyVWdQU0JtZFc1amRHbHZiaUFvY21GdVoyVXBJSHRjYmlBZ2FXWWdLSFJvYVhNdVgzTmxiR1ZqZEdsdmJpNTBlWEJsSUQwOVBTQW5RMjl1ZEhKdmJDY3BJSHRjYmlBZ0lDQmhaR1JTWVc1blpWUnZRMjl1ZEhKdmJGTmxiR1ZqZEdsdmJpaDBhR2x6TENCeVlXNW5aU2s3WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnY21GdVoyVlViMVJsZUhSU1lXNW5aU2h5WVc1blpTa3VjMlZzWldOMEtDazdYRzRnSUNBZ2RHaHBjeTVmY21GdVoyVnpXekJkSUQwZ2NtRnVaMlU3WEc0Z0lDQWdkR2hwY3k1eVlXNW5aVU52ZFc1MElEMGdNVHRjYmlBZ0lDQjBhR2x6TG1selEyOXNiR0Z3YzJWa0lEMGdkR2hwY3k1ZmNtRnVaMlZ6V3pCZExtTnZiR3hoY0hObFpEdGNiaUFnSUNCMWNHUmhkR1ZCYm1Ob2IzSkJibVJHYjJOMWMwWnliMjFTWVc1blpTaDBhR2x6TENCeVlXNW5aU3dnWm1Gc2MyVXBPMXh1SUNCOVhHNTlPMXh1WEc1SFpYUlRaV3hsWTNScGIyNVFjbTkwYnk1elpYUlNZVzVuWlhNZ1BTQm1kVzVqZEdsdmJpQW9jbUZ1WjJWektTQjdYRzRnSUhSb2FYTXVjbVZ0YjNabFFXeHNVbUZ1WjJWektDazdYRzRnSUhaaGNpQnlZVzVuWlVOdmRXNTBJRDBnY21GdVoyVnpMbXhsYm1kMGFEdGNiaUFnYVdZZ0tISmhibWRsUTI5MWJuUWdQaUF4S1NCN1hHNGdJQ0FnWTNKbFlYUmxRMjl1ZEhKdmJGTmxiR1ZqZEdsdmJpaDBhR2x6TENCeVlXNW5aWE1wTzF4dUlDQjlJR1ZzYzJVZ2FXWWdLSEpoYm1kbFEyOTFiblFwSUh0Y2JpQWdJQ0IwYUdsekxtRmtaRkpoYm1kbEtISmhibWRsYzFzd1hTazdYRzRnSUgxY2JuMDdYRzVjYmtkbGRGTmxiR1ZqZEdsdmJsQnliM1J2TG1kbGRGSmhibWRsUVhRZ1BTQm1kVzVqZEdsdmJpQW9hVzVrWlhncElIdGNiaUFnYVdZZ0tHbHVaR1Y0SUR3Z01DQjhmQ0JwYm1SbGVDQStQU0IwYUdsekxuSmhibWRsUTI5MWJuUXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0oyZGxkRkpoYm1kbFFYUW9LVG9nYVc1a1pYZ2diM1YwSUc5bUlHSnZkVzVrY3ljcE8xeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMbDl5WVc1blpYTmJhVzVrWlhoZExtTnNiMjVsVW1GdVoyVW9LVHRjYmlBZ2ZWeHVmVHRjYmx4dVIyVjBVMlZzWldOMGFXOXVVSEp2ZEc4dWNtVnRiM1psVW1GdVoyVWdQU0JtZFc1amRHbHZiaUFvY21GdVoyVXBJSHRjYmlBZ2FXWWdLSFJvYVhNdVgzTmxiR1ZqZEdsdmJpNTBlWEJsSUNFOVBTQW5RMjl1ZEhKdmJDY3BJSHRjYmlBZ0lDQnlaVzF2ZG1WU1lXNW5aVTFoYm5WaGJHeDVLSFJvYVhNc0lISmhibWRsS1R0Y2JpQWdJQ0J5WlhSMWNtNDdYRzRnSUgxY2JpQWdkbUZ5SUdOdmJuUnliMnhTWVc1blpTQTlJSFJvYVhNdVgzTmxiR1ZqZEdsdmJpNWpjbVZoZEdWU1lXNW5aU2dwTzF4dUlDQjJZWElnY21GdVoyVkZiR1Z0Wlc1MElEMGdaMlYwVTJsdVoyeGxSV3hsYldWdWRFWnliMjFTWVc1blpTaHlZVzVuWlNrN1hHNGdJSFpoY2lCdVpYZERiMjUwY205c1VtRnVaMlVnUFNCaWIyUjVMbU55WldGMFpVTnZiblJ5YjJ4U1lXNW5aU2dwTzF4dUlDQjJZWElnWld3N1hHNGdJSFpoY2lCeVpXMXZkbVZrSUQwZ1ptRnNjMlU3WEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0F3TENCc1pXNGdQU0JqYjI1MGNtOXNVbUZ1WjJVdWJHVnVaM1JvT3lCcElEd2diR1Z1T3lBcksya3BJSHRjYmlBZ0lDQmxiQ0E5SUdOdmJuUnliMnhTWVc1blpTNXBkR1Z0S0drcE8xeHVJQ0FnSUdsbUlDaGxiQ0FoUFQwZ2NtRnVaMlZGYkdWdFpXNTBJSHg4SUhKbGJXOTJaV1FwSUh0Y2JpQWdJQ0FnSUc1bGQwTnZiblJ5YjJ4U1lXNW5aUzVoWkdRb1kyOXVkSEp2YkZKaGJtZGxMbWwwWlcwb2FTa3BPMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCeVpXMXZkbVZrSUQwZ2RISjFaVHRjYmlBZ0lDQjlYRzRnSUgxY2JpQWdibVYzUTI5dWRISnZiRkpoYm1kbExuTmxiR1ZqZENncE8xeHVJQ0IxY0dSaGRHVkRiMjUwY205c1UyVnNaV04wYVc5dUtIUm9hWE1wTzF4dWZUdGNibHh1UjJWMFUyVnNaV04wYVc5dVVISnZkRzh1WldGamFGSmhibWRsSUQwZ1puVnVZM1JwYjI0Z0tHWnVMQ0J5WlhSMWNtNVdZV3gxWlNrZ2UxeHVJQ0IyWVhJZ2FTQTlJREE3WEc0Z0lIWmhjaUJzWlc0Z1BTQjBhR2x6TGw5eVlXNW5aWE11YkdWdVozUm9PMXh1SUNCbWIzSWdLR2tnUFNBd095QnBJRHdnYkdWdU95QXJLMmtwSUh0Y2JpQWdJQ0JwWmlBb1ptNG9kR2hwY3k1blpYUlNZVzVuWlVGMEtHa3BLU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSEpsZEhWeWJsWmhiSFZsTzF4dUlDQWdJSDFjYmlBZ2ZWeHVmVHRjYmx4dVIyVjBVMlZzWldOMGFXOXVVSEp2ZEc4dVoyVjBRV3hzVW1GdVoyVnpJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0IyWVhJZ2NtRnVaMlZ6SUQwZ1cxMDdYRzRnSUhSb2FYTXVaV0ZqYUZKaGJtZGxLR1oxYm1OMGFXOXVJQ2h5WVc1blpTa2dlMXh1SUNBZ0lISmhibWRsY3k1d2RYTm9LSEpoYm1kbEtUdGNiaUFnZlNrN1hHNGdJSEpsZEhWeWJpQnlZVzVuWlhNN1hHNTlPMXh1WEc1SFpYUlRaV3hsWTNScGIyNVFjbTkwYnk1elpYUlRhVzVuYkdWU1lXNW5aU0E5SUdaMWJtTjBhVzl1SUNoeVlXNW5aU2tnZTF4dUlDQjBhR2x6TG5KbGJXOTJaVUZzYkZKaGJtZGxjeWdwTzF4dUlDQjBhR2x6TG1Ga1pGSmhibWRsS0hKaGJtZGxLVHRjYm4wN1hHNWNibVoxYm1OMGFXOXVJR055WldGMFpVTnZiblJ5YjJ4VFpXeGxZM1JwYjI0Z0tITmxiQ3dnY21GdVoyVnpLU0I3WEc0Z0lIWmhjaUJqYjI1MGNtOXNVbUZ1WjJVZ1BTQmliMlI1TG1OeVpXRjBaVU52Ym5SeWIyeFNZVzVuWlNncE8xeHVJQ0JtYjNJZ0tIWmhjaUJwSUQwZ01Dd2daV3dzSUd4bGJpQTlJSEpoYm1kbGN5NXNaVzVuZEdnN0lHa2dQQ0JzWlc0N0lDc3JhU2tnZTF4dUlDQWdJR1ZzSUQwZ1oyVjBVMmx1WjJ4bFJXeGxiV1Z1ZEVaeWIyMVNZVzVuWlNoeVlXNW5aWE5iYVYwcE8xeHVJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQmpiMjUwY205c1VtRnVaMlV1WVdSa0tHVnNLVHRjYmlBZ0lDQjlJR05oZEdOb0lDaGxLU0I3WEc0Z0lDQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KM05sZEZKaGJtZGxjeWdwT2lCRmJHVnRaVzUwSUdOdmRXeGtJRzV2ZENCaVpTQmhaR1JsWkNCMGJ5QmpiMjUwY205c0lITmxiR1ZqZEdsdmJpY3BPMXh1SUNBZ0lIMWNiaUFnZlZ4dUlDQmpiMjUwY205c1VtRnVaMlV1YzJWc1pXTjBLQ2s3WEc0Z0lIVndaR0YwWlVOdmJuUnliMnhUWld4bFkzUnBiMjRvYzJWc0tUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2NtVnRiM1psVW1GdVoyVk5ZVzUxWVd4c2VTQW9jMlZzTENCeVlXNW5aU2tnZTF4dUlDQjJZWElnY21GdVoyVnpJRDBnYzJWc0xtZGxkRUZzYkZKaGJtZGxjeWdwTzF4dUlDQnpaV3d1Y21WdGIzWmxRV3hzVW1GdVoyVnpLQ2s3WEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0F3TENCc1pXNGdQU0J5WVc1blpYTXViR1Z1WjNSb095QnBJRHdnYkdWdU95QXJLMmtwSUh0Y2JpQWdJQ0JwWmlBb0lXbHpVMkZ0WlZKaGJtZGxLSEpoYm1kbExDQnlZVzVuWlhOYmFWMHBLU0I3WEc0Z0lDQWdJQ0J6Wld3dVlXUmtVbUZ1WjJVb2NtRnVaMlZ6VzJsZEtUdGNiaUFnSUNCOVhHNGdJSDFjYmlBZ2FXWWdLQ0Z6Wld3dWNtRnVaMlZEYjNWdWRDa2dlMXh1SUNBZ0lIVndaR0YwWlVWdGNIUjVVMlZzWldOMGFXOXVLSE5sYkNrN1hHNGdJSDFjYm4xY2JseHVablZ1WTNScGIyNGdkWEJrWVhSbFFXNWphRzl5UVc1a1JtOWpkWE5HY205dFVtRnVaMlVnS0hObGJDd2djbUZ1WjJVcElIdGNiaUFnZG1GeUlHRnVZMmh2Y2xCeVpXWnBlQ0E5SUNkemRHRnlkQ2M3WEc0Z0lIWmhjaUJtYjJOMWMxQnlaV1pwZUNBOUlDZGxibVFuTzF4dUlDQnpaV3d1WVc1amFHOXlUbTlrWlNBOUlISmhibWRsVzJGdVkyaHZjbEJ5WldacGVDQXJJQ2REYjI1MFlXbHVaWEluWFR0Y2JpQWdjMlZzTG1GdVkyaHZjazltWm5ObGRDQTlJSEpoYm1kbFcyRnVZMmh2Y2xCeVpXWnBlQ0FySUNkUFptWnpaWFFuWFR0Y2JpQWdjMlZzTG1adlkzVnpUbTlrWlNBOUlISmhibWRsVzJadlkzVnpVSEpsWm1sNElDc2dKME52Ym5SaGFXNWxjaWRkTzF4dUlDQnpaV3d1Wm05amRYTlBabVp6WlhRZ1BTQnlZVzVuWlZ0bWIyTjFjMUJ5WldacGVDQXJJQ2RQWm1aelpYUW5YVHRjYm4xY2JseHVablZ1WTNScGIyNGdkWEJrWVhSbFJXMXdkSGxUWld4bFkzUnBiMjRnS0hObGJDa2dlMXh1SUNCelpXd3VZVzVqYUc5eVRtOWtaU0E5SUhObGJDNW1iMk4xYzA1dlpHVWdQU0J1ZFd4c08xeHVJQ0J6Wld3dVlXNWphRzl5VDJabWMyVjBJRDBnYzJWc0xtWnZZM1Z6VDJabWMyVjBJRDBnTUR0Y2JpQWdjMlZzTG5KaGJtZGxRMjkxYm5RZ1BTQXdPMXh1SUNCelpXd3VhWE5EYjJ4c1lYQnpaV1FnUFNCMGNuVmxPMXh1SUNCelpXd3VYM0poYm1kbGN5NXNaVzVuZEdnZ1BTQXdPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnlZVzVuWlVOdmJuUmhhVzV6VTJsdVoyeGxSV3hsYldWdWRDQW9jbUZ1WjJWT2IyUmxjeWtnZTF4dUlDQnBaaUFvSVhKaGJtZGxUbTlrWlhNdWJHVnVaM1JvSUh4OElISmhibWRsVG05a1pYTmJNRjB1Ym05a1pWUjVjR1VnSVQwOUlERXBJSHRjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lIMWNiaUFnWm05eUlDaDJZWElnYVNBOUlERXNJR3hsYmlBOUlISmhibWRsVG05a1pYTXViR1Z1WjNSb095QnBJRHdnYkdWdU95QXJLMmtwSUh0Y2JpQWdJQ0JwWmlBb0lXbHpRVzVqWlhOMGIzSlBaaWh5WVc1blpVNXZaR1Z6V3pCZExDQnlZVzVuWlU1dlpHVnpXMmxkS1NrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNBZ0lIMWNiaUFnZlZ4dUlDQnlaWFIxY200Z2RISjFaVHRjYm4xY2JseHVablZ1WTNScGIyNGdaMlYwVTJsdVoyeGxSV3hsYldWdWRFWnliMjFTWVc1blpTQW9jbUZ1WjJVcElIdGNiaUFnZG1GeUlHNXZaR1Z6SUQwZ2NtRnVaMlV1WjJWMFRtOWtaWE1vS1R0Y2JpQWdhV1lnS0NGeVlXNW5aVU52Ym5SaGFXNXpVMmx1WjJ4bFJXeGxiV1Z1ZENodWIyUmxjeWtwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMmRsZEZOcGJtZHNaVVZzWlcxbGJuUkdjbTl0VW1GdVoyVW9LVG9nY21GdVoyVWdaR2xrSUc1dmRDQmpiMjV6YVhOMElHOW1JR0VnYzJsdVoyeGxJR1ZzWlcxbGJuUW5LVHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdibTlrWlhOYk1GMDdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHbHpWR1Y0ZEZKaGJtZGxJQ2h5WVc1blpTa2dlMXh1SUNCeVpYUjFjbTRnY21GdVoyVWdKaVlnY21GdVoyVXVkR1Y0ZENBaFBUMGdkbTlwWkNBd08xeHVmVnh1WEc1bWRXNWpkR2x2YmlCMWNHUmhkR1ZHY205dFZHVjRkRkpoYm1kbElDaHpaV3dzSUhKaGJtZGxLU0I3WEc0Z0lITmxiQzVmY21GdVoyVnpJRDBnVzNKaGJtZGxYVHRjYmlBZ2RYQmtZWFJsUVc1amFHOXlRVzVrUm05amRYTkdjbTl0VW1GdVoyVW9jMlZzTENCeVlXNW5aU3dnWm1Gc2MyVXBPMXh1SUNCelpXd3VjbUZ1WjJWRGIzVnVkQ0E5SURFN1hHNGdJSE5sYkM1cGMwTnZiR3hoY0hObFpDQTlJSEpoYm1kbExtTnZiR3hoY0hObFpEdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2RYQmtZWFJsUTI5dWRISnZiRk5sYkdWamRHbHZiaUFvYzJWc0tTQjdYRzRnSUhObGJDNWZjbUZ1WjJWekxteGxibWQwYUNBOUlEQTdYRzRnSUdsbUlDaHpaV3d1WDNObGJHVmpkR2x2Ymk1MGVYQmxJRDA5UFNBblRtOXVaU2NwSUh0Y2JpQWdJQ0IxY0dSaGRHVkZiWEIwZVZObGJHVmpkR2x2YmloelpXd3BPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJSFpoY2lCamIyNTBjbTlzVW1GdVoyVWdQU0J6Wld3dVgzTmxiR1ZqZEdsdmJpNWpjbVZoZEdWU1lXNW5aU2dwTzF4dUlDQWdJR2xtSUNocGMxUmxlSFJTWVc1blpTaGpiMjUwY205c1VtRnVaMlVwS1NCN1hHNGdJQ0FnSUNCMWNHUmhkR1ZHY205dFZHVjRkRkpoYm1kbEtITmxiQ3dnWTI5dWRISnZiRkpoYm1kbEtUdGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnYzJWc0xuSmhibWRsUTI5MWJuUWdQU0JqYjI1MGNtOXNVbUZ1WjJVdWJHVnVaM1JvTzF4dUlDQWdJQ0FnZG1GeUlISmhibWRsTzF4dUlDQWdJQ0FnWm05eUlDaDJZWElnYVNBOUlEQTdJR2tnUENCelpXd3VjbUZ1WjJWRGIzVnVkRHNnS3l0cEtTQjdYRzRnSUNBZ0lDQWdJSEpoYm1kbElEMGdaRzlqTG1OeVpXRjBaVkpoYm1kbEtDazdYRzRnSUNBZ0lDQWdJSEpoYm1kbExuTmxiR1ZqZEU1dlpHVW9ZMjl1ZEhKdmJGSmhibWRsTG1sMFpXMG9hU2twTzF4dUlDQWdJQ0FnSUNCelpXd3VYM0poYm1kbGN5NXdkWE5vS0hKaGJtZGxLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSE5sYkM1cGMwTnZiR3hoY0hObFpDQTlJSE5sYkM1eVlXNW5aVU52ZFc1MElEMDlQU0F4SUNZbUlITmxiQzVmY21GdVoyVnpXekJkTG1OdmJHeGhjSE5sWkR0Y2JpQWdJQ0FnSUhWd1pHRjBaVUZ1WTJodmNrRnVaRVp2WTNWelJuSnZiVkpoYm1kbEtITmxiQ3dnYzJWc0xsOXlZVzVuWlhOYmMyVnNMbkpoYm1kbFEyOTFiblFnTFNBeFhTd2dabUZzYzJVcE8xeHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmhaR1JTWVc1blpWUnZRMjl1ZEhKdmJGTmxiR1ZqZEdsdmJpQW9jMlZzTENCeVlXNW5aU2tnZTF4dUlDQjJZWElnWTI5dWRISnZiRkpoYm1kbElEMGdjMlZzTGw5elpXeGxZM1JwYjI0dVkzSmxZWFJsVW1GdVoyVW9LVHRjYmlBZ2RtRnlJSEpoYm1kbFJXeGxiV1Z1ZENBOUlHZGxkRk5wYm1kc1pVVnNaVzFsYm5SR2NtOXRVbUZ1WjJVb2NtRnVaMlVwTzF4dUlDQjJZWElnYm1WM1EyOXVkSEp2YkZKaGJtZGxJRDBnWW05a2VTNWpjbVZoZEdWRGIyNTBjbTlzVW1GdVoyVW9LVHRjYmlBZ1ptOXlJQ2gyWVhJZ2FTQTlJREFzSUd4bGJpQTlJR052Ym5SeWIyeFNZVzVuWlM1c1pXNW5kR2c3SUdrZ1BDQnNaVzQ3SUNzcmFTa2dlMXh1SUNBZ0lHNWxkME52Ym5SeWIyeFNZVzVuWlM1aFpHUW9ZMjl1ZEhKdmJGSmhibWRsTG1sMFpXMG9hU2twTzF4dUlDQjlYRzRnSUhSeWVTQjdYRzRnSUNBZ2JtVjNRMjl1ZEhKdmJGSmhibWRsTG1Ga1pDaHlZVzVuWlVWc1pXMWxiblFwTzF4dUlDQjlJR05oZEdOb0lDaGxLU0I3WEc0Z0lDQWdkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZGhaR1JTWVc1blpTZ3BPaUJGYkdWdFpXNTBJR052ZFd4a0lHNXZkQ0JpWlNCaFpHUmxaQ0IwYnlCamIyNTBjbTlzSUhObGJHVmpkR2x2YmljcE8xeHVJQ0I5WEc0Z0lHNWxkME52Ym5SeWIyeFNZVzVuWlM1elpXeGxZM1FvS1R0Y2JpQWdkWEJrWVhSbFEyOXVkSEp2YkZObGJHVmpkR2x2YmloelpXd3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnBjMU5oYldWU1lXNW5aU0FvYkdWbWRDd2djbWxuYUhRcElIdGNiaUFnY21WMGRYSnVJQ2hjYmlBZ0lDQnNaV1owTG5OMFlYSjBRMjl1ZEdGcGJtVnlJRDA5UFNCeWFXZG9kQzV6ZEdGeWRFTnZiblJoYVc1bGNpQW1KbHh1SUNBZ0lHeGxablF1YzNSaGNuUlBabVp6WlhRZ1BUMDlJSEpwWjJoMExuTjBZWEowVDJabWMyVjBJQ1ltWEc0Z0lDQWdiR1ZtZEM1bGJtUkRiMjUwWVdsdVpYSWdQVDA5SUhKcFoyaDBMbVZ1WkVOdmJuUmhhVzVsY2lBbUpseHVJQ0FnSUd4bFpuUXVaVzVrVDJabWMyVjBJRDA5UFNCeWFXZG9kQzVsYm1SUFptWnpaWFJjYmlBZ0tUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2FYTkJibU5sYzNSdmNrOW1JQ2hoYm1ObGMzUnZjaXdnWkdWelkyVnVaR0Z1ZENrZ2UxeHVJQ0IyWVhJZ2JtOWtaU0E5SUdSbGMyTmxibVJoYm5RN1hHNGdJSGRvYVd4bElDaHViMlJsTG5CaGNtVnVkRTV2WkdVcElIdGNiaUFnSUNCcFppQW9ibTlrWlM1d1lYSmxiblJPYjJSbElEMDlQU0JoYm1ObGMzUnZjaWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dUlDQWdJRzV2WkdVZ1BTQnViMlJsTG5CaGNtVnVkRTV2WkdVN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdaaGJITmxPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQm5aWFJUWld4bFkzUnBiMjRnS0NrZ2UxeHVJQ0J5WlhSMWNtNGdibVYzSUVkbGRGTmxiR1ZqZEdsdmJpaG5iRzlpWVd3dVpHOWpkVzFsYm5RdWMyVnNaV04wYVc5dUtUdGNibjFjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCblpYUlRaV3hsWTNScGIyNDdYRzRpWFgwPSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaXNIb3N0TWV0aG9kIChob3N0LCBwcm9wKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGhvc3RbcHJvcF07XG4gIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8ICEhKHR5cGUgPT09ICdvYmplY3QnICYmIGhvc3RbcHJvcF0pIHx8IHR5cGUgPT09ICd1bmtub3duJztcbn1cblxuZnVuY3Rpb24gaXNIb3N0UHJvcGVydHkgKGhvc3QsIHByb3ApIHtcbiAgcmV0dXJuIHR5cGVvZiBob3N0W3Byb3BdICE9PSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gbWFueSAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFyZUhvc3RlZCAoaG9zdCwgcHJvcHMpIHtcbiAgICB2YXIgaSA9IHByb3BzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZiAoIWZuKGhvc3QsIHByb3BzW2ldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0aG9kOiBpc0hvc3RNZXRob2QsXG4gIG1ldGhvZHM6IG1hbnkoaXNIb3N0TWV0aG9kKSxcbiAgcHJvcGVydHk6IGlzSG9zdFByb3BlcnR5LFxuICBwcm9wZXJ0aWVzOiBtYW55KGlzSG9zdFByb3BlcnR5KVxufTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG5cbmZ1bmN0aW9uIHJhbmdlVG9UZXh0UmFuZ2UgKHApIHtcbiAgaWYgKHAuY29sbGFwc2VkKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB9XG4gIHZhciBzdGFydFJhbmdlID0gY3JlYXRlQm91bmRhcnlUZXh0UmFuZ2UoeyBub2RlOiBwLnN0YXJ0Q29udGFpbmVyLCBvZmZzZXQ6IHAuc3RhcnRPZmZzZXQgfSwgdHJ1ZSk7XG4gIHZhciBlbmRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5lbmRDb250YWluZXIsIG9mZnNldDogcC5lbmRPZmZzZXQgfSwgZmFsc2UpO1xuICB2YXIgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgdGV4dFJhbmdlLnNldEVuZFBvaW50KCdTdGFydFRvU3RhcnQnLCBzdGFydFJhbmdlKTtcbiAgdGV4dFJhbmdlLnNldEVuZFBvaW50KCdFbmRUb0VuZCcsIGVuZFJhbmdlKTtcbiAgcmV0dXJuIHRleHRSYW5nZTtcbn1cblxuZnVuY3Rpb24gaXNDaGFyYWN0ZXJEYXRhTm9kZSAobm9kZSkge1xuICB2YXIgdCA9IG5vZGUubm9kZVR5cGU7XG4gIHJldHVybiB0ID09PSAzIHx8IHQgPT09IDQgfHwgdCA9PT0gOCA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlIChwLCBzdGFydGluZykge1xuICB2YXIgYm91bmQ7XG4gIHZhciBwYXJlbnQ7XG4gIHZhciBvZmZzZXQgPSBwLm9mZnNldDtcbiAgdmFyIHdvcmtpbmdOb2RlO1xuICB2YXIgY2hpbGROb2RlcztcbiAgdmFyIHJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgdmFyIGRhdGEgPSBpc0NoYXJhY3RlckRhdGFOb2RlKHAubm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICBib3VuZCA9IHAubm9kZTtcbiAgICBwYXJlbnQgPSBib3VuZC5wYXJlbnROb2RlO1xuICB9IGVsc2Uge1xuICAgIGNoaWxkTm9kZXMgPSBwLm5vZGUuY2hpbGROb2RlcztcbiAgICBib3VuZCA9IG9mZnNldCA8IGNoaWxkTm9kZXMubGVuZ3RoID8gY2hpbGROb2Rlc1tvZmZzZXRdIDogbnVsbDtcbiAgICBwYXJlbnQgPSBwLm5vZGU7XG4gIH1cblxuICB3b3JraW5nTm9kZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIHdvcmtpbmdOb2RlLmlubmVySFRNTCA9ICcmI2ZlZmY7JztcblxuICBpZiAoYm91bmQpIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHdvcmtpbmdOb2RlLCBib3VuZCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHdvcmtpbmdOb2RlKTtcbiAgfVxuXG4gIHJhbmdlLm1vdmVUb0VsZW1lbnRUZXh0KHdvcmtpbmdOb2RlKTtcbiAgcmFuZ2UuY29sbGFwc2UoIXN0YXJ0aW5nKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHdvcmtpbmdOb2RlKTtcblxuICBpZiAoZGF0YSkge1xuICAgIHJhbmdlW3N0YXJ0aW5nID8gJ21vdmVTdGFydCcgOiAnbW92ZUVuZCddKCdjaGFyYWN0ZXInLCBvZmZzZXQpO1xuICB9XG4gIHJldHVybiByYW5nZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5nZVRvVGV4dFJhbmdlO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl6Wld4bFkyTnBiMjR2YzNKakwzSmhibWRsVkc5VVpYaDBVbUZ1WjJVdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqdEJRVUZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUluZFhObElITjBjbWxqZENjN1hHNWNiblpoY2lCa2IyTWdQU0JuYkc5aVlXd3VaRzlqZFcxbGJuUTdYRzUyWVhJZ1ltOWtlU0E5SUdSdll5NWliMlI1TzF4dVhHNW1kVzVqZEdsdmJpQnlZVzVuWlZSdlZHVjRkRkpoYm1kbElDaHdLU0I3WEc0Z0lHbG1JQ2h3TG1OdmJHeGhjSE5sWkNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJqY21WaGRHVkNiM1Z1WkdGeWVWUmxlSFJTWVc1blpTaDdJRzV2WkdVNklIQXVjM1JoY25SRGIyNTBZV2x1WlhJc0lHOW1abk5sZERvZ2NDNXpkR0Z5ZEU5bVpuTmxkQ0I5TENCMGNuVmxLVHRjYmlBZ2ZWeHVJQ0IyWVhJZ2MzUmhjblJTWVc1blpTQTlJR055WldGMFpVSnZkVzVrWVhKNVZHVjRkRkpoYm1kbEtIc2dibTlrWlRvZ2NDNXpkR0Z5ZEVOdmJuUmhhVzVsY2l3Z2IyWm1jMlYwT2lCd0xuTjBZWEowVDJabWMyVjBJSDBzSUhSeWRXVXBPMXh1SUNCMllYSWdaVzVrVW1GdVoyVWdQU0JqY21WaGRHVkNiM1Z1WkdGeWVWUmxlSFJTWVc1blpTaDdJRzV2WkdVNklIQXVaVzVrUTI5dWRHRnBibVZ5TENCdlptWnpaWFE2SUhBdVpXNWtUMlptYzJWMElIMHNJR1poYkhObEtUdGNiaUFnZG1GeUlIUmxlSFJTWVc1blpTQTlJR0p2WkhrdVkzSmxZWFJsVkdWNGRGSmhibWRsS0NrN1hHNGdJSFJsZUhSU1lXNW5aUzV6WlhSRmJtUlFiMmx1ZENnblUzUmhjblJVYjFOMFlYSjBKeXdnYzNSaGNuUlNZVzVuWlNrN1hHNGdJSFJsZUhSU1lXNW5aUzV6WlhSRmJtUlFiMmx1ZENnblJXNWtWRzlGYm1RbkxDQmxibVJTWVc1blpTazdYRzRnSUhKbGRIVnliaUIwWlhoMFVtRnVaMlU3WEc1OVhHNWNibVoxYm1OMGFXOXVJR2x6UTJoaGNtRmpkR1Z5UkdGMFlVNXZaR1VnS0c1dlpHVXBJSHRjYmlBZ2RtRnlJSFFnUFNCdWIyUmxMbTV2WkdWVWVYQmxPMXh1SUNCeVpYUjFjbTRnZENBOVBUMGdNeUI4ZkNCMElEMDlQU0EwSUh4OElIUWdQVDA5SURnZ08xeHVmVnh1WEc1bWRXNWpkR2x2YmlCamNtVmhkR1ZDYjNWdVpHRnllVlJsZUhSU1lXNW5aU0FvY0N3Z2MzUmhjblJwYm1jcElIdGNiaUFnZG1GeUlHSnZkVzVrTzF4dUlDQjJZWElnY0dGeVpXNTBPMXh1SUNCMllYSWdiMlptYzJWMElEMGdjQzV2Wm1aelpYUTdYRzRnSUhaaGNpQjNiM0pyYVc1blRtOWtaVHRjYmlBZ2RtRnlJR05vYVd4a1RtOWtaWE03WEc0Z0lIWmhjaUJ5WVc1blpTQTlJR0p2WkhrdVkzSmxZWFJsVkdWNGRGSmhibWRsS0NrN1hHNGdJSFpoY2lCa1lYUmhJRDBnYVhORGFHRnlZV04wWlhKRVlYUmhUbTlrWlNod0xtNXZaR1VwTzF4dVhHNGdJR2xtSUNoa1lYUmhLU0I3WEc0Z0lDQWdZbTkxYm1RZ1BTQndMbTV2WkdVN1hHNGdJQ0FnY0dGeVpXNTBJRDBnWW05MWJtUXVjR0Z5Wlc1MFRtOWtaVHRjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0JqYUdsc1pFNXZaR1Z6SUQwZ2NDNXViMlJsTG1Ob2FXeGtUbTlrWlhNN1hHNGdJQ0FnWW05MWJtUWdQU0J2Wm1aelpYUWdQQ0JqYUdsc1pFNXZaR1Z6TG14bGJtZDBhQ0EvSUdOb2FXeGtUbTlrWlhOYmIyWm1jMlYwWFNBNklHNTFiR3c3WEc0Z0lDQWdjR0Z5Wlc1MElEMGdjQzV1YjJSbE8xeHVJQ0I5WEc1Y2JpQWdkMjl5YTJsdVowNXZaR1VnUFNCa2IyTXVZM0psWVhSbFJXeGxiV1Z1ZENnbmMzQmhiaWNwTzF4dUlDQjNiM0pyYVc1blRtOWtaUzVwYm01bGNraFVUVXdnUFNBbkppTm1aV1ptT3ljN1hHNWNiaUFnYVdZZ0tHSnZkVzVrS1NCN1hHNGdJQ0FnY0dGeVpXNTBMbWx1YzJWeWRFSmxabTl5WlNoM2IzSnJhVzVuVG05a1pTd2dZbTkxYm1RcE8xeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lIQmhjbVZ1ZEM1aGNIQmxibVJEYUdsc1pDaDNiM0pyYVc1blRtOWtaU2s3WEc0Z0lIMWNibHh1SUNCeVlXNW5aUzV0YjNabFZHOUZiR1Z0Wlc1MFZHVjRkQ2gzYjNKcmFXNW5UbTlrWlNrN1hHNGdJSEpoYm1kbExtTnZiR3hoY0hObEtDRnpkR0Z5ZEdsdVp5azdYRzRnSUhCaGNtVnVkQzV5WlcxdmRtVkRhR2xzWkNoM2IzSnJhVzVuVG05a1pTazdYRzVjYmlBZ2FXWWdLR1JoZEdFcElIdGNiaUFnSUNCeVlXNW5aVnR6ZEdGeWRHbHVaeUEvSUNkdGIzWmxVM1JoY25RbklEb2dKMjF2ZG1WRmJtUW5YU2duWTJoaGNtRmpkR1Z5Snl3Z2IyWm1jMlYwS1R0Y2JpQWdmVnh1SUNCeVpYUjFjbTRnY21GdVoyVTdYRzU5WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ2NtRnVaMlZVYjFSbGVIUlNZVzVuWlR0Y2JpSmRmUT09IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb24nKTtcbnZhciBzZXRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL3NldFNlbGVjdGlvbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0OiBnZXRTZWxlY3Rpb24sXG4gIHNldDogc2V0U2VsZWN0aW9uXG59O1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb24nKTtcbnZhciByYW5nZVRvVGV4dFJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZVRvVGV4dFJhbmdlJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuXG5mdW5jdGlvbiBzZXRTZWxlY3Rpb24gKHApIHtcbiAgaWYgKGRvYy5jcmVhdGVSYW5nZSkge1xuICAgIG1vZGVyblNlbGVjdGlvbigpO1xuICB9IGVsc2Uge1xuICAgIG9sZFNlbGVjdGlvbigpO1xuICB9XG5cbiAgZnVuY3Rpb24gbW9kZXJuU2VsZWN0aW9uICgpIHtcbiAgICB2YXIgc2VsID0gZ2V0U2VsZWN0aW9uKCk7XG4gICAgdmFyIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgaWYgKCFwLnN0YXJ0Q29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwLmVuZENvbnRhaW5lcikge1xuICAgICAgcmFuZ2Uuc2V0RW5kKHAuZW5kQ29udGFpbmVyLCBwLmVuZE9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlLnNldEVuZChwLnN0YXJ0Q29udGFpbmVyLCBwLnN0YXJ0T2Zmc2V0KTtcbiAgICB9XG4gICAgcmFuZ2Uuc2V0U3RhcnQocC5zdGFydENvbnRhaW5lciwgcC5zdGFydE9mZnNldCk7XG4gICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbGRTZWxlY3Rpb24gKCkge1xuICAgIHJhbmdlVG9UZXh0UmFuZ2UocCkuc2VsZWN0KCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRTZWxlY3Rpb247XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXpaV3hsWTJOcGIyNHZjM0pqTDNObGRGTmxiR1ZqZEdsdmJpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJbmRYTmxJSE4wY21samRDYzdYRzVjYm5aaGNpQm5aWFJUWld4bFkzUnBiMjRnUFNCeVpYRjFhWEpsS0NjdUwyZGxkRk5sYkdWamRHbHZiaWNwTzF4dWRtRnlJSEpoYm1kbFZHOVVaWGgwVW1GdVoyVWdQU0J5WlhGMWFYSmxLQ2N1TDNKaGJtZGxWRzlVWlhoMFVtRnVaMlVuS1R0Y2JuWmhjaUJrYjJNZ1BTQm5iRzlpWVd3dVpHOWpkVzFsYm5RN1hHNWNibVoxYm1OMGFXOXVJSE5sZEZObGJHVmpkR2x2YmlBb2NDa2dlMXh1SUNCcFppQW9aRzlqTG1OeVpXRjBaVkpoYm1kbEtTQjdYRzRnSUNBZ2JXOWtaWEp1VTJWc1pXTjBhVzl1S0NrN1hHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2IyeGtVMlZzWldOMGFXOXVLQ2s3WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCdGIyUmxjbTVUWld4bFkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUhaaGNpQnpaV3dnUFNCblpYUlRaV3hsWTNScGIyNG9LVHRjYmlBZ0lDQjJZWElnY21GdVoyVWdQU0JrYjJNdVkzSmxZWFJsVW1GdVoyVW9LVHRjYmlBZ0lDQnBaaUFvSVhBdWMzUmhjblJEYjI1MFlXbHVaWElwSUh0Y2JpQWdJQ0FnSUhKbGRIVnlianRjYmlBZ0lDQjlYRzRnSUNBZ2FXWWdLSEF1Wlc1a1EyOXVkR0ZwYm1WeUtTQjdYRzRnSUNBZ0lDQnlZVzVuWlM1elpYUkZibVFvY0M1bGJtUkRiMjUwWVdsdVpYSXNJSEF1Wlc1a1QyWm1jMlYwS1R0Y2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdjbUZ1WjJVdWMyVjBSVzVrS0hBdWMzUmhjblJEYjI1MFlXbHVaWElzSUhBdWMzUmhjblJQWm1aelpYUXBPMXh1SUNBZ0lIMWNiaUFnSUNCeVlXNW5aUzV6WlhSVGRHRnlkQ2h3TG5OMFlYSjBRMjl1ZEdGcGJtVnlMQ0J3TG5OMFlYSjBUMlptYzJWMEtUdGNiaUFnSUNCelpXd3VjbVZ0YjNabFFXeHNVbUZ1WjJWektDazdYRzRnSUNBZ2MyVnNMbUZrWkZKaGJtZGxLSEpoYm1kbEtUdGNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJRzlzWkZObGJHVmpkR2x2YmlBb0tTQjdYRzRnSUNBZ2NtRnVaMlZVYjFSbGVIUlNZVzVuWlNod0tTNXpaV3hsWTNRb0tUdGNiaUFnZlZ4dWZWeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJSE5sZEZObGJHVmpkR2x2Ymp0Y2JpSmRmUT09IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0ID0gZWFzeUdldDtcbnZhciBzZXQgPSBlYXN5U2V0O1xuXG5pZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSkge1xuICBnZXQgPSBoYXJkR2V0O1xuICBzZXQgPSBoYXJkU2V0O1xufVxuXG5mdW5jdGlvbiBlYXN5R2V0IChlbCkge1xuICByZXR1cm4ge1xuICAgIHN0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCxcbiAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXJkR2V0IChlbCkge1xuICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSAhPT0gZWwpIHtcbiAgICBlbC5mb2N1cygpO1xuICB9XG5cbiAgdmFyIHJhbmdlID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciBib29rbWFyayA9IHJhbmdlLmdldEJvb2ttYXJrKCk7XG4gIHZhciBvcmlnaW5hbCA9IGVsLnZhbHVlO1xuICB2YXIgbWFya2VyID0gZ2V0VW5pcXVlTWFya2VyKG9yaWdpbmFsKTtcbiAgdmFyIHBhcmVudCA9IHJhbmdlLnBhcmVudEVsZW1lbnQoKTtcbiAgaWYgKHBhcmVudCA9PT0gbnVsbCB8fCAhaW5wdXRzKHBhcmVudCkpIHtcbiAgICByZXR1cm4gcmVzdWx0KDAsIDApO1xuICB9XG4gIHJhbmdlLnRleHQgPSBtYXJrZXIgKyByYW5nZS50ZXh0ICsgbWFya2VyO1xuXG4gIHZhciBjb250ZW50cyA9IGVsLnZhbHVlO1xuXG4gIGVsLnZhbHVlID0gb3JpZ2luYWw7XG4gIHJhbmdlLm1vdmVUb0Jvb2ttYXJrKGJvb2ttYXJrKTtcbiAgcmFuZ2Uuc2VsZWN0KCk7XG5cbiAgcmV0dXJuIHJlc3VsdChjb250ZW50cy5pbmRleE9mKG1hcmtlciksIGNvbnRlbnRzLmxhc3RJbmRleE9mKG1hcmtlcikgLSBtYXJrZXIubGVuZ3RoKTtcblxuICBmdW5jdGlvbiByZXN1bHQgKHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoYWN0aXZlICE9PSBlbCkgeyAvLyBkb24ndCBkaXNydXB0IHByZS1leGlzdGluZyBzdGF0ZVxuICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICBhY3RpdmUuZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmJsdXIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFVuaXF1ZU1hcmtlciAoY29udGVudHMpIHtcbiAgdmFyIG1hcmtlcjtcbiAgZG8ge1xuICAgIG1hcmtlciA9ICdAQG1hcmtlci4nICsgTWF0aC5yYW5kb20oKSAqIG5ldyBEYXRlKCk7XG4gIH0gd2hpbGUgKGNvbnRlbnRzLmluZGV4T2YobWFya2VyKSAhPT0gLTEpO1xuICByZXR1cm4gbWFya2VyO1xufVxuXG5mdW5jdGlvbiBpbnB1dHMgKGVsKSB7XG4gIHJldHVybiAoKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgZWwudHlwZSA9PT0gJ3RleHQnKSB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnKTtcbn1cblxuZnVuY3Rpb24gZWFzeVNldCAoZWwsIHApIHtcbiAgZWwuc2VsZWN0aW9uU3RhcnQgPSBwYXJzZShlbCwgcC5zdGFydCk7XG4gIGVsLnNlbGVjdGlvbkVuZCA9IHBhcnNlKGVsLCBwLmVuZCk7XG59XG5cbmZ1bmN0aW9uIGhhcmRTZXQgKGVsLCBwKSB7XG4gIHZhciByYW5nZSA9IGVsLmNyZWF0ZVRleHRSYW5nZSgpO1xuXG4gIGlmIChwLnN0YXJ0ID09PSAnZW5kJyAmJiBwLmVuZCA9PT0gJ2VuZCcpIHtcbiAgICByYW5nZS5jb2xsYXBzZShmYWxzZSk7XG4gICAgcmFuZ2Uuc2VsZWN0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG4gICAgcmFuZ2UubW92ZUVuZCgnY2hhcmFjdGVyJywgcGFyc2UoZWwsIHAuZW5kKSk7XG4gICAgcmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBwYXJzZShlbCwgcC5zdGFydCkpO1xuICAgIHJhbmdlLnNlbGVjdCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlIChlbCwgdmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSAnZW5kJyA/IGVsLnZhbHVlLmxlbmd0aCA6IHZhbHVlIHx8IDA7XG59XG5cbmZ1bmN0aW9uIHNlbGwgKGVsLCBwKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgc2V0KGVsLCBwKTtcbiAgfVxuICByZXR1cm4gZ2V0KGVsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZWxsO1xuIiwidmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbmlmIChzaSkge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldEltbWVkaWF0ZShmbik7IH07XG59IGVsc2Uge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpY2s7Il19
