(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.horsey = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var setAppends = options.setAppends;
  var _set = options.set;
  var filter = options.filter;
  var source = options.source;
  var _options$cache = options.cache;
  var cache = _options$cache === undefined ? {} : _options$cache;
  var predictNextSearch = options.predictNextSearch;
  var renderItem = options.renderItem;
  var renderCategory = options.renderCategory;
  var blankSearch = options.blankSearch;
  var appendTo = options.appendTo;
  var anchor = options.anchor;
  var debounce = options.debounce;
  var highlighter = options.highlighter;
  var highlightCompleteWords = options.highlightCompleteWords;

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

    filter: filter,
    highlighter: highlighter,
    highlightCompleteWords: highlightCompleteWords
  });
  return completer;
  function noMatches(data) {
    if (!options.noMatches) {
      return false;
    }
    return data.query.length;
  }
  function sourceFunction(data, done) {
    var query = data.query;
    var limit = data.limit;

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
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var o = options;
  var parent = o.appendTo || doc.body;
  var getText = o.getText;
  var getValue = o.getValue;
  var form = o.form;
  var source = o.source;
  var noMatches = o.noMatches;
  var noMatchesText = o.noMatchesText;
  var _o$highlighter = o.highlighter;
  var highlighter = _o$highlighter === undefined ? true : _o$highlighter;
  var _o$highlightCompleteW = o.highlightCompleteWords;
  var highlightCompleteWords = _o$highlightCompleteW === undefined ? true : _o$highlightCompleteW;
  var _o$renderItem = o.renderItem;
  var renderItem = _o$renderItem === undefined ? defaultItemRenderer : _o$renderItem;
  var _o$renderCategory = o.renderCategory;
  var renderCategory = _o$renderCategory === undefined ? defaultCategoryRenderer : _o$renderCategory;
  var setAppends = o.setAppends;

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
            if ((_el2.innerText || _el2.textContent) === input) {
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

},{"bullseye":2,"contra/emitter":14,"crossvent":18,"fuzzysearch":20,"hash-sum":21,"lodash/debounce":22,"sektor":29,"sell":30}],2:[function(require,module,exports){
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

},{"./tailormade":11,"./throttle":12,"crossvent":18}],3:[function(require,module,exports){
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

},{"./getSelectionNullOp":4,"./getSelectionRaw":5,"./getSelectionSynthetic":6,"./isHost":7}],4:[function(require,module,exports){
'use strict';

function noop () {}

function getSelectionNullOp () {
  return {
    removeAllRanges: noop,
    addRange: noop
  };
}

module.exports = getSelectionNullOp;

},{}],5:[function(require,module,exports){
(function (global){
'use strict';

function getSelectionRaw () {
  return global.getSelection();
}

module.exports = getSelectionRaw;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(require,module,exports){
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

},{"./rangeToTextRange":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
'use strict';

var getSelection = require('./getSelection');
var setSelection = require('./setSelection');

module.exports = {
  get: getSelection,
  set: setSelection
};

},{"./getSelection":3,"./setSelection":10}],10:[function(require,module,exports){
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

},{"./getSelection":3,"./rangeToTextRange":8}],11:[function(require,module,exports){
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

},{"./throttle":12,"crossvent":18,"seleccion":9,"sell":30}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":16}],14:[function(require,module,exports){
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

},{"./debounce":13,"atoa":15}],15:[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],16:[function(require,module,exports){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{"./eventmap":19,"custom-event":17}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{"./isObject":24,"./now":27,"./toNumber":28}],23:[function(require,module,exports){
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

},{"./isObject":24}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{"./isObjectLike":25}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{"./isFunction":23,"./isObject":24,"./isSymbol":26}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJob3JzZXkuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvYnVsbHNleWUuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvbm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvZ2V0U2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL25vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL2dldFNlbGVjdGlvbk51bGxPcC5qcyIsIm5vZGVfbW9kdWxlcy9idWxsc2V5ZS9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25SYXcuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvbm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvZ2V0U2VsZWN0aW9uU3ludGhldGljLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL25vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL2lzSG9zdC5qcyIsIm5vZGVfbW9kdWxlcy9idWxsc2V5ZS9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9yYW5nZVRvVGV4dFJhbmdlLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL25vZGVfbW9kdWxlcy9zZWxlY2Npb24vc3JjL3NlbGVjY2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9idWxsc2V5ZS9ub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9zZXRTZWxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvdGFpbG9ybWFkZS5qcyIsIm5vZGVfbW9kdWxlcy9idWxsc2V5ZS90aHJvdHRsZS5qcyIsIm5vZGVfbW9kdWxlcy9jb250cmEvZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXMvY29udHJhL2VtaXR0ZXIuanMiLCJub2RlX21vZHVsZXMvY29udHJhL25vZGVfbW9kdWxlcy9hdG9hL2F0b2EuanMiLCJub2RlX21vZHVsZXMvY29udHJhL25vZGVfbW9kdWxlcy90aWNreS90aWNreS1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9ub2RlX21vZHVsZXMvY3VzdG9tLWV2ZW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvZXZlbnRtYXAuanMiLCJub2RlX21vZHVsZXMvZnV6enlzZWFyY2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaGFzaC1zdW0vaGFzaC1zdW0uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC90b051bWJlci5qcyIsIm5vZGVfbW9kdWxlcy9zZWt0b3Ivc3JjL3Nla3Rvci5qcyIsIm5vZGVfbW9kdWxlcy9zZWxsL3NlbGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQUNBLElBQU0sZ0JBQWdCLENBQXRCO0FBQ0EsSUFBTSxZQUFZLEVBQWxCO0FBQ0EsSUFBTSxVQUFVLEVBQWhCO0FBQ0EsSUFBTSxTQUFTLEVBQWY7QUFDQSxJQUFNLFdBQVcsRUFBakI7QUFDQSxJQUFNLFVBQVUsQ0FBaEI7QUFDQSxJQUFNLE1BQU0sUUFBWjtBQUNBLElBQU0sYUFBYSxJQUFJLGVBQXZCOztBQUVBLFNBQVMsTUFBVCxDQUFpQixFQUFqQixFQUFtQztBQUFBLE1BQWQsT0FBYyx5REFBSixFQUFJO0FBQUEsTUFFL0IsVUFG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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuaW1wb3J0IHN1bSBmcm9tICdoYXNoLXN1bSc7XHJcbmltcG9ydCBzZWxsIGZyb20gJ3NlbGwnO1xyXG5pbXBvcnQgc2VrdG9yIGZyb20gJ3Nla3Rvcic7XHJcbmltcG9ydCBlbWl0dGVyIGZyb20gJ2NvbnRyYS9lbWl0dGVyJztcclxuaW1wb3J0IGJ1bGxzZXllIGZyb20gJ2J1bGxzZXllJztcclxuaW1wb3J0IGNyb3NzdmVudCBmcm9tICdjcm9zc3ZlbnQnO1xyXG5pbXBvcnQgZnV6enlzZWFyY2ggZnJvbSAnZnV6enlzZWFyY2gnO1xyXG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnbG9kYXNoL2RlYm91bmNlJztcclxuY29uc3QgS0VZX0JBQ0tTUEFDRSA9IDg7XHJcbmNvbnN0IEtFWV9FTlRFUiA9IDEzO1xyXG5jb25zdCBLRVlfRVNDID0gMjc7XHJcbmNvbnN0IEtFWV9VUCA9IDM4O1xyXG5jb25zdCBLRVlfRE9XTiA9IDQwO1xyXG5jb25zdCBLRVlfVEFCID0gOTtcclxuY29uc3QgZG9jID0gZG9jdW1lbnQ7XHJcbmNvbnN0IGRvY0VsZW1lbnQgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxuZnVuY3Rpb24gaG9yc2V5IChlbCwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgY29uc3Qge1xyXG4gICAgc2V0QXBwZW5kcyxcclxuICAgIHNldCxcclxuICAgIGZpbHRlcixcclxuICAgIHNvdXJjZSxcclxuICAgIGNhY2hlID0ge30sXHJcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcclxuICAgIHJlbmRlckl0ZW0sXHJcbiAgICByZW5kZXJDYXRlZ29yeSxcclxuICAgIGJsYW5rU2VhcmNoLFxyXG4gICAgYXBwZW5kVG8sXHJcbiAgICBhbmNob3IsXHJcbiAgICBkZWJvdW5jZSxcclxuICAgIGhpZ2hsaWdodGVyLFxyXG4gICAgaGlnaGxpZ2h0Q29tcGxldGVXb3Jkc1xyXG4gIH0gPSBvcHRpb25zO1xyXG4gIGNvbnN0IGNhY2hpbmcgPSBvcHRpb25zLmNhY2hlICE9PSBmYWxzZTtcclxuICBpZiAoIXNvdXJjZSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXNlckdldFRleHQgPSBvcHRpb25zLmdldFRleHQ7XHJcbiAgY29uc3QgdXNlckdldFZhbHVlID0gb3B0aW9ucy5nZXRWYWx1ZTtcclxuICBjb25zdCBnZXRUZXh0ID0gKFxyXG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnc3RyaW5nJyA/IGQgPT4gZFt1c2VyR2V0VGV4dF0gOlxyXG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnZnVuY3Rpb24nID8gdXNlckdldFRleHQgOlxyXG4gICAgZCA9PiBkLnRvU3RyaW5nKClcclxuICApO1xyXG4gIGNvbnN0IGdldFZhbHVlID0gKFxyXG4gICAgdHlwZW9mIHVzZXJHZXRWYWx1ZSA9PT0gJ3N0cmluZycgPyBkID0+IGRbdXNlckdldFZhbHVlXSA6XHJcbiAgICB0eXBlb2YgdXNlckdldFZhbHVlID09PSAnZnVuY3Rpb24nID8gdXNlckdldFZhbHVlIDpcclxuICAgIGQgPT4gZFxyXG4gICk7XHJcblxyXG4gIGxldCBwcmV2aW91c1N1Z2dlc3Rpb25zID0gW107XHJcbiAgbGV0IHByZXZpb3VzU2VsZWN0aW9uID0gbnVsbDtcclxuICBjb25zdCBsaW1pdCA9IE51bWJlcihvcHRpb25zLmxpbWl0KSB8fCBJbmZpbml0eTtcclxuICBjb25zdCBjb21wbGV0ZXIgPSBhdXRvY29tcGxldGUoZWwsIHtcclxuICAgIHNvdXJjZTogc291cmNlRnVuY3Rpb24sXHJcbiAgICBsaW1pdCxcclxuICAgIGdldFRleHQsXHJcbiAgICBnZXRWYWx1ZSxcclxuICAgIHNldEFwcGVuZHMsXHJcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcclxuICAgIHJlbmRlckl0ZW0sXHJcbiAgICByZW5kZXJDYXRlZ29yeSxcclxuICAgIGFwcGVuZFRvLFxyXG4gICAgYW5jaG9yLFxyXG4gICAgbm9NYXRjaGVzLFxyXG4gICAgbm9NYXRjaGVzVGV4dDogb3B0aW9ucy5ub01hdGNoZXMsXHJcbiAgICBibGFua1NlYXJjaCxcclxuICAgIGRlYm91bmNlLFxyXG4gICAgc2V0IChzKSB7XHJcbiAgICAgIGlmIChzZXRBcHBlbmRzICE9PSB0cnVlKSB7XHJcbiAgICAgICAgZWwudmFsdWUgPSAnJztcclxuICAgICAgfVxyXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbiA9IHM7XHJcbiAgICAgIChzZXQgfHwgY29tcGxldGVyLmRlZmF1bHRTZXR0ZXIpKGdldFRleHQocyksIHMpO1xyXG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYWZ0ZXJTZXQnKTtcclxuICAgIH0sXHJcbiAgICBmaWx0ZXIsXHJcbiAgICBoaWdobGlnaHRlcixcclxuICAgIGhpZ2hsaWdodENvbXBsZXRlV29yZHMsXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGNvbXBsZXRlcjtcclxuICBmdW5jdGlvbiBub01hdGNoZXMgKGRhdGEpIHtcclxuICAgIGlmICghb3B0aW9ucy5ub01hdGNoZXMpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRhdGEucXVlcnkubGVuZ3RoO1xyXG4gIH1cclxuICBmdW5jdGlvbiBzb3VyY2VGdW5jdGlvbiAoZGF0YSwgZG9uZSkge1xyXG4gICAgY29uc3Qge3F1ZXJ5LCBsaW1pdH0gPSBkYXRhO1xyXG4gICAgaWYgKCFvcHRpb25zLmJsYW5rU2VhcmNoICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBkb25lKG51bGwsIFtdLCB0cnVlKTsgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbXBsZXRlcikge1xyXG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYmVmb3JlVXBkYXRlJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBoYXNoID0gc3VtKHF1ZXJ5KTsgLy8gZmFzdCwgY2FzZSBpbnNlbnNpdGl2ZSwgcHJldmVudHMgY29sbGlzaW9uc1xyXG4gICAgaWYgKGNhY2hpbmcpIHtcclxuICAgICAgY29uc3QgZW50cnkgPSBjYWNoZVtoYXNoXTtcclxuICAgICAgaWYgKGVudHJ5KSB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBlbnRyeS5jcmVhdGVkLmdldFRpbWUoKTtcclxuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IGNhY2hlLmR1cmF0aW9uIHx8IDYwICogNjAgKiAyNDtcclxuICAgICAgICBjb25zdCBkaWZmID0gZHVyYXRpb24gKiAxMDAwO1xyXG4gICAgICAgIGNvbnN0IGZyZXNoID0gbmV3IERhdGUoc3RhcnQgKyBkaWZmKSA+IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgaWYgKGZyZXNoKSB7XHJcbiAgICAgICAgICBkb25lKG51bGwsIGVudHJ5Lml0ZW1zLnNsaWNlKCkpOyByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgc291cmNlRGF0YSA9IHtcclxuICAgICAgcHJldmlvdXNTdWdnZXN0aW9uczogcHJldmlvdXNTdWdnZXN0aW9ucy5zbGljZSgpLFxyXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbixcclxuICAgICAgaW5wdXQ6IHF1ZXJ5LFxyXG4gICAgICByZW5kZXJJdGVtLFxyXG4gICAgICByZW5kZXJDYXRlZ29yeSxcclxuICAgICAgbGltaXRcclxuICAgIH07XHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc291cmNlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIG9wdGlvbnMuc291cmNlKHNvdXJjZURhdGEsIHNvdXJjZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc291cmNlZChudWxsLCBvcHRpb25zLnNvdXJjZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzb3VyY2VkIChlcnIsIHJlc3VsdCkge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0F1dG9jb21wbGV0ZSBzb3VyY2UgZXJyb3IuJywgZXJyLCBlbCk7XHJcbiAgICAgICAgZG9uZShlcnIsIFtdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBpdGVtcyA9IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdCA6IFtdO1xyXG4gICAgICBpZiAoY2FjaGluZykge1xyXG4gICAgICAgIGNhY2hlW2hhc2hdID0geyBjcmVhdGVkOiBuZXcgRGF0ZSgpLCBpdGVtcyB9O1xyXG4gICAgICB9XHJcbiAgICAgIHByZXZpb3VzU3VnZ2VzdGlvbnMgPSBpdGVtcztcclxuICAgICAgZG9uZShudWxsLCBpdGVtcy5zbGljZSgpKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9jb21wbGV0ZSAoZWwsIG9wdGlvbnMgPSB7fSkge1xyXG4gIGNvbnN0IG8gPSBvcHRpb25zO1xyXG4gIGNvbnN0IHBhcmVudCA9IG8uYXBwZW5kVG8gfHwgZG9jLmJvZHk7XHJcbiAgY29uc3Qge1xyXG4gICAgZ2V0VGV4dCxcclxuICAgIGdldFZhbHVlLFxyXG4gICAgZm9ybSxcclxuICAgIHNvdXJjZSxcclxuICAgIG5vTWF0Y2hlcyxcclxuICAgIG5vTWF0Y2hlc1RleHQsXHJcbiAgICBoaWdobGlnaHRlciA9IHRydWUsXHJcbiAgICBoaWdobGlnaHRDb21wbGV0ZVdvcmRzID0gdHJ1ZSxcclxuICAgIHJlbmRlckl0ZW0gPSBkZWZhdWx0SXRlbVJlbmRlcmVyLFxyXG4gICAgcmVuZGVyQ2F0ZWdvcnkgPSBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlcixcclxuICAgIHNldEFwcGVuZHNcclxuICB9ID0gbztcclxuICBjb25zdCBsaW1pdCA9IHR5cGVvZiBvLmxpbWl0ID09PSAnbnVtYmVyJyA/IG8ubGltaXQgOiBJbmZpbml0eTtcclxuICBjb25zdCB1c2VyRmlsdGVyID0gby5maWx0ZXIgfHwgZGVmYXVsdEZpbHRlcjtcclxuICBjb25zdCB1c2VyU2V0ID0gby5zZXQgfHwgZGVmYXVsdFNldHRlcjtcclxuICBjb25zdCBjYXRlZ29yaWVzID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3JpZXMnKTtcclxuICBjb25zdCBjb250YWluZXIgPSB0YWcoJ2RpdicsICdzZXktY29udGFpbmVyJyk7XHJcbiAgY29uc3QgZGVmZXJyZWRGaWx0ZXJpbmcgPSBkZWZlcihmaWx0ZXJpbmcpO1xyXG4gIGNvbnN0IHN0YXRlID0geyBjb3VudGVyOiAwLCBxdWVyeTogbnVsbCB9O1xyXG4gIGxldCBjYXRlZ29yeU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XHJcbiAgbGV0IHNlbGVjdGlvbiA9IG51bGw7XHJcbiAgbGV0IGV5ZTtcclxuICBsZXQgYXR0YWNobWVudCA9IGVsO1xyXG4gIGxldCBub25lTWF0Y2g7XHJcbiAgbGV0IHRleHRJbnB1dDtcclxuICBsZXQgYW55SW5wdXQ7XHJcbiAgbGV0IHJhbmNob3JsZWZ0O1xyXG4gIGxldCByYW5jaG9ycmlnaHQ7XHJcbiAgbGV0IGxhc3RQcmVmaXggPSAnJztcclxuICBjb25zdCBkZWJvdW5jZVRpbWUgPSBvLmRlYm91bmNlIHx8IDMwMDtcclxuICBjb25zdCBkZWJvdW5jZWRMb2FkaW5nID0gZGVib3VuY2UobG9hZGluZywgZGVib3VuY2VUaW1lKTtcclxuXHJcbiAgaWYgKG8uYXV0b0hpZGVPbkJsdXIgPT09IHZvaWQgMCkgeyBvLmF1dG9IaWRlT25CbHVyID0gdHJ1ZTsgfVxyXG4gIGlmIChvLmF1dG9IaWRlT25DbGljayA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkNsaWNrID0gdHJ1ZTsgfVxyXG4gIGlmIChvLmF1dG9TaG93T25VcERvd24gPT09IHZvaWQgMCkgeyBvLmF1dG9TaG93T25VcERvd24gPSBlbC50YWdOYW1lID09PSAnSU5QVVQnOyB9XHJcbiAgaWYgKG8uYW5jaG9yKSB7XHJcbiAgICByYW5jaG9ybGVmdCA9IG5ldyBSZWdFeHAoJ14nICsgby5hbmNob3IpO1xyXG4gICAgcmFuY2hvcnJpZ2h0ID0gbmV3IFJlZ0V4cChvLmFuY2hvciArICckJyk7XHJcbiAgfVxyXG5cclxuICBsZXQgaGFzSXRlbXMgPSBmYWxzZTtcclxuICBjb25zdCBhcGkgPSBlbWl0dGVyKHtcclxuICAgIGFuY2hvcjogby5hbmNob3IsXHJcbiAgICBjbGVhcixcclxuICAgIHNob3csXHJcbiAgICBoaWRlLFxyXG4gICAgdG9nZ2xlLFxyXG4gICAgZGVzdHJveSxcclxuICAgIHJlZnJlc2hQb3NpdGlvbixcclxuICAgIGFwcGVuZFRleHQsXHJcbiAgICBhcHBlbmRIVE1MLFxyXG4gICAgZmlsdGVyQW5jaG9yZWRUZXh0LFxyXG4gICAgZmlsdGVyQW5jaG9yZWRIVE1MLFxyXG4gICAgZGVmYXVsdEFwcGVuZFRleHQ6IGFwcGVuZFRleHQsXHJcbiAgICBkZWZhdWx0RmlsdGVyLFxyXG4gICAgZGVmYXVsdEl0ZW1SZW5kZXJlcixcclxuICAgIGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyLFxyXG4gICAgZGVmYXVsdFNldHRlcixcclxuICAgIHJldGFyZ2V0LFxyXG4gICAgYXR0YWNobWVudCxcclxuICAgIHNvdXJjZTogW11cclxuICB9KTtcclxuXHJcbiAgcmV0YXJnZXQoZWwpO1xyXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yaWVzKTtcclxuICBpZiAobm9NYXRjaGVzICYmIG5vTWF0Y2hlc1RleHQpIHtcclxuICAgIG5vbmVNYXRjaCA9IHRhZygnZGl2JywgJ3NleS1lbXB0eSBzZXktaGlkZScpO1xyXG4gICAgdGV4dChub25lTWF0Y2gsIG5vTWF0Y2hlc1RleHQpO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vbmVNYXRjaCk7XHJcbiAgfVxyXG4gIHBhcmVudC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xyXG4gIGVsLnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xyXG5cclxuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XHJcbiAgICBsb2FkZWQoc291cmNlLCBmYWxzZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXBpO1xyXG5cclxuICBmdW5jdGlvbiByZXRhcmdldCAoZWwpIHtcclxuICAgIGlucHV0RXZlbnRzKHRydWUpO1xyXG4gICAgYXR0YWNobWVudCA9IGFwaS5hdHRhY2htZW50ID0gZWw7XHJcbiAgICB0ZXh0SW5wdXQgPSBhdHRhY2htZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgYXR0YWNobWVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnO1xyXG4gICAgYW55SW5wdXQgPSB0ZXh0SW5wdXQgfHwgaXNFZGl0YWJsZShhdHRhY2htZW50KTtcclxuICAgIGlucHV0RXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWZyZXNoUG9zaXRpb24gKCkge1xyXG4gICAgaWYgKGV5ZSkgeyBleWUucmVmcmVzaCgpOyB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2FkaW5nIChmb3JjZVNob3cpIHtcclxuICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNyb3NzdmVudC5yZW1vdmUoYXR0YWNobWVudCwgJ2ZvY3VzJywgbG9hZGluZyk7XHJcbiAgICBjb25zdCBxdWVyeSA9IHJlYWRJbnB1dCgpO1xyXG4gICAgaWYgKHF1ZXJ5ID09PSBzdGF0ZS5xdWVyeSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBoYXNJdGVtcyA9IGZhbHNlO1xyXG4gICAgc3RhdGUucXVlcnkgPSBxdWVyeTtcclxuXHJcbiAgICBjb25zdCBjb3VudGVyID0gKytzdGF0ZS5jb3VudGVyO1xyXG5cclxuICAgIHNvdXJjZSh7IHF1ZXJ5LCBsaW1pdCB9LCBzb3VyY2VkKTtcclxuXHJcbiAgICBmdW5jdGlvbiBzb3VyY2VkIChlcnIsIHJlc3VsdCwgYmxhbmtRdWVyeSkge1xyXG4gICAgICBpZiAoc3RhdGUuY291bnRlciAhPT0gY291bnRlcikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBsb2FkZWQocmVzdWx0LCBmb3JjZVNob3cpO1xyXG4gICAgICBpZiAoZXJyIHx8IGJsYW5rUXVlcnkpIHtcclxuICAgICAgICBoYXNJdGVtcyA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2FkZWQgKGNhdGVnb3JpZXMsIGZvcmNlU2hvdykge1xyXG4gICAgY2xlYXIoKTtcclxuICAgIGhhc0l0ZW1zID0gdHJ1ZTtcclxuICAgIGFwaS5zb3VyY2UgPSBbXTtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChjYXQgPT4gY2F0Lmxpc3QuZm9yRWFjaChzdWdnZXN0aW9uID0+IGFkZChzdWdnZXN0aW9uLCBjYXQpKSk7XHJcbiAgICBpZiAoZm9yY2VTaG93KSB7XHJcbiAgICAgIHNob3coKTtcclxuICAgIH1cclxuICAgIGZpbHRlcmluZygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2xlYXIgKCkge1xyXG4gICAgdW5zZWxlY3QoKTtcclxuICAgIHdoaWxlIChjYXRlZ29yaWVzLmxhc3RDaGlsZCkge1xyXG4gICAgICBjYXRlZ29yaWVzLnJlbW92ZUNoaWxkKGNhdGVnb3JpZXMubGFzdENoaWxkKTtcclxuICAgIH1cclxuICAgIGNhdGVnb3J5TWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcclxuICAgIGhhc0l0ZW1zID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWFkSW5wdXQgKCkge1xyXG4gICAgcmV0dXJuICh0ZXh0SW5wdXQgPyBlbC52YWx1ZSA6IGVsLmlubmVySFRNTCkudHJpbSgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnkgKGRhdGEpIHtcclxuICAgIGlmICghZGF0YS5pZCkge1xyXG4gICAgICBkYXRhLmlkID0gJ2RlZmF1bHQnO1xyXG4gICAgfVxyXG4gICAgaWYgKCFjYXRlZ29yeU1hcFtkYXRhLmlkXSkge1xyXG4gICAgICBjYXRlZ29yeU1hcFtkYXRhLmlkXSA9IGNyZWF0ZUNhdGVnb3J5KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2F0ZWdvcnlNYXBbZGF0YS5pZF07XHJcbiAgICBmdW5jdGlvbiBjcmVhdGVDYXRlZ29yeSAoKSB7XHJcbiAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3J5Jyk7XHJcbiAgICAgIGNvbnN0IHVsID0gdGFnKCd1bCcsICdzZXktbGlzdCcpO1xyXG4gICAgICByZW5kZXJDYXRlZ29yeShjYXRlZ29yeSwgZGF0YSk7XHJcbiAgICAgIGNhdGVnb3J5LmFwcGVuZENoaWxkKHVsKTtcclxuICAgICAgY2F0ZWdvcmllcy5hcHBlbmRDaGlsZChjYXRlZ29yeSk7XHJcbiAgICAgIHJldHVybiB7IGRhdGEsIHVsIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhZGQgKHN1Z2dlc3Rpb24sIGNhdGVnb3J5RGF0YSkge1xyXG4gICAgY29uc3QgY2F0ID0gZ2V0Q2F0ZWdvcnkoY2F0ZWdvcnlEYXRhKTtcclxuICAgIGNvbnN0IGxpID0gdGFnKCdsaScsICdzZXktaXRlbScpO1xyXG4gICAgcmVuZGVySXRlbShsaSwgc3VnZ2VzdGlvbik7XHJcbiAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcclxuICAgICAgYnJlYWt1cEZvckhpZ2hsaWdodGVyKGxpKTtcclxuICAgIH1cclxuICAgIGNyb3NzdmVudC5hZGQobGksICdtb3VzZWVudGVyJywgaG92ZXJTdWdnZXN0aW9uKTtcclxuICAgIGNyb3NzdmVudC5hZGQobGksICdjbGljaycsIGNsaWNrZWRTdWdnZXN0aW9uKTtcclxuICAgIGNyb3NzdmVudC5hZGQobGksICdob3JzZXktZmlsdGVyJywgZmlsdGVySXRlbSk7XHJcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnaG9yc2V5LWhpZGUnLCBoaWRlSXRlbSk7XHJcbiAgICBjYXQudWwuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgYXBpLnNvdXJjZS5wdXNoKHN1Z2dlc3Rpb24pO1xyXG4gICAgcmV0dXJuIGxpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGhvdmVyU3VnZ2VzdGlvbiAoKSB7XHJcbiAgICAgIHNlbGVjdChsaSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xpY2tlZFN1Z2dlc3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBpbnB1dCA9IGdldFRleHQoc3VnZ2VzdGlvbik7XHJcbiAgICAgIHNldChzdWdnZXN0aW9uKTtcclxuICAgICAgaGlkZSgpO1xyXG4gICAgICBhdHRhY2htZW50LmZvY3VzKCk7XHJcbiAgICAgIGxhc3RQcmVmaXggPSBvLnByZWRpY3ROZXh0U2VhcmNoICYmIG8ucHJlZGljdE5leHRTZWFyY2goe1xyXG4gICAgICAgIGlucHV0OiBpbnB1dCxcclxuICAgICAgICBzb3VyY2U6IGFwaS5zb3VyY2Uuc2xpY2UoKSxcclxuICAgICAgICBzZWxlY3Rpb246IHN1Z2dlc3Rpb25cclxuICAgICAgfSkgfHwgJyc7XHJcbiAgICAgIGlmIChsYXN0UHJlZml4KSB7XHJcbiAgICAgICAgZWwudmFsdWUgPSBsYXN0UHJlZml4O1xyXG4gICAgICAgIGVsLnNlbGVjdCgpO1xyXG4gICAgICAgIHNob3coKTtcclxuICAgICAgICBmaWx0ZXJpbmcoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZpbHRlckl0ZW0gKCkge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xyXG4gICAgICBpZiAoZmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKSkge1xyXG4gICAgICAgIGxpLmNsYXNzTmFtZSA9IGxpLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LWhpZGUvZywgJycpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUobGksICdob3JzZXktaGlkZScpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGlkZUl0ZW0gKCkge1xyXG4gICAgICBpZiAoIWhpZGRlbihsaSkpIHtcclxuICAgICAgICBsaS5jbGFzc05hbWUgKz0gJyBzZXktaGlkZSc7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbiA9PT0gbGkpIHtcclxuICAgICAgICAgIHVuc2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBicmVha3VwRm9ySGlnaGxpZ2h0ZXIgKGVsKSB7XHJcbiAgICBnZXRUZXh0Q2hpbGRyZW4oZWwpLmZvckVhY2goZWwgPT4ge1xyXG4gICAgICBjb25zdCBwYXJlbnQgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICBjb25zdCB0ZXh0ID0gZWwudGV4dENvbnRlbnQgfHwgZWwubm9kZVZhbHVlIHx8ICcnO1xyXG4gICAgICBpZiAodGV4dC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChsZXQgY2hhciBvZiB0ZXh0KSB7XHJcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShzcGFuRm9yKGNoYXIpLCBlbCk7XHJcbiAgICAgIH1cclxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsKTtcclxuICAgICAgZnVuY3Rpb24gc3BhbkZvciAoY2hhcikge1xyXG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gJ3NleS1jaGFyJztcclxuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gc3Bhbi5pbm5lclRleHQgPSBjaGFyO1xyXG4gICAgICAgIHJldHVybiBzcGFuO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodCAoZWwsIG5lZWRsZSkge1xyXG4gICAgY29uc3QgcndvcmQgPSAvW1xccywuX1xcW1xcXXt9KCktXS9nO1xyXG4gICAgY29uc3Qgd29yZHMgPSBuZWVkbGUuc3BsaXQocndvcmQpLmZpbHRlcih3ID0+IHcubGVuZ3RoKTtcclxuICAgIGNvbnN0IGVsZW1zID0gWy4uLmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zZXktY2hhcicpXTtcclxuICAgIGxldCBjaGFycztcclxuICAgIGxldCBzdGFydEluZGV4ID0gMDtcclxuXHJcbiAgICBiYWxhbmNlKCk7XHJcbiAgICBpZiAoaGlnaGxpZ2h0Q29tcGxldGVXb3Jkcykge1xyXG4gICAgICB3aG9sZSgpO1xyXG4gICAgfVxyXG4gICAgZnV6enkoKTtcclxuICAgIGNsZWFyUmVtYWluZGVyKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gYmFsYW5jZSAoKSB7XHJcbiAgICAgIGNoYXJzID0gZWxlbXMubWFwKGVsID0+IGVsLmlubmVyVGV4dCB8fCBlbC50ZXh0Q29udGVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2hvbGUgKCkge1xyXG4gICAgICBmb3IgKGxldCB3b3JkIG9mIHdvcmRzKSB7XHJcbiAgICAgICAgbGV0IHRlbXBJbmRleCA9IHN0YXJ0SW5kZXg7XHJcbiAgICAgICAgcmV0cnk6IHdoaWxlICh0ZW1wSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICBsZXQgaW5pdCA9IHRydWU7XHJcbiAgICAgICAgICBsZXQgcHJldkluZGV4ID0gdGVtcEluZGV4O1xyXG4gICAgICAgICAgZm9yIChsZXQgY2hhciBvZiB3b3JkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBjaGFycy5pbmRleE9mKGNoYXIsIHByZXZJbmRleCArIDEpO1xyXG4gICAgICAgICAgICBjb25zdCBmYWlsID0gaSA9PT0gLTEgfHwgKCFpbml0ICYmIHByZXZJbmRleCArIDEgIT09IGkpO1xyXG4gICAgICAgICAgICBpZiAoaW5pdCkge1xyXG4gICAgICAgICAgICAgIGluaXQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICB0ZW1wSW5kZXggPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChmYWlsKSB7XHJcbiAgICAgICAgICAgICAgY29udGludWUgcmV0cnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcHJldkluZGV4ID0gaTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGZvciAobGV0IGVsIG9mIGVsZW1zLnNwbGljZSh0ZW1wSW5kZXgsIDEgKyBwcmV2SW5kZXggLSB0ZW1wSW5kZXgpKSB7XHJcbiAgICAgICAgICAgIG9uKGVsKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJhbGFuY2UoKTtcclxuICAgICAgICAgIG5lZWRsZSA9IG5lZWRsZS5yZXBsYWNlKHdvcmQsICcnKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZ1enp5ICgpIHtcclxuICAgICAgZm9yIChsZXQgaW5wdXQgb2YgbmVlZGxlKSB7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgbGV0IGVsID0gZWxlbXMuc2hpZnQoKTtcclxuICAgICAgICAgIGlmICgoZWwuaW5uZXJUZXh0IHx8IGVsLnRleHRDb250ZW50KSA9PT0gaW5wdXQpIHtcclxuICAgICAgICAgICAgb24oZWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9mZihlbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYXJSZW1haW5kZXIgKCkge1xyXG4gICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgb2ZmKGVsZW1zLnNoaWZ0KCkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb24gKGNoKSB7XHJcbiAgICAgIGNoLmNsYXNzTGlzdC5hZGQoJ3NleS1jaGFyLWhpZ2hsaWdodCcpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gb2ZmIChjaCkge1xyXG4gICAgICBjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktY2hhci1oaWdobGlnaHQnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFRleHRDaGlsZHJlbiAoZWwpIHtcclxuICAgIGNvbnN0IHRleHRzID0gW107XHJcbiAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpO1xyXG4gICAgbGV0IG5vZGU7XHJcbiAgICB3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgIHRleHRzLnB1c2gobm9kZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGV4dHM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzZXQgKHZhbHVlKSB7XHJcbiAgICBpZiAoby5hbmNob3IpIHtcclxuICAgICAgcmV0dXJuIChpc1RleHQoKSA/IGFwaS5hcHBlbmRUZXh0IDogYXBpLmFwcGVuZEhUTUwpKGdldFZhbHVlKHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICB1c2VyU2V0KHZhbHVlKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbHRlciAodmFsdWUsIHN1Z2dlc3Rpb24pIHtcclxuICAgIGlmIChvLmFuY2hvcikge1xyXG4gICAgICBjb25zdCBpbCA9IChpc1RleHQoKSA/IGFwaS5maWx0ZXJBbmNob3JlZFRleHQgOiBhcGkuZmlsdGVyQW5jaG9yZWRIVE1MKSh2YWx1ZSwgc3VnZ2VzdGlvbik7XHJcbiAgICAgIHJldHVybiBpbCA/IHVzZXJGaWx0ZXIoaWwuaW5wdXQsIGlsLnN1Z2dlc3Rpb24pIDogZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXNlckZpbHRlcih2YWx1ZSwgc3VnZ2VzdGlvbik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpc1RleHQgKCkgeyByZXR1cm4gaXNJbnB1dChhdHRhY2htZW50KTsgfVxyXG4gIGZ1bmN0aW9uIHZpc2libGUgKCkgeyByZXR1cm4gY29udGFpbmVyLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktc2hvdycpICE9PSAtMTsgfVxyXG4gIGZ1bmN0aW9uIGhpZGRlbiAobGkpIHsgcmV0dXJuIGxpLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktaGlkZScpICE9PSAtMTsgfVxyXG5cclxuICBmdW5jdGlvbiBzaG93ICgpIHtcclxuICAgIGV5ZS5yZWZyZXNoKCk7XHJcbiAgICBpZiAoIXZpc2libGUoKSkge1xyXG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgc2V5LXNob3cnO1xyXG4gICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktc2hvdycpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlciAoZSkge1xyXG4gICAgY29uc3QgbGVmdCA9IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5O1xyXG4gICAgaWYgKGxlZnQgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybjsgLy8gd2Ugb25seSBjYXJlIGFib3V0IGhvbmVzdCB0byBnb2QgbGVmdC1jbGlja3NcclxuICAgIH1cclxuICAgIHRvZ2dsZSgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlICgpIHtcclxuICAgIGlmICghdmlzaWJsZSgpKSB7XHJcbiAgICAgIHNob3coKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhpZGUoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNlbGVjdCAobGkpIHtcclxuICAgIHVuc2VsZWN0KCk7XHJcbiAgICBpZiAobGkpIHtcclxuICAgICAgc2VsZWN0aW9uID0gbGk7XHJcbiAgICAgIHNlbGVjdGlvbi5jbGFzc05hbWUgKz0gJyBzZXktc2VsZWN0ZWQnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdW5zZWxlY3QgKCkge1xyXG4gICAgaWYgKHNlbGVjdGlvbikge1xyXG4gICAgICBzZWxlY3Rpb24uY2xhc3NOYW1lID0gc2VsZWN0aW9uLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LXNlbGVjdGVkL2csICcnKTtcclxuICAgICAgc2VsZWN0aW9uID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmUgKHVwLCBtb3Zlcykge1xyXG4gICAgY29uc3QgdG90YWwgPSBhcGkuc291cmNlLmxlbmd0aDtcclxuICAgIGlmICh0b3RhbCA9PT0gMCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAobW92ZXMgPiB0b3RhbCkge1xyXG4gICAgICB1bnNlbGVjdCgpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBjYXQgPSBmaW5kQ2F0ZWdvcnkoc2VsZWN0aW9uKSB8fCBjYXRlZ29yaWVzLmZpcnN0Q2hpbGQ7XHJcbiAgICBjb25zdCBmaXJzdCA9IHVwID8gJ2xhc3RDaGlsZCcgOiAnZmlyc3RDaGlsZCc7XHJcbiAgICBjb25zdCBsYXN0ID0gdXAgPyAnZmlyc3RDaGlsZCcgOiAnbGFzdENoaWxkJztcclxuICAgIGNvbnN0IG5leHQgPSB1cCA/ICdwcmV2aW91c1NpYmxpbmcnIDogJ25leHRTaWJsaW5nJztcclxuICAgIGNvbnN0IHByZXYgPSB1cCA/ICduZXh0U2libGluZycgOiAncHJldmlvdXNTaWJsaW5nJztcclxuICAgIGNvbnN0IGxpID0gZmluZE5leHQoKTtcclxuICAgIHNlbGVjdChsaSk7XHJcblxyXG4gICAgaWYgKGhpZGRlbihsaSkpIHtcclxuICAgICAgbW92ZSh1cCwgbW92ZXMgPyBtb3ZlcyArIDEgOiAxKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmaW5kQ2F0ZWdvcnkgKGVsKSB7XHJcbiAgICAgIHdoaWxlIChlbCkge1xyXG4gICAgICAgIGlmIChzZWt0b3IubWF0Y2hlc1NlbGVjdG9yKGVsLnBhcmVudEVsZW1lbnQsICcuc2V5LWNhdGVnb3J5JykpIHtcclxuICAgICAgICAgIHJldHVybiBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZmluZE5leHQgKCkge1xyXG4gICAgICBpZiAoc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbltuZXh0XSkge1xyXG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbltuZXh0XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNhdFtuZXh0XSAmJiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XSkge1xyXG4gICAgICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdFtuZXh0XSlbZmlyc3RdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmluZExpc3QoY2F0ZWdvcmllc1tmaXJzdF0pW2ZpcnN0XTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhpZGUgKCkge1xyXG4gICAgZXllLnNsZWVwKCk7XHJcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LXNob3cvZywgJycpO1xyXG4gICAgdW5zZWxlY3QoKTtcclxuICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1oaWRlJyk7XHJcbiAgICBpZiAoZWwudmFsdWUgPT09IGxhc3RQcmVmaXgpIHtcclxuICAgICAgZWwudmFsdWUgPSAnJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGtleWRvd24gKGUpIHtcclxuICAgIGNvbnN0IHNob3duID0gdmlzaWJsZSgpO1xyXG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcclxuICAgIGlmICh3aGljaCA9PT0gS0VZX0RPV04pIHtcclxuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xyXG4gICAgICAgIHNob3coKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoc2hvd24pIHtcclxuICAgICAgICBtb3ZlKCk7XHJcbiAgICAgICAgc3RvcChlKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX1VQKSB7XHJcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcclxuICAgICAgICBzaG93KCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNob3duKSB7XHJcbiAgICAgICAgbW92ZSh0cnVlKTtcclxuICAgICAgICBzdG9wKGUpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfQkFDS1NQQUNFKSB7XHJcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcclxuICAgICAgICBzaG93KCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoc2hvd24pIHtcclxuICAgICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcclxuICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKHNlbGVjdGlvbiwgJ2NsaWNrJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RvcChlKTtcclxuICAgICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0VTQykge1xyXG4gICAgICAgIGhpZGUoKTtcclxuICAgICAgICBzdG9wKGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzdG9wIChlKSB7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2hvd05vUmVzdWx0cyAoKSB7XHJcbiAgICBpZiAobm9uZU1hdGNoKSB7XHJcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktaGlkZScpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaGlkZU5vUmVzdWx0cyAoKSB7XHJcbiAgICBpZiAobm9uZU1hdGNoKSB7XHJcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QuYWRkKCdzZXktaGlkZScpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmlsdGVyaW5nICgpIHtcclxuICAgIGlmICghdmlzaWJsZSgpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGRlYm91bmNlZExvYWRpbmcodHJ1ZSk7XHJcbiAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktZmlsdGVyJyk7XHJcbiAgICBjb25zdCB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xyXG4gICAgaWYgKCFvLmJsYW5rU2VhcmNoICYmICF2YWx1ZSkge1xyXG4gICAgICBoaWRlKCk7IHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IG5vbWF0Y2ggPSBub01hdGNoZXMoeyBxdWVyeTogdmFsdWUgfSk7XHJcbiAgICBsZXQgY291bnQgPSB3YWxrQ2F0ZWdvcmllcygpO1xyXG4gICAgaWYgKGNvdW50ID09PSAwICYmIG5vbWF0Y2ggJiYgaGFzSXRlbXMpIHtcclxuICAgICAgc2hvd05vUmVzdWx0cygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGlkZU5vUmVzdWx0cygpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFzZWxlY3Rpb24pIHtcclxuICAgICAgbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFzZWxlY3Rpb24gJiYgIW5vbWF0Y2gpIHtcclxuICAgICAgaGlkZSgpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gd2Fsa0NhdGVnb3JpZXMgKCkge1xyXG4gICAgICBsZXQgY2F0ZWdvcnkgPSBjYXRlZ29yaWVzLmZpcnN0Q2hpbGQ7XHJcbiAgICAgIGxldCBjb3VudCA9IDA7XHJcbiAgICAgIHdoaWxlIChjYXRlZ29yeSkge1xyXG4gICAgICAgIGNvbnN0IGxpc3QgPSBmaW5kTGlzdChjYXRlZ29yeSk7XHJcbiAgICAgICAgY29uc3QgcGFydGlhbCA9IHdhbGtDYXRlZ29yeShsaXN0KTtcclxuICAgICAgICBpZiAocGFydGlhbCA9PT0gMCkge1xyXG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LmFkZCgnc2V5LWhpZGUnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY291bnQgKz0gcGFydGlhbDtcclxuICAgICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5Lm5leHRTaWJsaW5nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb3VudDtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHdhbGtDYXRlZ29yeSAodWwpIHtcclxuICAgICAgbGV0IGxpID0gdWwuZmlyc3RDaGlsZDtcclxuICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgd2hpbGUgKGxpKSB7XHJcbiAgICAgICAgaWYgKGNvdW50ID49IGxpbWl0KSB7XHJcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShsaSwgJ2hvcnNleS1maWx0ZXInKTtcclxuICAgICAgICAgIGlmIChsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgaWYgKGhpZ2hsaWdodGVyKSB7XHJcbiAgICAgICAgICAgICAgaGlnaGxpZ2h0KGxpLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgbGkgPSBsaS5uZXh0U2libGluZztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gY291bnQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZWZlcnJlZEZpbHRlcmluZ05vRW50ZXIgKGUpIHtcclxuICAgIGNvbnN0IHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XHJcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBkZWZlcnJlZEZpbHRlcmluZygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZGVmZXJyZWRTaG93IChlKSB7XHJcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xyXG4gICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIgfHwgd2hpY2ggPT09IEtFWV9UQUIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc2V0VGltZW91dChzaG93LCAwKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGF1dG9jb21wbGV0ZUV2ZW50VGFyZ2V0IChlKSB7XHJcbiAgICBsZXQgdGFyZ2V0ID0gZS50YXJnZXQ7XHJcbiAgICBpZiAodGFyZ2V0ID09PSBhdHRhY2htZW50KSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKHRhcmdldCkge1xyXG4gICAgICBpZiAodGFyZ2V0ID09PSBjb250YWluZXIgfHwgdGFyZ2V0ID09PSBhdHRhY2htZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBoaWRlT25CbHVyIChlKSB7XHJcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xyXG4gICAgaWYgKHdoaWNoID09PSBLRVlfVEFCKSB7XHJcbiAgICAgIGhpZGUoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGhpZGVPbkNsaWNrIChlKSB7XHJcbiAgICBpZiAoYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQoZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaGlkZSgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5wdXRFdmVudHMgKHJlbW92ZSkge1xyXG4gICAgY29uc3Qgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xyXG4gICAgaWYgKGV5ZSkge1xyXG4gICAgICBleWUuZGVzdHJveSgpO1xyXG4gICAgICBleWUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKCFyZW1vdmUpIHtcclxuICAgICAgZXllID0gYnVsbHNleWUoY29udGFpbmVyLCBhdHRhY2htZW50LCB7XHJcbiAgICAgICAgY2FyZXQ6IGFueUlucHV0ICYmIGF0dGFjaG1lbnQudGFnTmFtZSAhPT0gJ0lOUFVUJyxcclxuICAgICAgICBjb250ZXh0OiBvLmFwcGVuZFRvXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoIXZpc2libGUoKSkgeyBleWUuc2xlZXAoKTsgfVxyXG4gICAgfVxyXG4gICAgaWYgKHJlbW92ZSB8fCAoYW55SW5wdXQgJiYgZG9jLmFjdGl2ZUVsZW1lbnQgIT09IGF0dGFjaG1lbnQpKSB7XHJcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2ZvY3VzJywgbG9hZGluZyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2FkaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYW55SW5wdXQpIHtcclxuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZFNob3cpO1xyXG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlwcmVzcycsIGRlZmVycmVkRmlsdGVyaW5nKTtcclxuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGRlZmVycmVkRmlsdGVyaW5nTm9FbnRlcik7XHJcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ3Bhc3RlJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xyXG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywga2V5ZG93bik7XHJcbiAgICAgIGlmIChvLmF1dG9IaWRlT25CbHVyKSB7IGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBoaWRlT25CbHVyKTsgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAnY2xpY2snLCB0b2dnbGVyKTtcclxuICAgICAgY3Jvc3N2ZW50W29wXShkb2NFbGVtZW50LCAna2V5ZG93bicsIGtleWRvd24pO1xyXG4gICAgfVxyXG4gICAgaWYgKG8uYXV0b0hpZGVPbkNsaWNrKSB7IGNyb3NzdmVudFtvcF0oZG9jLCAnY2xpY2snLCBoaWRlT25DbGljayk7IH1cclxuICAgIGlmIChmb3JtKSB7IGNyb3NzdmVudFtvcF0oZm9ybSwgJ3N1Ym1pdCcsIGhpZGUpOyB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcclxuICAgIGlucHV0RXZlbnRzKHRydWUpO1xyXG4gICAgaWYgKHBhcmVudC5jb250YWlucyhjb250YWluZXIpKSB7IHBhcmVudC5yZW1vdmVDaGlsZChjb250YWluZXIpOyB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZWZhdWx0U2V0dGVyICh2YWx1ZSkge1xyXG4gICAgaWYgKHRleHRJbnB1dCkge1xyXG4gICAgICBpZiAoc2V0QXBwZW5kcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGVsLnZhbHVlICs9ICcgJyArIHZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MICs9ICcgJyArIHZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZWZhdWx0SXRlbVJlbmRlcmVyIChsaSwgc3VnZ2VzdGlvbikge1xyXG4gICAgdGV4dChsaSwgZ2V0VGV4dChzdWdnZXN0aW9uKSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlciAoZGl2LCBkYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pZCAhPT0gJ2RlZmF1bHQnKSB7XHJcbiAgICAgIGNvbnN0IGlkID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3J5LWlkJyk7XHJcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChpZCk7XHJcbiAgICAgIHRleHQoaWQsIGRhdGEuaWQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZGVmYXVsdEZpbHRlciAocSwgc3VnZ2VzdGlvbikge1xyXG4gICAgY29uc3QgbmVlZGxlID0gcS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgY29uc3QgdGV4dCA9IGdldFRleHQoc3VnZ2VzdGlvbikgfHwgJyc7XHJcbiAgICBpZiAoZnV6enlzZWFyY2gobmVlZGxlLCB0ZXh0LnRvTG93ZXJDYXNlKCkpKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShzdWdnZXN0aW9uKSB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdXp6eXNlYXJjaChuZWVkbGUsIHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbG9vcGJhY2tUb0FuY2hvciAodGV4dCwgcCkge1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG4gICAgbGV0IGFuY2hvcmVkID0gZmFsc2U7XHJcbiAgICBsZXQgc3RhcnQgPSBwLnN0YXJ0O1xyXG4gICAgd2hpbGUgKGFuY2hvcmVkID09PSBmYWxzZSAmJiBzdGFydCA+PSAwKSB7XHJcbiAgICAgIHJlc3VsdCA9IHRleHQuc3Vic3RyKHN0YXJ0IC0gMSwgcC5zdGFydCAtIHN0YXJ0ICsgMSk7XHJcbiAgICAgIGFuY2hvcmVkID0gcmFuY2hvcmxlZnQudGVzdChyZXN1bHQpO1xyXG4gICAgICBzdGFydC0tO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGV4dDogYW5jaG9yZWQgPyByZXN1bHQgOiBudWxsLFxyXG4gICAgICBzdGFydFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkVGV4dCAocSwgc3VnZ2VzdGlvbikge1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSBzZWxsKGVsKTtcclxuICAgIGNvbnN0IGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihxLCBwb3NpdGlvbikudGV4dDtcclxuICAgIGlmIChpbnB1dCkge1xyXG4gICAgICByZXR1cm4geyBpbnB1dCwgc3VnZ2VzdGlvbiB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYXBwZW5kVGV4dCAodmFsdWUpIHtcclxuICAgIGNvbnN0IGN1cnJlbnQgPSBlbC52YWx1ZTtcclxuICAgIGNvbnN0IHBvc2l0aW9uID0gc2VsbChlbCk7XHJcbiAgICBjb25zdCBpbnB1dCA9IGxvb3BiYWNrVG9BbmNob3IoY3VycmVudCwgcG9zaXRpb24pO1xyXG4gICAgY29uc3QgbGVmdCA9IGN1cnJlbnQuc3Vic3RyKDAsIGlucHV0LnN0YXJ0KTtcclxuICAgIGNvbnN0IHJpZ2h0ID0gY3VycmVudC5zdWJzdHIoaW5wdXQuc3RhcnQgKyBpbnB1dC50ZXh0Lmxlbmd0aCArIChwb3NpdGlvbi5lbmQgLSBwb3NpdGlvbi5zdGFydCkpO1xyXG4gICAgY29uc3QgYmVmb3JlID0gbGVmdCArIHZhbHVlICsgJyAnO1xyXG5cclxuICAgIGVsLnZhbHVlID0gYmVmb3JlICsgcmlnaHQ7XHJcbiAgICBzZWxsKGVsLCB7IHN0YXJ0OiBiZWZvcmUubGVuZ3RoLCBlbmQ6IGJlZm9yZS5sZW5ndGggfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmaWx0ZXJBbmNob3JlZEhUTUwgKCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFwcGVuZEhUTUwgKCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmRMaXN0IChjYXRlZ29yeSkgeyByZXR1cm4gc2VrdG9yKCcuc2V5LWxpc3QnLCBjYXRlZ29yeSlbMF07IH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNJbnB1dCAoZWwpIHsgcmV0dXJuIGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJzsgfVxyXG5cclxuZnVuY3Rpb24gdGFnICh0eXBlLCBjbGFzc05hbWUpIHtcclxuICBjb25zdCBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHR5cGUpO1xyXG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmVyIChmbikgeyByZXR1cm4gZnVuY3Rpb24gKCkgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTsgfVxyXG5mdW5jdGlvbiB0ZXh0IChlbCwgdmFsdWUpIHsgZWwuaW5uZXJUZXh0ID0gZWwudGV4dENvbnRlbnQgPSB2YWx1ZTsgfVxyXG5cclxuZnVuY3Rpb24gaXNFZGl0YWJsZSAoZWwpIHtcclxuICBjb25zdCB2YWx1ZSA9IGVsLmdldEF0dHJpYnV0ZSgnY29udGVudEVkaXRhYmxlJyk7XHJcbiAgaWYgKHZhbHVlID09PSAnZmFsc2UnKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIGlmICh2YWx1ZSA9PT0gJ3RydWUnKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgaWYgKGVsLnBhcmVudEVsZW1lbnQpIHtcclxuICAgIHJldHVybiBpc0VkaXRhYmxlKGVsLnBhcmVudEVsZW1lbnQpO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaG9yc2V5O1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciB0YWlsb3JtYWRlID0gcmVxdWlyZSgnLi90YWlsb3JtYWRlJyk7XG5cbmZ1bmN0aW9uIGJ1bGxzZXllIChlbCwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucztcbiAgdmFyIGRvbVRhcmdldCA9IHRhcmdldCAmJiB0YXJnZXQudGFnTmFtZTtcblxuICBpZiAoIWRvbVRhcmdldCAmJiBhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgbyA9IHRhcmdldDtcbiAgfVxuICBpZiAoIWRvbVRhcmdldCkge1xuICAgIHRhcmdldCA9IGVsO1xuICB9XG4gIGlmICghbykgeyBvID0ge307IH1cblxuICB2YXIgZGVzdHJveWVkID0gZmFsc2U7XG4gIHZhciB0aHJvdHRsZWRXcml0ZSA9IHRocm90dGxlKHdyaXRlLCAzMCk7XG4gIHZhciB0YWlsb3JPcHRpb25zID0geyB1cGRhdGU6IG8uYXV0b3VwZGF0ZVRvQ2FyZXQgIT09IGZhbHNlICYmIHVwZGF0ZSB9O1xuICB2YXIgdGFpbG9yID0gby5jYXJldCAmJiB0YWlsb3JtYWRlKHRhcmdldCwgdGFpbG9yT3B0aW9ucyk7XG5cbiAgd3JpdGUoKTtcblxuICBpZiAoby50cmFja2luZyAhPT0gZmFsc2UpIHtcbiAgICBjcm9zc3ZlbnQuYWRkKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVhZDogcmVhZE51bGwsXG4gICAgcmVmcmVzaDogd3JpdGUsXG4gICAgZGVzdHJveTogZGVzdHJveSxcbiAgICBzbGVlcDogc2xlZXBcbiAgfTtcblxuICBmdW5jdGlvbiBzbGVlcCAoKSB7XG4gICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkTnVsbCAoKSB7IHJldHVybiByZWFkKCk7IH1cblxuICBmdW5jdGlvbiByZWFkIChyZWFkaW5ncykge1xuICAgIHZhciBib3VuZHMgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgaWYgKHRhaWxvcikge1xuICAgICAgcmVhZGluZ3MgPSB0YWlsb3IucmVhZCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogKHJlYWRpbmdzLmFic29sdXRlID8gMCA6IGJvdW5kcy5sZWZ0KSArIHJlYWRpbmdzLngsXG4gICAgICAgIHk6IChyZWFkaW5ncy5hYnNvbHV0ZSA/IDAgOiBib3VuZHMudG9wKSArIHNjcm9sbFRvcCArIHJlYWRpbmdzLnkgKyAyMFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGJvdW5kcy5sZWZ0LFxuICAgICAgeTogYm91bmRzLnRvcCArIHNjcm9sbFRvcFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUgKHJlYWRpbmdzKSB7XG4gICAgd3JpdGUocmVhZGluZ3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKHJlYWRpbmdzKSB7XG4gICAgaWYgKGRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWxsc2V5ZSBjYW5cXCd0IHJlZnJlc2ggYWZ0ZXIgYmVpbmcgZGVzdHJveWVkLiBDcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICBpZiAodGFpbG9yICYmICFyZWFkaW5ncykge1xuICAgICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgdGFpbG9yLnJlZnJlc2goKTsgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcCA9IHJlYWQocmVhZGluZ3MpO1xuICAgIGlmICghdGFpbG9yICYmIHRhcmdldCAhPT0gZWwpIHtcbiAgICAgIHAueSArPSB0YXJnZXQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IG8uY29udGV4dDtcbiAgICBlbC5zdHlsZS5sZWZ0ID0gcC54ICsgJ3B4JztcbiAgICBlbC5zdHlsZS50b3AgPSAoY29udGV4dCA/IGNvbnRleHQub2Zmc2V0SGVpZ2h0IDogcC55KSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBpZiAodGFpbG9yKSB7IHRhaWxvci5kZXN0cm95KCk7IH1cbiAgICBjcm9zc3ZlbnQucmVtb3ZlKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYnVsbHNleWU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb247XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGdldFNlbGVjdGlvblJhdyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uUmF3Jyk7XG52YXIgZ2V0U2VsZWN0aW9uTnVsbE9wID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25OdWxsT3AnKTtcbnZhciBnZXRTZWxlY3Rpb25TeW50aGV0aWMgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblN5bnRoZXRpYycpO1xudmFyIGlzSG9zdCA9IHJlcXVpcmUoJy4vaXNIb3N0Jyk7XG5pZiAoaXNIb3N0Lm1ldGhvZChnbG9iYWwsICdnZXRTZWxlY3Rpb24nKSkge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25SYXc7XG59IGVsc2UgaWYgKHR5cGVvZiBkb2Muc2VsZWN0aW9uID09PSAnb2JqZWN0JyAmJiBkb2Muc2VsZWN0aW9uKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblN5bnRoZXRpYztcbn0gZWxzZSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbk51bGxPcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uTnVsbE9wICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZW1vdmVBbGxSYW5nZXM6IG5vb3AsXG4gICAgYWRkUmFuZ2U6IG5vb3BcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb25OdWxsT3A7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvblJhdyAoKSB7XG4gIHJldHVybiBnbG9iYWwuZ2V0U2VsZWN0aW9uKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uUmF3O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG52YXIgR2V0U2VsZWN0aW9uUHJvdG8gPSBHZXRTZWxlY3Rpb24ucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBHZXRTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciByYW5nZSA9IHNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuXG4gIHRoaXMuX3NlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgdGhpcy5fcmFuZ2VzID0gW107XG5cbiAgaWYgKHNlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbGYpO1xuICB9IGVsc2UgaWYgKGlzVGV4dFJhbmdlKHJhbmdlKSkge1xuICAgIHVwZGF0ZUZyb21UZXh0UmFuZ2Uoc2VsZiwgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbGYpO1xuICB9XG59XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZUFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRleHRSYW5nZTtcbiAgdHJ5IHtcbiAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgIT09ICdOb25lJykge1xuICAgICAgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgIHRleHRSYW5nZS5zZWxlY3QoKTtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5lbXB0eSgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uYWRkUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZSk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShyYW5nZSkuc2VsZWN0KCk7XG4gICAgdGhpcy5fcmFuZ2VzWzBdID0gcmFuZ2U7XG4gICAgdGhpcy5yYW5nZUNvdW50ID0gMTtcbiAgICB0aGlzLmlzQ29sbGFwc2VkID0gdGhpcy5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZSh0aGlzLCByYW5nZSwgZmFsc2UpO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRSYW5nZXMgPSBmdW5jdGlvbiAocmFuZ2VzKSB7XG4gIHRoaXMucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHZhciByYW5nZUNvdW50ID0gcmFuZ2VzLmxlbmd0aDtcbiAgaWYgKHJhbmdlQ291bnQgPiAxKSB7XG4gICAgY3JlYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZXMpO1xuICB9IGVsc2UgaWYgKHJhbmdlQ291bnQpIHtcbiAgICB0aGlzLmFkZFJhbmdlKHJhbmdlc1swXSk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldFJhbmdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnJhbmdlQ291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFJhbmdlQXQoKTogaW5kZXggb3V0IG9mIGJvdW5kcycpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9yYW5nZXNbaW5kZXhdLmNsb25lUmFuZ2UoKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8ucmVtb3ZlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnQ29udHJvbCcpIHtcbiAgICByZW1vdmVSYW5nZU1hbnVhbGx5KHRoaXMsIHJhbmdlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHRoaXMuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgcmFuZ2VFbGVtZW50ID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZSk7XG4gIHZhciBuZXdDb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICB2YXIgZWw7XG4gIHZhciByZW1vdmVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGNvbnRyb2xSYW5nZS5pdGVtKGkpO1xuICAgIGlmIChlbCAhPT0gcmFuZ2VFbGVtZW50IHx8IHJlbW92ZWQpIHtcbiAgICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgbmV3Q29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZWFjaFJhbmdlID0gZnVuY3Rpb24gKGZuLCByZXR1cm5WYWx1ZSkge1xuICB2YXIgaSA9IDA7XG4gIHZhciBsZW4gPSB0aGlzLl9yYW5nZXMubGVuZ3RoO1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoZm4odGhpcy5nZXRSYW5nZUF0KGkpKSkge1xuICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZ2V0QWxsUmFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmFuZ2VzID0gW107XG4gIHRoaXMuZWFjaFJhbmdlKGZ1bmN0aW9uIChyYW5nZSkge1xuICAgIHJhbmdlcy5wdXNoKHJhbmdlKTtcbiAgfSk7XG4gIHJldHVybiByYW5nZXM7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRTaW5nbGVSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB0aGlzLmFkZFJhbmdlKHJhbmdlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2VzKSB7XG4gIHZhciBjb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICBmb3IgKHZhciBpID0gMCwgZWwsIGxlbiA9IHJhbmdlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGVsID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZXNbaV0pO1xuICAgIHRyeSB7XG4gICAgICBjb250cm9sUmFuZ2UuYWRkKGVsKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFJhbmdlcygpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICAgIH1cbiAgfVxuICBjb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmFuZ2VNYW51YWxseSAoc2VsLCByYW5nZSkge1xuICB2YXIgcmFuZ2VzID0gc2VsLmdldEFsbFJhbmdlcygpO1xuICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzU2FtZVJhbmdlKHJhbmdlLCByYW5nZXNbaV0pKSB7XG4gICAgICBzZWwuYWRkUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWwucmFuZ2VDb3VudCkge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGFuY2hvclByZWZpeCA9ICdzdGFydCc7XG4gIHZhciBmb2N1c1ByZWZpeCA9ICdlbmQnO1xuICBzZWwuYW5jaG9yTm9kZSA9IHJhbmdlW2FuY2hvclByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHJhbmdlW2FuY2hvclByZWZpeCArICdPZmZzZXQnXTtcbiAgc2VsLmZvY3VzTm9kZSA9IHJhbmdlW2ZvY3VzUHJlZml4ICsgJ0NvbnRhaW5lciddO1xuICBzZWwuZm9jdXNPZmZzZXQgPSByYW5nZVtmb2N1c1ByZWZpeCArICdPZmZzZXQnXTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW1wdHlTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuYW5jaG9yTm9kZSA9IHNlbC5mb2N1c05vZGUgPSBudWxsO1xuICBzZWwuYW5jaG9yT2Zmc2V0ID0gc2VsLmZvY3VzT2Zmc2V0ID0gMDtcbiAgc2VsLnJhbmdlQ291bnQgPSAwO1xuICBzZWwuaXNDb2xsYXBzZWQgPSB0cnVlO1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiByYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudCAocmFuZ2VOb2Rlcykge1xuICBpZiAoIXJhbmdlTm9kZXMubGVuZ3RoIHx8IHJhbmdlTm9kZXNbMF0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IHJhbmdlTm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzQW5jZXN0b3JPZihyYW5nZU5vZGVzWzBdLCByYW5nZU5vZGVzW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZSAocmFuZ2UpIHtcbiAgdmFyIG5vZGVzID0gcmFuZ2UuZ2V0Tm9kZXMoKTtcbiAgaWYgKCFyYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudChub2RlcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UoKTogcmFuZ2UgZGlkIG5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gbm9kZXNbMF07XG59XG5cbmZ1bmN0aW9uIGlzVGV4dFJhbmdlIChyYW5nZSkge1xuICByZXR1cm4gcmFuZ2UgJiYgcmFuZ2UudGV4dCAhPT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tVGV4dFJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHNlbC5fcmFuZ2VzID0gW3JhbmdlXTtcbiAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2Uoc2VsLCByYW5nZSwgZmFsc2UpO1xuICBzZWwucmFuZ2VDb3VudCA9IDE7XG4gIHNlbC5pc0NvbGxhcHNlZCA9IHJhbmdlLmNvbGxhcHNlZDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29udHJvbFNlbGVjdGlvbiAoc2VsKSB7XG4gIHNlbC5fcmFuZ2VzLmxlbmd0aCA9IDA7XG4gIGlmIChzZWwuX3NlbGVjdGlvbi50eXBlID09PSAnTm9uZScpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250cm9sUmFuZ2UgPSBzZWwuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgIGlmIChpc1RleHRSYW5nZShjb250cm9sUmFuZ2UpKSB7XG4gICAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbCwgY29udHJvbFJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsLnJhbmdlQ291bnQgPSBjb250cm9sUmFuZ2UubGVuZ3RoO1xuICAgICAgdmFyIHJhbmdlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VDb3VudDsgKytpKSB7XG4gICAgICAgIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGUoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgICAgICBzZWwuX3Jhbmdlcy5wdXNoKHJhbmdlKTtcbiAgICAgIH1cbiAgICAgIHNlbC5pc0NvbGxhcHNlZCA9IHNlbC5yYW5nZUNvdW50ID09PSAxICYmIHNlbC5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICAgIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgc2VsLl9yYW5nZXNbc2VsLnJhbmdlQ291bnQgLSAxXSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbiAoc2VsLCByYW5nZSkge1xuICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICB9XG4gIHRyeSB7XG4gICAgbmV3Q29udHJvbFJhbmdlLmFkZChyYW5nZUVsZW1lbnQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRSYW5nZSgpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWwpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVSYW5nZSAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIChcbiAgICBsZWZ0LnN0YXJ0Q29udGFpbmVyID09PSByaWdodC5zdGFydENvbnRhaW5lciAmJlxuICAgIGxlZnQuc3RhcnRPZmZzZXQgPT09IHJpZ2h0LnN0YXJ0T2Zmc2V0ICYmXG4gICAgbGVmdC5lbmRDb250YWluZXIgPT09IHJpZ2h0LmVuZENvbnRhaW5lciAmJlxuICAgIGxlZnQuZW5kT2Zmc2V0ID09PSByaWdodC5lbmRPZmZzZXRcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNBbmNlc3Rvck9mIChhbmNlc3RvciwgZGVzY2VuZGFudCkge1xuICB2YXIgbm9kZSA9IGRlc2NlbmRhbnQ7XG4gIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlID09PSBhbmNlc3Rvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEdldFNlbGVjdGlvbihnbG9iYWwuZG9jdW1lbnQuc2VsZWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzSG9zdE1ldGhvZCAoaG9zdCwgcHJvcCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBob3N0W3Byb3BdO1xuICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAhISh0eXBlID09PSAnb2JqZWN0JyAmJiBob3N0W3Byb3BdKSB8fCB0eXBlID09PSAndW5rbm93bic7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdFByb3BlcnR5IChob3N0LCBwcm9wKSB7XG4gIHJldHVybiB0eXBlb2YgaG9zdFtwcm9wXSAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIG1hbnkgKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhcmVIb3N0ZWQgKGhvc3QsIHByb3BzKSB7XG4gICAgdmFyIGkgPSBwcm9wcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKCFmbihob3N0LCBwcm9wc1tpXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGhvZDogaXNIb3N0TWV0aG9kLFxuICBtZXRob2RzOiBtYW55KGlzSG9zdE1ldGhvZCksXG4gIHByb3BlcnR5OiBpc0hvc3RQcm9wZXJ0eSxcbiAgcHJvcGVydGllczogbWFueShpc0hvc3RQcm9wZXJ0eSlcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xuXG5mdW5jdGlvbiByYW5nZVRvVGV4dFJhbmdlIChwKSB7XG4gIGlmIChwLmNvbGxhcHNlZCkge1xuICAgIHJldHVybiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuc3RhcnRDb250YWluZXIsIG9mZnNldDogcC5zdGFydE9mZnNldCB9LCB0cnVlKTtcbiAgfVxuICB2YXIgc3RhcnRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB2YXIgZW5kUmFuZ2UgPSBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuZW5kQ29udGFpbmVyLCBvZmZzZXQ6IHAuZW5kT2Zmc2V0IH0sIGZhbHNlKTtcbiAgdmFyIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnU3RhcnRUb1N0YXJ0Jywgc3RhcnRSYW5nZSk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnRW5kVG9FbmQnLCBlbmRSYW5nZSk7XG4gIHJldHVybiB0ZXh0UmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyRGF0YU5vZGUgKG5vZGUpIHtcbiAgdmFyIHQgPSBub2RlLm5vZGVUeXBlO1xuICByZXR1cm4gdCA9PT0gMyB8fCB0ID09PSA0IHx8IHQgPT09IDggO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSAocCwgc3RhcnRpbmcpIHtcbiAgdmFyIGJvdW5kO1xuICB2YXIgcGFyZW50O1xuICB2YXIgb2Zmc2V0ID0gcC5vZmZzZXQ7XG4gIHZhciB3b3JraW5nTm9kZTtcbiAgdmFyIGNoaWxkTm9kZXM7XG4gIHZhciByYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHZhciBkYXRhID0gaXNDaGFyYWN0ZXJEYXRhTm9kZShwLm5vZGUpO1xuXG4gIGlmIChkYXRhKSB7XG4gICAgYm91bmQgPSBwLm5vZGU7XG4gICAgcGFyZW50ID0gYm91bmQucGFyZW50Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZE5vZGVzID0gcC5ub2RlLmNoaWxkTm9kZXM7XG4gICAgYm91bmQgPSBvZmZzZXQgPCBjaGlsZE5vZGVzLmxlbmd0aCA/IGNoaWxkTm9kZXNbb2Zmc2V0XSA6IG51bGw7XG4gICAgcGFyZW50ID0gcC5ub2RlO1xuICB9XG5cbiAgd29ya2luZ05vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB3b3JraW5nTm9kZS5pbm5lckhUTUwgPSAnJiNmZWZmOyc7XG5cbiAgaWYgKGJvdW5kKSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZSh3b3JraW5nTm9kZSwgYm91bmQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh3b3JraW5nTm9kZSk7XG4gIH1cblxuICByYW5nZS5tb3ZlVG9FbGVtZW50VGV4dCh3b3JraW5nTm9kZSk7XG4gIHJhbmdlLmNvbGxhcHNlKCFzdGFydGluZyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh3b3JraW5nTm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICByYW5nZVtzdGFydGluZyA/ICdtb3ZlU3RhcnQnIDogJ21vdmVFbmQnXSgnY2hhcmFjdGVyJywgb2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gcmFuZ2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZ2VUb1RleHRSYW5nZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgc2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9zZXRTZWxlY3Rpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldDogZ2V0U2VsZWN0aW9uLFxuICBzZXQ6IHNldFNlbGVjdGlvblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblxuZnVuY3Rpb24gc2V0U2VsZWN0aW9uIChwKSB7XG4gIGlmIChkb2MuY3JlYXRlUmFuZ2UpIHtcbiAgICBtb2Rlcm5TZWxlY3Rpb24oKTtcbiAgfSBlbHNlIHtcbiAgICBvbGRTZWxlY3Rpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vZGVyblNlbGVjdGlvbiAoKSB7XG4gICAgdmFyIHNlbCA9IGdldFNlbGVjdGlvbigpO1xuICAgIHZhciByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgIGlmICghcC5zdGFydENvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocC5lbmRDb250YWluZXIpIHtcbiAgICAgIHJhbmdlLnNldEVuZChwLmVuZENvbnRhaW5lciwgcC5lbmRPZmZzZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZS5zZXRFbmQocC5zdGFydENvbnRhaW5lciwgcC5zdGFydE9mZnNldCk7XG4gICAgfVxuICAgIHJhbmdlLnNldFN0YXJ0KHAuc3RhcnRDb250YWluZXIsIHAuc3RhcnRPZmZzZXQpO1xuICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gb2xkU2VsZWN0aW9uICgpIHtcbiAgICByYW5nZVRvVGV4dFJhbmdlKHApLnNlbGVjdCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0U2VsZWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VsbCA9IHJlcXVpcmUoJ3NlbGwnKTtcbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciBzZWxlY2Npb24gPSByZXF1aXJlKCdzZWxlY2Npb24nKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciBnZXRTZWxlY3Rpb24gPSBzZWxlY2Npb24uZ2V0O1xudmFyIHByb3BzID0gW1xuICAnZGlyZWN0aW9uJyxcbiAgJ2JveFNpemluZycsXG4gICd3aWR0aCcsXG4gICdoZWlnaHQnLFxuICAnb3ZlcmZsb3dYJyxcbiAgJ292ZXJmbG93WScsXG4gICdib3JkZXJUb3BXaWR0aCcsXG4gICdib3JkZXJSaWdodFdpZHRoJyxcbiAgJ2JvcmRlckJvdHRvbVdpZHRoJyxcbiAgJ2JvcmRlckxlZnRXaWR0aCcsXG4gICdwYWRkaW5nVG9wJyxcbiAgJ3BhZGRpbmdSaWdodCcsXG4gICdwYWRkaW5nQm90dG9tJyxcbiAgJ3BhZGRpbmdMZWZ0JyxcbiAgJ2ZvbnRTdHlsZScsXG4gICdmb250VmFyaWFudCcsXG4gICdmb250V2VpZ2h0JyxcbiAgJ2ZvbnRTdHJldGNoJyxcbiAgJ2ZvbnRTaXplJyxcbiAgJ2ZvbnRTaXplQWRqdXN0JyxcbiAgJ2xpbmVIZWlnaHQnLFxuICAnZm9udEZhbWlseScsXG4gICd0ZXh0QWxpZ24nLFxuICAndGV4dFRyYW5zZm9ybScsXG4gICd0ZXh0SW5kZW50JyxcbiAgJ3RleHREZWNvcmF0aW9uJyxcbiAgJ2xldHRlclNwYWNpbmcnLFxuICAnd29yZFNwYWNpbmcnXG5dO1xudmFyIHdpbiA9IGdsb2JhbDtcbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBmZiA9IHdpbi5tb3pJbm5lclNjcmVlblggIT09IG51bGwgJiYgd2luLm1veklubmVyU2NyZWVuWCAhPT0gdm9pZCAwO1xuXG5mdW5jdGlvbiB0YWlsb3JtYWRlIChlbCwgb3B0aW9ucykge1xuICB2YXIgdGV4dElucHV0ID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnO1xuICB2YXIgdGhyb3R0bGVkUmVmcmVzaCA9IHRocm90dGxlKHJlZnJlc2gsIDMwKTtcbiAgdmFyIG8gPSBvcHRpb25zIHx8IHt9O1xuXG4gIGJpbmQoKTtcblxuICByZXR1cm4ge1xuICAgIHJlYWQ6IHJlYWRQb3NpdGlvbixcbiAgICByZWZyZXNoOiB0aHJvdHRsZWRSZWZyZXNoLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3lcbiAgfTtcblxuICBmdW5jdGlvbiBub29wICgpIHt9XG4gIGZ1bmN0aW9uIHJlYWRQb3NpdGlvbiAoKSB7IHJldHVybiAodGV4dElucHV0ID8gY29vcmRzVGV4dCA6IGNvb3Jkc0hUTUwpKCk7IH1cblxuICBmdW5jdGlvbiByZWZyZXNoICgpIHtcbiAgICBpZiAoby5zbGVlcGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gKG8udXBkYXRlIHx8IG5vb3ApKHJlYWRQb3NpdGlvbigpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc1RleHQgKCkge1xuICAgIHZhciBwID0gc2VsbChlbCk7XG4gICAgdmFyIGNvbnRleHQgPSBwcmVwYXJlKCk7XG4gICAgdmFyIHJlYWRpbmdzID0gcmVhZFRleHRDb29yZHMoY29udGV4dCwgcC5zdGFydCk7XG4gICAgZG9jLmJvZHkucmVtb3ZlQ2hpbGQoY29udGV4dC5taXJyb3IpO1xuICAgIHJldHVybiByZWFkaW5ncztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc0hUTUwgKCkge1xuICAgIHZhciBzZWwgPSBnZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoc2VsLnJhbmdlQ291bnQpIHtcbiAgICAgIHZhciByYW5nZSA9IHNlbC5nZXRSYW5nZUF0KDApO1xuICAgICAgdmFyIG5lZWRzVG9Xb3JrQXJvdW5kTmV3bGluZUJ1ZyA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVOYW1lID09PSAnUCcgJiYgcmFuZ2Uuc3RhcnRPZmZzZXQgPT09IDA7XG4gICAgICBpZiAobmVlZHNUb1dvcmtBcm91bmROZXdsaW5lQnVnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgeDogcmFuZ2Uuc3RhcnRDb250YWluZXIub2Zmc2V0TGVmdCxcbiAgICAgICAgICB5OiByYW5nZS5zdGFydENvbnRhaW5lci5vZmZzZXRUb3AsXG4gICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChyYW5nZS5nZXRDbGllbnRSZWN0cykge1xuICAgICAgICB2YXIgcmVjdHMgPSByYW5nZS5nZXRDbGllbnRSZWN0cygpO1xuICAgICAgICBpZiAocmVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByZWN0c1swXS5sZWZ0LFxuICAgICAgICAgICAgeTogcmVjdHNbMF0udG9wLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHg6IDAsIHk6IDAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUZXh0Q29vcmRzIChjb250ZXh0LCBwKSB7XG4gICAgdmFyIHJlc3QgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciBtaXJyb3IgPSBjb250ZXh0Lm1pcnJvcjtcbiAgICB2YXIgY29tcHV0ZWQgPSBjb250ZXh0LmNvbXB1dGVkO1xuXG4gICAgd3JpdGUobWlycm9yLCByZWFkKGVsKS5zdWJzdHJpbmcoMCwgcCkpO1xuXG4gICAgaWYgKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgIG1pcnJvci50ZXh0Q29udGVudCA9IG1pcnJvci50ZXh0Q29udGVudC5yZXBsYWNlKC9cXHMvZywgJ1xcdTAwYTAnKTtcbiAgICB9XG5cbiAgICB3cml0ZShyZXN0LCByZWFkKGVsKS5zdWJzdHJpbmcocCkgfHwgJy4nKTtcblxuICAgIG1pcnJvci5hcHBlbmRDaGlsZChyZXN0KTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZXN0Lm9mZnNldExlZnQgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyTGVmdFdpZHRoJ10pLFxuICAgICAgeTogcmVzdC5vZmZzZXRUb3AgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyVG9wV2lkdGgnXSlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoZWwpIHtcbiAgICByZXR1cm4gdGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUw7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVwYXJlICgpIHtcbiAgICB2YXIgY29tcHV0ZWQgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUoZWwpIDogZWwuY3VycmVudFN0eWxlO1xuICAgIHZhciBtaXJyb3IgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN0eWxlID0gbWlycm9yLnN0eWxlO1xuXG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQobWlycm9yKTtcblxuICAgIGlmIChlbC50YWdOYW1lICE9PSAnSU5QVVQnKSB7XG4gICAgICBzdHlsZS53b3JkV3JhcCA9ICdicmVhay13b3JkJztcbiAgICB9XG4gICAgc3R5bGUud2hpdGVTcGFjZSA9ICdwcmUtd3JhcCc7XG4gICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICBwcm9wcy5mb3JFYWNoKGNvcHkpO1xuXG4gICAgaWYgKGZmKSB7XG4gICAgICBzdHlsZS53aWR0aCA9IHBhcnNlSW50KGNvbXB1dGVkLndpZHRoKSAtIDIgKyAncHgnO1xuICAgICAgaWYgKGVsLnNjcm9sbEhlaWdodCA+IHBhcnNlSW50KGNvbXB1dGVkLmhlaWdodCkpIHtcbiAgICAgICAgc3R5bGUub3ZlcmZsb3dZID0gJ3Njcm9sbCc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgfVxuICAgIHJldHVybiB7IG1pcnJvcjogbWlycm9yLCBjb21wdXRlZDogY29tcHV0ZWQgfTtcblxuICAgIGZ1bmN0aW9uIGNvcHkgKHByb3ApIHtcbiAgICAgIHN0eWxlW3Byb3BdID0gY29tcHV0ZWRbcHJvcF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKGVsLCB2YWx1ZSkge1xuICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgIGVsLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJpbmQgKHJlbW92ZSkge1xuICAgIHZhciBvcCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2tleWRvd24nLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAna2V5dXAnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnaW5wdXQnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAncGFzdGUnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnY2hhbmdlJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBiaW5kKHRydWUpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGFpbG9ybWFkZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdGhyb3R0bGUgKGZuLCBib3VuZGFyeSkge1xuICB2YXIgbGFzdCA9IC1JbmZpbml0eTtcbiAgdmFyIHRpbWVyO1xuICByZXR1cm4gZnVuY3Rpb24gYm91bmNlZCAoKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuYm91bmQoKTtcblxuICAgIGZ1bmN0aW9uIHVuYm91bmQgKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIHZhciBuZXh0ID0gbGFzdCArIGJvdW5kYXJ5O1xuICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICBpZiAobm93ID4gbmV4dCkge1xuICAgICAgICBsYXN0ID0gbm93O1xuICAgICAgICBmbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHVuYm91bmQsIG5leHQgLSBub3cpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRpY2t5ID0gcmVxdWlyZSgndGlja3knKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkge1xuICBpZiAoIWZuKSB7IHJldHVybjsgfVxuICB0aWNreShmdW5jdGlvbiBydW4gKCkge1xuICAgIGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXRvYSA9IHJlcXVpcmUoJ2F0b2EnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBldnQgPSB7fTtcbiAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICB0aGluZy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmICghZXZ0W3R5cGVdKSB7XG4gICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgIH0gZWxzZSB7XG4gICAgICBldnRbdHlwZV0ucHVzaChmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGZuLl9vbmNlID0gdHJ1ZTsgLy8gdGhpbmcub2ZmKGZuKSBzdGlsbCB3b3JrcyFcbiAgICB0aGluZy5vbih0eXBlLCBmbik7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vZmYgPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGMgPT09IDEpIHtcbiAgICAgIGRlbGV0ZSBldnRbdHlwZV07XG4gICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICBldnQgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgaWYgKCFldCkgeyByZXR1cm4gdGhpbmc7IH1cbiAgICAgIGV0LnNwbGljZShldC5pbmRleE9mKGZuKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGF0b2EoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdGhpbmcuZW1pdHRlclNuYXBzaG90KGFyZ3Muc2hpZnQoKSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG4gIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGV0ID0gKGV2dFt0eXBlXSB8fCBbXSkuc2xpY2UoMCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgdmFyIGN0eCA9IHRoaXMgfHwgdGhpbmc7XG4gICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0Lmxlbmd0aCkgeyB0aHJvdyBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzOyB9XG4gICAgICBldC5mb3JFYWNoKGZ1bmN0aW9uIGVtaXR0ZXIgKGxpc3Rlbikge1xuICAgICAgICBpZiAob3B0cy5hc3luYykgeyBkZWJvdW5jZShsaXN0ZW4sIGFyZ3MsIGN0eCk7IH0gZWxzZSB7IGxpc3Rlbi5hcHBseShjdHgsIGFyZ3MpOyB9XG4gICAgICAgIGlmIChsaXN0ZW4uX29uY2UpIHsgdGhpbmcub2ZmKHR5cGUsIGxpc3Rlbik7IH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gIH07XG4gIHJldHVybiB0aGluZztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF0b2EgKGEsIG4pIHsgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGEsIG4pOyB9XG4iLCJ2YXIgc2kgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nLCB0aWNrO1xuaWYgKHNpKSB7XG4gIHRpY2sgPSBmdW5jdGlvbiAoZm4pIHsgc2V0SW1tZWRpYXRlKGZuKTsgfTtcbn0gZWxzZSB7XG4gIHRpY2sgPSBmdW5jdGlvbiAoZm4pIHsgc2V0VGltZW91dChmbiwgMCk7IH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGljazsiLCJcbnZhciBOYXRpdmVDdXN0b21FdmVudCA9IGdsb2JhbC5DdXN0b21FdmVudDtcblxuZnVuY3Rpb24gdXNlTmF0aXZlICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcCA9IG5ldyBOYXRpdmVDdXN0b21FdmVudCgnY2F0JywgeyBkZXRhaWw6IHsgZm9vOiAnYmFyJyB9IH0pO1xuICAgIHJldHVybiAgJ2NhdCcgPT09IHAudHlwZSAmJiAnYmFyJyA9PT0gcC5kZXRhaWwuZm9vO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyb3NzLWJyb3dzZXIgYEN1c3RvbUV2ZW50YCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQuQ3VzdG9tRXZlbnRcbiAqXG4gKiBAcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VOYXRpdmUoKSA/IE5hdGl2ZUN1c3RvbUV2ZW50IDpcblxuLy8gSUUgPj0gOVxuJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID8gZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgfSBlbHNlIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIHZvaWQgMCk7XG4gIH1cbiAgcmV0dXJuIGU7XG59IDpcblxuLy8gSUUgPD0gOFxuZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gIGUudHlwZSA9IHR5cGU7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmJ1YmJsZXMgPSBCb29sZWFuKHBhcmFtcy5idWJibGVzKTtcbiAgICBlLmNhbmNlbGFibGUgPSBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKTtcbiAgICBlLmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gIH0gZWxzZSB7XG4gICAgZS5idWJibGVzID0gZmFsc2U7XG4gICAgZS5jYW5jZWxhYmxlID0gZmFsc2U7XG4gICAgZS5kZXRhaWwgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjdXN0b21FdmVudCA9IHJlcXVpcmUoJ2N1c3RvbS1ldmVudCcpO1xudmFyIGV2ZW50bWFwID0gcmVxdWlyZSgnLi9ldmVudG1hcCcpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBsaXN0ZW5lciA9IHVud3JhcChlbCwgdHlwZSwgZm4pO1xuICBpZiAobGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUsIG1vZGVsKSB7XG4gIHZhciBlID0gZXZlbnRtYXAuaW5kZXhPZih0eXBlKSA9PT0gLTEgPyBtYWtlQ3VzdG9tRXZlbnQoKSA6IG1ha2VDbGFzc2ljRXZlbnQoKTtcbiAgaWYgKGVsLmRpc3BhdGNoRXZlbnQpIHtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUNsYXNzaWNFdmVudCAoKSB7XG4gICAgdmFyIGU7XG4gICAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiBlO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDdXN0b21FdmVudCAoKSB7XG4gICAgcmV0dXJuIG5ldyBjdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogbW9kZWwgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZS53aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBldmVudG1hcCA9IFtdO1xudmFyIGV2ZW50bmFtZSA9ICcnO1xudmFyIHJvbiA9IC9eb24vO1xuXG5mb3IgKGV2ZW50bmFtZSBpbiBnbG9iYWwpIHtcbiAgaWYgKHJvbi50ZXN0KGV2ZW50bmFtZSkpIHtcbiAgICBldmVudG1hcC5wdXNoKGV2ZW50bmFtZS5zbGljZSgyKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudG1hcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZnV6enlzZWFyY2ggKG5lZWRsZSwgaGF5c3RhY2spIHtcbiAgdmFyIHRsZW4gPSBoYXlzdGFjay5sZW5ndGg7XG4gIHZhciBxbGVuID0gbmVlZGxlLmxlbmd0aDtcbiAgaWYgKHFsZW4gPiB0bGVuKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChxbGVuID09PSB0bGVuKSB7XG4gICAgcmV0dXJuIG5lZWRsZSA9PT0gaGF5c3RhY2s7XG4gIH1cbiAgb3V0ZXI6IGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IHFsZW47IGkrKykge1xuICAgIHZhciBuY2ggPSBuZWVkbGUuY2hhckNvZGVBdChpKTtcbiAgICB3aGlsZSAoaiA8IHRsZW4pIHtcbiAgICAgIGlmIChoYXlzdGFjay5jaGFyQ29kZUF0KGorKykgPT09IG5jaCkge1xuICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1enp5c2VhcmNoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBwYWQgKGhhc2gsIGxlbikge1xuICB3aGlsZSAoaGFzaC5sZW5ndGggPCBsZW4pIHtcbiAgICBoYXNoID0gJzAnICsgaGFzaDtcbiAgfVxuICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gZm9sZCAoaGFzaCwgdGV4dCkge1xuICB2YXIgaTtcbiAgdmFyIGNocjtcbiAgdmFyIGxlbjtcbiAgaWYgKHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gdGV4dC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGNociA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgaGFzaCB8PSAwO1xuICB9XG4gIHJldHVybiBoYXNoIDwgMCA/IGhhc2ggKiAtMiA6IGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvbGRPYmplY3QgKGhhc2gsIG8sIHNlZW4pIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG8pLnNvcnQoKS5yZWR1Y2UoZm9sZEtleSwgaGFzaCk7XG4gIGZ1bmN0aW9uIGZvbGRLZXkgKGhhc2gsIGtleSkge1xuICAgIHJldHVybiBmb2xkVmFsdWUoaGFzaCwgb1trZXldLCBrZXksIHNlZW4pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvbGRWYWx1ZSAoaW5wdXQsIHZhbHVlLCBrZXksIHNlZW4pIHtcbiAgdmFyIGhhc2ggPSBmb2xkKGZvbGQoZm9sZChpbnB1dCwga2V5KSwgdG9TdHJpbmcodmFsdWUpKSwgdHlwZW9mIHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZvbGQoaGFzaCwgJ251bGwnKTtcbiAgfVxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmb2xkKGhhc2gsICd1bmRlZmluZWQnKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIGZvbGQoaGFzaCwgJ1tDaXJjdWxhcl0nICsga2V5KTtcbiAgICB9XG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gZm9sZE9iamVjdChoYXNoLCB2YWx1ZSwgc2Vlbik7XG4gIH1cbiAgcmV0dXJuIGZvbGQoaGFzaCwgdmFsdWUudG9TdHJpbmcoKSk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyaW5nIChvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cbmZ1bmN0aW9uIHN1bSAobykge1xuICByZXR1cm4gcGFkKGZvbGRWYWx1ZSgwLCBvLCAnJywgW10pLnRvU3RyaW5nKDE2KSwgOCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VtO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4vbm93JyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvblxuICogdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHNcbiAqIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpcyBpbnZva2VkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHJlc3VsdCA9IHdhaXQgLSB0aW1lU2luY2VMYXN0Q2FsbDtcblxuICAgIHJldHVybiBtYXhpbmcgPyBuYXRpdmVNaW4ocmVzdWx0LCBtYXhXYWl0IC0gdGltZVNpbmNlTGFzdEludm9rZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJbnZva2UodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWU7XG5cbiAgICAvLyBFaXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgY2FsbCwgYWN0aXZpdHkgaGFzIHN0b3BwZWQgYW5kIHdlJ3JlIGF0IHRoZVxuICAgIC8vIHRyYWlsaW5nIGVkZ2UsIHRoZSBzeXN0ZW0gdGltZSBoYXMgZ29uZSBiYWNrd2FyZHMgYW5kIHdlJ3JlIHRyZWF0aW5nXG4gICAgLy8gaXQgYXMgdGhlIHRyYWlsaW5nIGVkZ2UsIG9yIHdlJ3ZlIGhpdCB0aGUgYG1heFdhaXRgIGxpbWl0LlxuICAgIHJldHVybiAobGFzdENhbGxUaW1lID09PSB1bmRlZmluZWQgfHwgKHRpbWVTaW5jZUxhc3RDYWxsID49IHdhaXQpIHx8XG4gICAgICAodGltZVNpbmNlTGFzdENhbGwgPCAwKSB8fCAobWF4aW5nICYmIHRpbWVTaW5jZUxhc3RJbnZva2UgPj0gbWF4V2FpdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZXJFeHBpcmVkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCk7XG4gICAgaWYgKHNob3VsZEludm9rZSh0aW1lKSkge1xuICAgICAgcmV0dXJuIHRyYWlsaW5nRWRnZSh0aW1lKTtcbiAgICB9XG4gICAgLy8gUmVzdGFydCB0aGUgdGltZXIuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCByZW1haW5pbmdXYWl0KHRpbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWlsaW5nRWRnZSh0aW1lKSB7XG4gICAgdGltZXJJZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIE9ubHkgaW52b2tlIGlmIHdlIGhhdmUgYGxhc3RBcmdzYCB3aGljaCBtZWFucyBgZnVuY2AgaGFzIGJlZW5cbiAgICAvLyBkZWJvdW5jZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBpZiAodHJhaWxpbmcgJiYgbGFzdEFyZ3MpIHtcbiAgICAgIHJldHVybiBpbnZva2VGdW5jKHRpbWUpO1xuICAgIH1cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGFuZCB3ZWFrIG1hcCBjb25zdHJ1Y3RvcnMsXG4gIC8vIGFuZCBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuIiwiLyoqXG4gKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2VcbiAqIHRoZSBVbml4IGVwb2NoICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBEYXRlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lc3RhbXAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZGVmZXIoZnVuY3Rpb24oc3RhbXApIHtcbiAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcbiAqIH0sIF8ubm93KCkpO1xuICogLy8gPT4gTG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgaW52b2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gbm93KCkge1xuICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBub3c7XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBOQU4gPSAwIC8gMDtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJhZCBzaWduZWQgaGV4YWRlY2ltYWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmFkSGV4ID0gL15bLStdMHhbMC05YS1mXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmluYXJ5ID0gL14wYlswMV0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb2N0YWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4vKiogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgd2l0aG91dCBhIGRlcGVuZGVuY3kgb24gYHJvb3RgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gaXNGdW5jdGlvbih2YWx1ZS52YWx1ZU9mKSA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHBhbmRvID0gJ3Nla3Rvci0nICsgRGF0ZS5ub3coKTtcbnZhciByc2libGluZ3MgPSAvWyt+XS87XG52YXIgZG9jdW1lbnQgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgZGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHt9O1xudmFyIG1hdGNoID0gKFxuICBkZWwubWF0Y2hlcyB8fFxuICBkZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm9NYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIG5ldmVyXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNla3Rvcjtcblxuc2VrdG9yLm1hdGNoZXMgPSBtYXRjaGVzO1xuc2VrdG9yLm1hdGNoZXNTZWxlY3RvciA9IG1hdGNoZXNTZWxlY3RvcjtcblxuZnVuY3Rpb24gcXNhIChzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgZXhpc3RlZCwgaWQsIHByZWZpeCwgcHJlZml4ZWQsIGFkYXB0ZXIsIGhhY2sgPSBjb250ZXh0ICE9PSBkb2N1bWVudDtcbiAgaWYgKGhhY2spIHsgLy8gaWQgaGFjayBmb3IgY29udGV4dC1yb290ZWQgcXVlcmllc1xuICAgIGV4aXN0ZWQgPSBjb250ZXh0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICBpZCA9IGV4aXN0ZWQgfHwgZXhwYW5kbztcbiAgICBwcmVmaXggPSAnIycgKyBpZCArICcgJztcbiAgICBwcmVmaXhlZCA9IHByZWZpeCArIHNlbGVjdG9yLnJlcGxhY2UoLywvZywgJywnICsgcHJlZml4KTtcbiAgICBhZGFwdGVyID0gcnNpYmxpbmdzLnRlc3Qoc2VsZWN0b3IpICYmIGNvbnRleHQucGFyZW50Tm9kZTtcbiAgICBpZiAoIWV4aXN0ZWQpIHsgY29udGV4dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpOyB9XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gKGFkYXB0ZXIgfHwgY29udGV4dCkucXVlcnlTZWxlY3RvckFsbChwcmVmaXhlZCB8fCBzZWxlY3Rvcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGV4aXN0ZWQgPT09IG51bGwpIHsgY29udGV4dC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZWt0b3IgKHNlbGVjdG9yLCBjdHgsIGNvbGxlY3Rpb24sIHNlZWQpIHtcbiAgdmFyIGVsZW1lbnQ7XG4gIHZhciBjb250ZXh0ID0gY3R4IHx8IGRvY3VtZW50O1xuICB2YXIgcmVzdWx0cyA9IGNvbGxlY3Rpb24gfHwgW107XG4gIHZhciBpID0gMDtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBpZiAoY29udGV4dC5ub2RlVHlwZSAhPT0gMSAmJiBjb250ZXh0Lm5vZGVUeXBlICE9PSA5KSB7XG4gICAgcmV0dXJuIFtdOyAvLyBiYWlsIGlmIGNvbnRleHQgaXMgbm90IGFuIGVsZW1lbnQgb3IgZG9jdW1lbnRcbiAgfVxuICBpZiAoc2VlZCkge1xuICAgIHdoaWxlICgoZWxlbWVudCA9IHNlZWRbaSsrXSkpIHtcbiAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIHFzYShzZWxlY3RvciwgY29udGV4dCkpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzIChzZWxlY3RvciwgZWxlbWVudHMpIHtcbiAgcmV0dXJuIHNla3RvcihzZWxlY3RvciwgbnVsbCwgbnVsbCwgZWxlbWVudHMpO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IgKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gIHJldHVybiBtYXRjaC5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gbmV2ZXIgKCkgeyByZXR1cm4gZmFsc2U7IH1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldCA9IGVhc3lHZXQ7XG52YXIgc2V0ID0gZWFzeVNldDtcblxuaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UpIHtcbiAgZ2V0ID0gaGFyZEdldDtcbiAgc2V0ID0gaGFyZFNldDtcbn1cblxuZnVuY3Rpb24gZWFzeUdldCAoZWwpIHtcbiAgcmV0dXJuIHtcbiAgICBzdGFydDogZWwuc2VsZWN0aW9uU3RhcnQsXG4gICAgZW5kOiBlbC5zZWxlY3Rpb25FbmRcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFyZEdldCAoZWwpIHtcbiAgdmFyIGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgIT09IGVsKSB7XG4gICAgZWwuZm9jdXMoKTtcbiAgfVxuXG4gIHZhciByYW5nZSA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgYm9va21hcmsgPSByYW5nZS5nZXRCb29rbWFyaygpO1xuICB2YXIgb3JpZ2luYWwgPSBlbC52YWx1ZTtcbiAgdmFyIG1hcmtlciA9IGdldFVuaXF1ZU1hcmtlcihvcmlnaW5hbCk7XG4gIHZhciBwYXJlbnQgPSByYW5nZS5wYXJlbnRFbGVtZW50KCk7XG4gIGlmIChwYXJlbnQgPT09IG51bGwgfHwgIWlucHV0cyhwYXJlbnQpKSB7XG4gICAgcmV0dXJuIHJlc3VsdCgwLCAwKTtcbiAgfVxuICByYW5nZS50ZXh0ID0gbWFya2VyICsgcmFuZ2UudGV4dCArIG1hcmtlcjtcblxuICB2YXIgY29udGVudHMgPSBlbC52YWx1ZTtcblxuICBlbC52YWx1ZSA9IG9yaWdpbmFsO1xuICByYW5nZS5tb3ZlVG9Cb29rbWFyayhib29rbWFyayk7XG4gIHJhbmdlLnNlbGVjdCgpO1xuXG4gIHJldHVybiByZXN1bHQoY29udGVudHMuaW5kZXhPZihtYXJrZXIpLCBjb250ZW50cy5sYXN0SW5kZXhPZihtYXJrZXIpIC0gbWFya2VyLmxlbmd0aCk7XG5cbiAgZnVuY3Rpb24gcmVzdWx0IChzdGFydCwgZW5kKSB7XG4gICAgaWYgKGFjdGl2ZSAhPT0gZWwpIHsgLy8gZG9uJ3QgZGlzcnVwdCBwcmUtZXhpc3Rpbmcgc3RhdGVcbiAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgYWN0aXZlLmZvY3VzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5ibHVyKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXJ0OiBzdGFydCwgZW5kOiBlbmQgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRVbmlxdWVNYXJrZXIgKGNvbnRlbnRzKSB7XG4gIHZhciBtYXJrZXI7XG4gIGRvIHtcbiAgICBtYXJrZXIgPSAnQEBtYXJrZXIuJyArIE1hdGgucmFuZG9tKCkgKiBuZXcgRGF0ZSgpO1xuICB9IHdoaWxlIChjb250ZW50cy5pbmRleE9mKG1hcmtlcikgIT09IC0xKTtcbiAgcmV0dXJuIG1hcmtlcjtcbn1cblxuZnVuY3Rpb24gaW5wdXRzIChlbCkge1xuICByZXR1cm4gKChlbC50YWdOYW1lID09PSAnSU5QVVQnICYmIGVsLnR5cGUgPT09ICd0ZXh0JykgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyk7XG59XG5cbmZ1bmN0aW9uIGVhc3lTZXQgKGVsLCBwKSB7XG4gIGVsLnNlbGVjdGlvblN0YXJ0ID0gcGFyc2UoZWwsIHAuc3RhcnQpO1xuICBlbC5zZWxlY3Rpb25FbmQgPSBwYXJzZShlbCwgcC5lbmQpO1xufVxuXG5mdW5jdGlvbiBoYXJkU2V0IChlbCwgcCkge1xuICB2YXIgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKTtcblxuICBpZiAocC5zdGFydCA9PT0gJ2VuZCcgJiYgcC5lbmQgPT09ICdlbmQnKSB7XG4gICAgcmFuZ2UuY29sbGFwc2UoZmFsc2UpO1xuICAgIHJhbmdlLnNlbGVjdCgpO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuICAgIHJhbmdlLm1vdmVFbmQoJ2NoYXJhY3RlcicsIHBhcnNlKGVsLCBwLmVuZCkpO1xuICAgIHJhbmdlLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgcGFyc2UoZWwsIHAuc3RhcnQpKTtcbiAgICByYW5nZS5zZWxlY3QoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZSAoZWwsIHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gJ2VuZCcgPyBlbC52YWx1ZS5sZW5ndGggOiB2YWx1ZSB8fCAwO1xufVxuXG5mdW5jdGlvbiBzZWxsIChlbCwgcCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIHNldChlbCwgcCk7XG4gIH1cbiAgcmV0dXJuIGdldChlbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2VsbDtcbiJdfQ==
