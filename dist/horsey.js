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
      var parent = el.parentElement || el.parentNode;
      var text = el.textContent || el.nodeValue || '';
      if (text.length === 0) {
        return;
      }
      for (var i = 0, chars = text.split(''); i < chars.length; i++) {
        parent.insertBefore(spanFor(chars[i]), el);
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
    var elems = [].slice.call(el.querySelectorAll('.sey-char'));
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
      for (var wordIndex = 0, word; wordIndex < words.length; wordIndex++) {
        var word = words[wordIndex];
        var tempIndex = startIndex;
        retry: while (tempIndex !== -1) {
          var init = true;
          var prevIndex = tempIndex;
          for (var charIndex = 0, _chars = word.split(''); charIndex < _chars.length; charIndex++) {
            var char = _chars[charIndex];
            var i = _chars.indexOf(char, prevIndex + 1);
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
          for (var elemIndex = 0, matchedElems = elems.splice(tempIndex, 1 + prevIndex - tempIndex); elemIndex < matchedElems.length; elemIndex++) {
            on(matchedElems[elemIndex]);
          }
          balance();
          needle = needle.replace(word, '');
          break;
        }
      }
    }

    function fuzzy() {
      for (var i = 0, _chars2 = needle.split(''); i < _chars2.length; i++) {
        while (elems.length) {
          var _el = elems.shift();
          if ((_el.innerText || _el.textContent) === _chars2[i]) {
            on(_el);
            break;
          } else {
            off(_el);
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

},{"bullseye":3,"contra/emitter":7,"crossvent":8,"fuzzysearch":11,"hash-sum":12,"lodash/debounce":13,"sektor":20,"sell":29}],2:[function(require,module,exports){
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

},{"./throttle":5,"crossvent":8,"seleccion":27,"sell":29}],5:[function(require,module,exports){
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

},{"ticky":30}],7:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./isObject":15,"./now":18,"./toNumber":19}],14:[function(require,module,exports){
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

},{"./isObject":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{"./isObjectLike":16}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{"./isFunction":14,"./isObject":15,"./isSymbol":17}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"./getSelectionNullOp":22,"./getSelectionRaw":23,"./getSelectionSynthetic":24,"./isHost":25}],22:[function(require,module,exports){
'use strict';

function noop () {}

function getSelectionNullOp () {
  return {
    removeAllRanges: noop,
    addRange: noop
  };
}

module.exports = getSelectionNullOp;

},{}],23:[function(require,module,exports){
(function (global){
'use strict';

function getSelectionRaw () {
  return global.getSelection();
}

module.exports = getSelectionRaw;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],24:[function(require,module,exports){
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

},{"./rangeToTextRange":26}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
'use strict';

var getSelection = require('./getSelection');
var setSelection = require('./setSelection');

module.exports = {
  get: getSelection,
  set: setSelection
};

},{"./getSelection":21,"./setSelection":28}],28:[function(require,module,exports){
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

},{"./getSelection":21,"./rangeToTextRange":26}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJob3JzZXkuanMiLCJub2RlX21vZHVsZXMvYXRvYS9hdG9hLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL2J1bGxzZXllLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL3RhaWxvcm1hZGUuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvY29udHJhL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2NvbnRyYS9lbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvZXZlbnRtYXAuanMiLCJub2RlX21vZHVsZXMvY3VzdG9tLWV2ZW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Z1enp5c2VhcmNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2hhc2gtc3VtL2hhc2gtc3VtLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kZWJvdW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNTeW1ib2wuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdG9OdW1iZXIuanMiLCJub2RlX21vZHVsZXMvc2VrdG9yL3NyYy9zZWt0b3IuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25OdWxsT3AuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25SYXcuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25TeW50aGV0aWMuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9pc0hvc3QuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9yYW5nZVRvVGV4dFJhbmdlLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2VsZWNjaW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2V0U2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGwvc2VsbC5qcyIsIm5vZGVfbW9kdWxlcy90aWNreS90aWNreS1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBQ0EsSUFBTSxnQkFBZ0IsQ0FBdEI7QUFDQSxJQUFNLFlBQVksRUFBbEI7QUFDQSxJQUFNLFVBQVUsRUFBaEI7QUFDQSxJQUFNLFNBQVMsRUFBZjtBQUNBLElBQU0sV0FBVyxFQUFqQjtBQUNBLElBQU0sVUFBVSxDQUFoQjtBQUNBLElBQU0sTUFBTSxRQUFaO0FBQ0EsSUFBTSxhQUFhLElBQUksZUFBdkI7O0FBRUEsU0FBUyxNQUFULENBQWlCLEVBQWpCLEVBQW1DO0FBQUEsTUFBZCxPQUFjLHlEQUFKLEVBQUk7QUFBQSxNQUUvQixVQUYrQixHQWM3QixPQWQ2QixDQUUvQixVQUYrQjtBQUFBLE1BRy9CLElBSCtCLEdBYzdCLE9BZDZCLENBRy9CLEdBSCtCO0FBQUEsTUFJL0IsTUFKK0IsR0FjN0IsT0FkNkIsQ0FJL0IsTUFKK0I7QUFBQSxNQUsvQixNQUwrQixHQWM3QixPQWQ2QixDQUsvQixNQUwrQjtBQUFBLHVCQWM3QixPQWQ2QixDQU0vQixLQU4rQjtBQUFBLE1BTS9CLEtBTitCLGtDQU12QixFQU51QjtBQUFBLE1BTy9CLGlCQVArQixHQWM3QixPQWQ2QixDQU8vQixpQkFQK0I7QUFBQSxNQVEvQixV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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBzdW0gZnJvbSAnaGFzaC1zdW0nO1xuaW1wb3J0IHNlbGwgZnJvbSAnc2VsbCc7XG5pbXBvcnQgc2VrdG9yIGZyb20gJ3Nla3Rvcic7XG5pbXBvcnQgZW1pdHRlciBmcm9tICdjb250cmEvZW1pdHRlcic7XG5pbXBvcnQgYnVsbHNleWUgZnJvbSAnYnVsbHNleWUnO1xuaW1wb3J0IGNyb3NzdmVudCBmcm9tICdjcm9zc3ZlbnQnO1xuaW1wb3J0IGZ1enp5c2VhcmNoIGZyb20gJ2Z1enp5c2VhcmNoJztcbmltcG9ydCBkZWJvdW5jZSBmcm9tICdsb2Rhc2gvZGVib3VuY2UnO1xuY29uc3QgS0VZX0JBQ0tTUEFDRSA9IDg7XG5jb25zdCBLRVlfRU5URVIgPSAxMztcbmNvbnN0IEtFWV9FU0MgPSAyNztcbmNvbnN0IEtFWV9VUCA9IDM4O1xuY29uc3QgS0VZX0RPV04gPSA0MDtcbmNvbnN0IEtFWV9UQUIgPSA5O1xuY29uc3QgZG9jID0gZG9jdW1lbnQ7XG5jb25zdCBkb2NFbGVtZW50ID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuZnVuY3Rpb24gaG9yc2V5IChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBzZXRBcHBlbmRzLFxuICAgIHNldCxcbiAgICBmaWx0ZXIsXG4gICAgc291cmNlLFxuICAgIGNhY2hlID0ge30sXG4gICAgcHJlZGljdE5leHRTZWFyY2gsXG4gICAgcmVuZGVySXRlbSxcbiAgICByZW5kZXJDYXRlZ29yeSxcbiAgICBibGFua1NlYXJjaCxcbiAgICBhcHBlbmRUbyxcbiAgICBhbmNob3IsXG4gICAgZGVib3VuY2VcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNhY2hpbmcgPSBvcHRpb25zLmNhY2hlICE9PSBmYWxzZTtcbiAgaWYgKCFzb3VyY2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB1c2VyR2V0VGV4dCA9IG9wdGlvbnMuZ2V0VGV4dDtcbiAgY29uc3QgdXNlckdldFZhbHVlID0gb3B0aW9ucy5nZXRWYWx1ZTtcbiAgY29uc3QgZ2V0VGV4dCA9IChcbiAgICB0eXBlb2YgdXNlckdldFRleHQgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRUZXh0XSA6XG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnZnVuY3Rpb24nID8gdXNlckdldFRleHQgOlxuICAgIGQgPT4gZC50b1N0cmluZygpXG4gICk7XG4gIGNvbnN0IGdldFZhbHVlID0gKFxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRWYWx1ZV0gOlxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdmdW5jdGlvbicgPyB1c2VyR2V0VmFsdWUgOlxuICAgIGQgPT4gZFxuICApO1xuXG4gIGxldCBwcmV2aW91c1N1Z2dlc3Rpb25zID0gW107XG4gIGxldCBwcmV2aW91c1NlbGVjdGlvbiA9IG51bGw7XG4gIGNvbnN0IGxpbWl0ID0gTnVtYmVyKG9wdGlvbnMubGltaXQpIHx8IEluZmluaXR5O1xuICBjb25zdCBjb21wbGV0ZXIgPSBhdXRvY29tcGxldGUoZWwsIHtcbiAgICBzb3VyY2U6IHNvdXJjZUZ1bmN0aW9uLFxuICAgIGxpbWl0LFxuICAgIGdldFRleHQsXG4gICAgZ2V0VmFsdWUsXG4gICAgc2V0QXBwZW5kcyxcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcbiAgICByZW5kZXJJdGVtLFxuICAgIHJlbmRlckNhdGVnb3J5LFxuICAgIGFwcGVuZFRvLFxuICAgIGFuY2hvcixcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dDogb3B0aW9ucy5ub01hdGNoZXMsXG4gICAgYmxhbmtTZWFyY2gsXG4gICAgZGVib3VuY2UsXG4gICAgc2V0IChzKSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyAhPT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTZWxlY3Rpb24gPSBzO1xuICAgICAgKHNldCB8fCBjb21wbGV0ZXIuZGVmYXVsdFNldHRlcikoZ2V0VGV4dChzKSwgcyk7XG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYWZ0ZXJTZXQnKTtcbiAgICB9LFxuICAgIGZpbHRlclxuICB9KTtcbiAgcmV0dXJuIGNvbXBsZXRlcjtcbiAgZnVuY3Rpb24gbm9NYXRjaGVzIChkYXRhKSB7XG4gICAgaWYgKCFvcHRpb25zLm5vTWF0Y2hlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5xdWVyeS5sZW5ndGg7XG4gIH1cbiAgZnVuY3Rpb24gc291cmNlRnVuY3Rpb24gKGRhdGEsIGRvbmUpIHtcbiAgICBjb25zdCB7cXVlcnksIGxpbWl0fSA9IGRhdGE7XG4gICAgaWYgKCFvcHRpb25zLmJsYW5rU2VhcmNoICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgZG9uZShudWxsLCBbXSwgdHJ1ZSk7IHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbXBsZXRlcikge1xuICAgICAgY29tcGxldGVyLmVtaXQoJ2JlZm9yZVVwZGF0ZScpO1xuICAgIH1cbiAgICBjb25zdCBoYXNoID0gc3VtKHF1ZXJ5KTsgLy8gZmFzdCwgY2FzZSBpbnNlbnNpdGl2ZSwgcHJldmVudHMgY29sbGlzaW9uc1xuICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGNhY2hlW2hhc2hdO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gZW50cnkuY3JlYXRlZC5nZXRUaW1lKCk7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gY2FjaGUuZHVyYXRpb24gfHwgNjAgKiA2MCAqIDI0O1xuICAgICAgICBjb25zdCBkaWZmID0gZHVyYXRpb24gKiAxMDAwO1xuICAgICAgICBjb25zdCBmcmVzaCA9IG5ldyBEYXRlKHN0YXJ0ICsgZGlmZikgPiBuZXcgRGF0ZSgpO1xuICAgICAgICBpZiAoZnJlc2gpIHtcbiAgICAgICAgICBkb25lKG51bGwsIGVudHJ5Lml0ZW1zLnNsaWNlKCkpOyByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNvdXJjZURhdGEgPSB7XG4gICAgICBwcmV2aW91c1N1Z2dlc3Rpb25zOiBwcmV2aW91c1N1Z2dlc3Rpb25zLnNsaWNlKCksXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbixcbiAgICAgIGlucHV0OiBxdWVyeSxcbiAgICAgIHJlbmRlckl0ZW0sXG4gICAgICByZW5kZXJDYXRlZ29yeSxcbiAgICAgIGxpbWl0XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLnNvdXJjZShzb3VyY2VEYXRhLCBzb3VyY2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc291cmNlZChudWxsLCBvcHRpb25zLnNvdXJjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBdXRvY29tcGxldGUgc291cmNlIGVycm9yLicsIGVyciwgZWwpO1xuICAgICAgICBkb25lKGVyciwgW10pO1xuICAgICAgfVxuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQgOiBbXTtcbiAgICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICAgIGNhY2hlW2hhc2hdID0geyBjcmVhdGVkOiBuZXcgRGF0ZSgpLCBpdGVtcyB9O1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTdWdnZXN0aW9ucyA9IGl0ZW1zO1xuICAgICAgZG9uZShudWxsLCBpdGVtcy5zbGljZSgpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXV0b2NvbXBsZXRlIChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IG8gPSBvcHRpb25zO1xuICBjb25zdCBwYXJlbnQgPSBvLmFwcGVuZFRvIHx8IGRvYy5ib2R5O1xuICBjb25zdCB7XG4gICAgZ2V0VGV4dCxcbiAgICBnZXRWYWx1ZSxcbiAgICBmb3JtLFxuICAgIHNvdXJjZSxcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dCxcbiAgICBoaWdobGlnaHRlciA9IHRydWUsXG4gICAgaGlnaGxpZ2h0Q29tcGxldGVXb3JkcyA9IHRydWUsXG4gICAgcmVuZGVySXRlbSA9IGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgcmVuZGVyQ2F0ZWdvcnkgPSBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlcixcbiAgICBzZXRBcHBlbmRzXG4gIH0gPSBvO1xuICBjb25zdCBsaW1pdCA9IHR5cGVvZiBvLmxpbWl0ID09PSAnbnVtYmVyJyA/IG8ubGltaXQgOiBJbmZpbml0eTtcbiAgY29uc3QgdXNlckZpbHRlciA9IG8uZmlsdGVyIHx8IGRlZmF1bHRGaWx0ZXI7XG4gIGNvbnN0IHVzZXJTZXQgPSBvLnNldCB8fCBkZWZhdWx0U2V0dGVyO1xuICBjb25zdCBjYXRlZ29yaWVzID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3JpZXMnKTtcbiAgY29uc3QgY29udGFpbmVyID0gdGFnKCdkaXYnLCAnc2V5LWNvbnRhaW5lcicpO1xuICBjb25zdCBkZWZlcnJlZEZpbHRlcmluZyA9IGRlZmVyKGZpbHRlcmluZyk7XG4gIGNvbnN0IHN0YXRlID0geyBjb3VudGVyOiAwLCBxdWVyeTogbnVsbCB9O1xuICBsZXQgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBsZXQgc2VsZWN0aW9uID0gbnVsbDtcbiAgbGV0IGV5ZTtcbiAgbGV0IGF0dGFjaG1lbnQgPSBlbDtcbiAgbGV0IG5vbmVNYXRjaDtcbiAgbGV0IHRleHRJbnB1dDtcbiAgbGV0IGFueUlucHV0O1xuICBsZXQgcmFuY2hvcmxlZnQ7XG4gIGxldCByYW5jaG9ycmlnaHQ7XG4gIGxldCBsYXN0UHJlZml4ID0gJyc7XG4gIGNvbnN0IGRlYm91bmNlVGltZSA9IG8uZGVib3VuY2UgfHwgMzAwO1xuICBjb25zdCBkZWJvdW5jZWRMb2FkaW5nID0gZGVib3VuY2UobG9hZGluZywgZGVib3VuY2VUaW1lKTtcblxuICBpZiAoby5hdXRvSGlkZU9uQmx1ciA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkJsdXIgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9IaWRlT25DbGljayA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkNsaWNrID0gdHJ1ZTsgfVxuICBpZiAoby5hdXRvU2hvd09uVXBEb3duID09PSB2b2lkIDApIHsgby5hdXRvU2hvd09uVXBEb3duID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJzsgfVxuICBpZiAoby5hbmNob3IpIHtcbiAgICByYW5jaG9ybGVmdCA9IG5ldyBSZWdFeHAoJ14nICsgby5hbmNob3IpO1xuICAgIHJhbmNob3JyaWdodCA9IG5ldyBSZWdFeHAoby5hbmNob3IgKyAnJCcpO1xuICB9XG5cbiAgbGV0IGhhc0l0ZW1zID0gZmFsc2U7XG4gIGNvbnN0IGFwaSA9IGVtaXR0ZXIoe1xuICAgIGFuY2hvcjogby5hbmNob3IsXG4gICAgY2xlYXIsXG4gICAgc2hvdyxcbiAgICBoaWRlLFxuICAgIHRvZ2dsZSxcbiAgICBkZXN0cm95LFxuICAgIHJlZnJlc2hQb3NpdGlvbixcbiAgICBhcHBlbmRUZXh0LFxuICAgIGFwcGVuZEhUTUwsXG4gICAgZmlsdGVyQW5jaG9yZWRUZXh0LFxuICAgIGZpbHRlckFuY2hvcmVkSFRNTCxcbiAgICBkZWZhdWx0QXBwZW5kVGV4dDogYXBwZW5kVGV4dCxcbiAgICBkZWZhdWx0RmlsdGVyLFxuICAgIGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIsXG4gICAgZGVmYXVsdFNldHRlcixcbiAgICByZXRhcmdldCxcbiAgICBhdHRhY2htZW50LFxuICAgIHNvdXJjZTogW11cbiAgfSk7XG5cbiAgcmV0YXJnZXQoZWwpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2F0ZWdvcmllcyk7XG4gIGlmIChub01hdGNoZXMgJiYgbm9NYXRjaGVzVGV4dCkge1xuICAgIG5vbmVNYXRjaCA9IHRhZygnZGl2JywgJ3NleS1lbXB0eSBzZXktaGlkZScpO1xuICAgIHRleHQobm9uZU1hdGNoLCBub01hdGNoZXNUZXh0KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9uZU1hdGNoKTtcbiAgfVxuICBwYXJlbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGxvYWRlZChzb3VyY2UsIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG5cbiAgZnVuY3Rpb24gcmV0YXJnZXQgKGVsKSB7XG4gICAgaW5wdXRFdmVudHModHJ1ZSk7XG4gICAgYXR0YWNobWVudCA9IGFwaS5hdHRhY2htZW50ID0gZWw7XG4gICAgdGV4dElucHV0ID0gYXR0YWNobWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGF0dGFjaG1lbnQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbiAgICBhbnlJbnB1dCA9IHRleHRJbnB1dCB8fCBpc0VkaXRhYmxlKGF0dGFjaG1lbnQpO1xuICAgIGlucHV0RXZlbnRzKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWZyZXNoUG9zaXRpb24gKCkge1xuICAgIGlmIChleWUpIHsgZXllLnJlZnJlc2goKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGluZyAoZm9yY2VTaG93KSB7XG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LnJlbW92ZShhdHRhY2htZW50LCAnZm9jdXMnLCBsb2FkaW5nKTtcbiAgICBjb25zdCBxdWVyeSA9IHJlYWRJbnB1dCgpO1xuICAgIGlmIChxdWVyeSA9PT0gc3RhdGUucXVlcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFzSXRlbXMgPSBmYWxzZTtcbiAgICBzdGF0ZS5xdWVyeSA9IHF1ZXJ5O1xuXG4gICAgY29uc3QgY291bnRlciA9ICsrc3RhdGUuY291bnRlcjtcblxuICAgIHNvdXJjZSh7IHF1ZXJ5LCBsaW1pdCB9LCBzb3VyY2VkKTtcblxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0LCBibGFua1F1ZXJ5KSB7XG4gICAgICBpZiAoc3RhdGUuY291bnRlciAhPT0gY291bnRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2FkZWQocmVzdWx0LCBmb3JjZVNob3cpO1xuICAgICAgaWYgKGVyciB8fCBibGFua1F1ZXJ5KSB7XG4gICAgICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGVkIChjYXRlZ29yaWVzLCBmb3JjZVNob3cpIHtcbiAgICBjbGVhcigpO1xuICAgIGhhc0l0ZW1zID0gdHJ1ZTtcbiAgICBhcGkuc291cmNlID0gW107XG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiBjYXQubGlzdC5mb3JFYWNoKHN1Z2dlc3Rpb24gPT4gYWRkKHN1Z2dlc3Rpb24sIGNhdCkpKTtcbiAgICBpZiAoZm9yY2VTaG93KSB7XG4gICAgICBzaG93KCk7XG4gICAgfVxuICAgIGZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIgKCkge1xuICAgIHVuc2VsZWN0KCk7XG4gICAgd2hpbGUgKGNhdGVnb3JpZXMubGFzdENoaWxkKSB7XG4gICAgICBjYXRlZ29yaWVzLnJlbW92ZUNoaWxkKGNhdGVnb3JpZXMubGFzdENoaWxkKTtcbiAgICB9XG4gICAgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkSW5wdXQgKCkge1xuICAgIHJldHVybiAodGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUwpLnRyaW0oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENhdGVnb3J5IChkYXRhKSB7XG4gICAgaWYgKCFkYXRhLmlkKSB7XG4gICAgICBkYXRhLmlkID0gJ2RlZmF1bHQnO1xuICAgIH1cbiAgICBpZiAoIWNhdGVnb3J5TWFwW2RhdGEuaWRdKSB7XG4gICAgICBjYXRlZ29yeU1hcFtkYXRhLmlkXSA9IGNyZWF0ZUNhdGVnb3J5KCk7XG4gICAgfVxuICAgIHJldHVybiBjYXRlZ29yeU1hcFtkYXRhLmlkXTtcbiAgICBmdW5jdGlvbiBjcmVhdGVDYXRlZ29yeSAoKSB7XG4gICAgICBjb25zdCBjYXRlZ29yeSA9IHRhZygnZGl2JywgJ3NleS1jYXRlZ29yeScpO1xuICAgICAgY29uc3QgdWwgPSB0YWcoJ3VsJywgJ3NleS1saXN0Jyk7XG4gICAgICByZW5kZXJDYXRlZ29yeShjYXRlZ29yeSwgZGF0YSk7XG4gICAgICBjYXRlZ29yeS5hcHBlbmRDaGlsZCh1bCk7XG4gICAgICBjYXRlZ29yaWVzLmFwcGVuZENoaWxkKGNhdGVnb3J5KTtcbiAgICAgIHJldHVybiB7IGRhdGEsIHVsIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkIChzdWdnZXN0aW9uLCBjYXRlZ29yeURhdGEpIHtcbiAgICBjb25zdCBjYXQgPSBnZXRDYXRlZ29yeShjYXRlZ29yeURhdGEpO1xuICAgIGNvbnN0IGxpID0gdGFnKCdsaScsICdzZXktaXRlbScpO1xuICAgIHJlbmRlckl0ZW0obGksIHN1Z2dlc3Rpb24pO1xuICAgIGlmIChoaWdobGlnaHRlcikge1xuICAgICAgYnJlYWt1cEZvckhpZ2hsaWdodGVyKGxpKTtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ21vdXNlZW50ZXInLCBob3ZlclN1Z2dlc3Rpb24pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdjbGljaycsIGNsaWNrZWRTdWdnZXN0aW9uKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnaG9yc2V5LWZpbHRlcicsIGZpbHRlckl0ZW0pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdob3JzZXktaGlkZScsIGhpZGVJdGVtKTtcbiAgICBjYXQudWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgIGFwaS5zb3VyY2UucHVzaChzdWdnZXN0aW9uKTtcbiAgICByZXR1cm4gbGk7XG5cbiAgICBmdW5jdGlvbiBob3ZlclN1Z2dlc3Rpb24gKCkge1xuICAgICAgc2VsZWN0KGxpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGlja2VkU3VnZ2VzdGlvbiAoKSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGdldFRleHQoc3VnZ2VzdGlvbik7XG4gICAgICBzZXQoc3VnZ2VzdGlvbik7XG4gICAgICBoaWRlKCk7XG4gICAgICBhdHRhY2htZW50LmZvY3VzKCk7XG4gICAgICBsYXN0UHJlZml4ID0gby5wcmVkaWN0TmV4dFNlYXJjaCAmJiBvLnByZWRpY3ROZXh0U2VhcmNoKHtcbiAgICAgICAgaW5wdXQ6IGlucHV0LFxuICAgICAgICBzb3VyY2U6IGFwaS5zb3VyY2Uuc2xpY2UoKSxcbiAgICAgICAgc2VsZWN0aW9uOiBzdWdnZXN0aW9uXG4gICAgICB9KSB8fCAnJztcbiAgICAgIGlmIChsYXN0UHJlZml4KSB7XG4gICAgICAgIGVsLnZhbHVlID0gbGFzdFByZWZpeDtcbiAgICAgICAgZWwuc2VsZWN0KCk7XG4gICAgICAgIHNob3coKTtcbiAgICAgICAgZmlsdGVyaW5nKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySXRlbSAoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xuICAgICAgaWYgKGZpbHRlcih2YWx1ZSwgc3VnZ2VzdGlvbikpIHtcbiAgICAgICAgbGkuY2xhc3NOYW1lID0gbGkuY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktaGlkZS9nLCAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlSXRlbSAoKSB7XG4gICAgICBpZiAoIWhpZGRlbihsaSkpIHtcbiAgICAgICAgbGkuY2xhc3NOYW1lICs9ICcgc2V5LWhpZGUnO1xuICAgICAgICBpZiAoc2VsZWN0aW9uID09PSBsaSkge1xuICAgICAgICAgIHVuc2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBicmVha3VwRm9ySGlnaGxpZ2h0ZXIgKGVsKSB7XG4gICAgZ2V0VGV4dENoaWxkcmVuKGVsKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZTtcbiAgICAgIGNvbnN0IHRleHQgPSBlbC50ZXh0Q29udGVudCB8fCBlbC5ub2RlVmFsdWUgfHwgJyc7XG4gICAgICBpZiAodGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDAsIGNoYXJzID0gdGV4dC5zcGxpdCgnJyk7IGkgPCBjaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHNwYW5Gb3IoY2hhcnNbaV0pLCBlbCk7XG4gICAgICB9XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgZnVuY3Rpb24gc3BhbkZvciAoY2hhcikge1xuICAgICAgICBjb25zdCBzcGFuID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSAnc2V5LWNoYXInO1xuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gc3Bhbi5pbm5lclRleHQgPSBjaGFyO1xuICAgICAgICByZXR1cm4gc3BhbjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodCAoZWwsIG5lZWRsZSkge1xuICAgIGNvbnN0IHJ3b3JkID0gL1tcXHMsLl9cXFtcXF17fSgpLV0vZztcbiAgICBjb25zdCB3b3JkcyA9IG5lZWRsZS5zcGxpdChyd29yZCkuZmlsdGVyKHcgPT4gdy5sZW5ndGgpO1xuICAgIGNvbnN0IGVsZW1zID0gW10uc2xpY2UuY2FsbChlbC5xdWVyeVNlbGVjdG9yQWxsKCcuc2V5LWNoYXInKSk7XG4gICAgbGV0IGNoYXJzO1xuICAgIGxldCBzdGFydEluZGV4ID0gMDtcblxuICAgIGJhbGFuY2UoKTtcbiAgICBpZiAoaGlnaGxpZ2h0Q29tcGxldGVXb3Jkcykge1xuICAgICAgd2hvbGUoKTtcbiAgICB9XG4gICAgZnV6enkoKTtcbiAgICBjbGVhclJlbWFpbmRlcigpO1xuXG4gICAgZnVuY3Rpb24gYmFsYW5jZSAoKSB7XG4gICAgICBjaGFycyA9IGVsZW1zLm1hcChlbCA9PiBlbC5pbm5lclRleHQgfHwgZWwudGV4dENvbnRlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdob2xlICgpIHtcbiAgICAgIGZvciAobGV0IHdvcmRJbmRleCA9IDAsIHdvcmQ7IHdvcmRJbmRleCA8IHdvcmRzLmxlbmd0aDsgd29yZEluZGV4KyspIHtcbiAgICAgICAgY29uc3Qgd29yZCA9IHdvcmRzW3dvcmRJbmRleF07XG4gICAgICAgIGxldCB0ZW1wSW5kZXggPSBzdGFydEluZGV4O1xuICAgICAgICByZXRyeTogd2hpbGUgKHRlbXBJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5pdCA9IHRydWU7XG4gICAgICAgICAgbGV0IHByZXZJbmRleCA9IHRlbXBJbmRleDtcbiAgICAgICAgICBmb3IgKGxldCBjaGFySW5kZXggPSAwLCBjaGFycyA9IHdvcmQuc3BsaXQoJycpOyBjaGFySW5kZXggPCBjaGFycy5sZW5ndGg7IGNoYXJJbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGFyID0gY2hhcnNbY2hhckluZGV4XTtcbiAgICAgICAgICAgIGNvbnN0IGkgPSBjaGFycy5pbmRleE9mKGNoYXIsIHByZXZJbmRleCArIDEpO1xuICAgICAgICAgICAgY29uc3QgZmFpbCA9IGkgPT09IC0xIHx8ICghaW5pdCAmJiBwcmV2SW5kZXggKyAxICE9PSBpKTtcbiAgICAgICAgICAgIGlmIChpbml0KSB7XG4gICAgICAgICAgICAgIGluaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGVtcEluZGV4ID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmYWlsKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlIHJldHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkluZGV4ID0gaTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgZWxlbUluZGV4ID0gMCwgbWF0Y2hlZEVsZW1zID0gZWxlbXMuc3BsaWNlKHRlbXBJbmRleCwgMSArIHByZXZJbmRleCAtIHRlbXBJbmRleCk7IGVsZW1JbmRleCA8IG1hdGNoZWRFbGVtcy5sZW5ndGg7IGVsZW1JbmRleCsrKSB7XG4gICAgICAgICAgICBvbihtYXRjaGVkRWxlbXNbZWxlbUluZGV4XSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJhbGFuY2UoKTtcbiAgICAgICAgICBuZWVkbGUgPSBuZWVkbGUucmVwbGFjZSh3b3JkLCAnJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmdXp6eSAoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgY2hhcnMgPSBuZWVkbGUuc3BsaXQoJycpOyBpIDwgY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd2hpbGUgKGVsZW1zLmxlbmd0aCkge1xuICAgICAgICAgIGxldCBlbCA9IGVsZW1zLnNoaWZ0KCk7XG4gICAgICAgICAgaWYgKChlbC5pbm5lclRleHQgfHwgZWwudGV4dENvbnRlbnQpID09PSBjaGFyc1tpXSkge1xuICAgICAgICAgICAgb24oZWwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9mZihlbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYXJSZW1haW5kZXIgKCkge1xuICAgICAgd2hpbGUgKGVsZW1zLmxlbmd0aCkge1xuICAgICAgICBvZmYoZWxlbXMuc2hpZnQoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb24gKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QuYWRkKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb2ZmIChjaCkge1xuICAgICAgY2guY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWNoYXItaGlnaGxpZ2h0Jyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VGV4dENoaWxkcmVuIChlbCkge1xuICAgIGNvbnN0IHRleHRzID0gW107XG4gICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihlbCwgTm9kZUZpbHRlci5TSE9XX1RFWFQsIG51bGwsIGZhbHNlKTtcbiAgICBsZXQgbm9kZTtcbiAgICB3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgICB0ZXh0cy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dHM7XG4gIH1cblxuICBmdW5jdGlvbiBzZXQgKHZhbHVlKSB7XG4gICAgaWYgKG8uYW5jaG9yKSB7XG4gICAgICByZXR1cm4gKGlzVGV4dCgpID8gYXBpLmFwcGVuZFRleHQgOiBhcGkuYXBwZW5kSFRNTCkoZ2V0VmFsdWUodmFsdWUpKTtcbiAgICB9XG4gICAgdXNlclNldCh2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIgKHZhbHVlLCBzdWdnZXN0aW9uKSB7XG4gICAgaWYgKG8uYW5jaG9yKSB7XG4gICAgICBjb25zdCBpbCA9IChpc1RleHQoKSA/IGFwaS5maWx0ZXJBbmNob3JlZFRleHQgOiBhcGkuZmlsdGVyQW5jaG9yZWRIVE1MKSh2YWx1ZSwgc3VnZ2VzdGlvbik7XG4gICAgICByZXR1cm4gaWwgPyB1c2VyRmlsdGVyKGlsLmlucHV0LCBpbC5zdWdnZXN0aW9uKSA6IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdXNlckZpbHRlcih2YWx1ZSwgc3VnZ2VzdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBpc1RleHQgKCkgeyByZXR1cm4gaXNJbnB1dChhdHRhY2htZW50KTsgfVxuICBmdW5jdGlvbiB2aXNpYmxlICgpIHsgcmV0dXJuIGNvbnRhaW5lci5jbGFzc05hbWUuaW5kZXhPZignc2V5LXNob3cnKSAhPT0gLTE7IH1cbiAgZnVuY3Rpb24gaGlkZGVuIChsaSkgeyByZXR1cm4gbGkuY2xhc3NOYW1lLmluZGV4T2YoJ3NleS1oaWRlJykgIT09IC0xOyB9XG5cbiAgZnVuY3Rpb24gc2hvdyAoKSB7XG4gICAgZXllLnJlZnJlc2goKTtcbiAgICBpZiAoIXZpc2libGUoKSkge1xuICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSArPSAnIHNleS1zaG93JztcbiAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1zaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlciAoZSkge1xuICAgIGNvbnN0IGxlZnQgPSBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleTtcbiAgICBpZiAobGVmdCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybjsgLy8gd2Ugb25seSBjYXJlIGFib3V0IGhvbmVzdCB0byBnb2QgbGVmdC1jbGlja3NcbiAgICB9XG4gICAgdG9nZ2xlKCk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUgKCkge1xuICAgIGlmICghdmlzaWJsZSgpKSB7XG4gICAgICBzaG93KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZWxlY3QgKGxpKSB7XG4gICAgdW5zZWxlY3QoKTtcbiAgICBpZiAobGkpIHtcbiAgICAgIHNlbGVjdGlvbiA9IGxpO1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSArPSAnIHNleS1zZWxlY3RlZCc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdW5zZWxlY3QgKCkge1xuICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5jbGFzc05hbWUgPSBzZWxlY3Rpb24uY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktc2VsZWN0ZWQvZywgJycpO1xuICAgICAgc2VsZWN0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlICh1cCwgbW92ZXMpIHtcbiAgICBjb25zdCB0b3RhbCA9IGFwaS5zb3VyY2UubGVuZ3RoO1xuICAgIGlmICh0b3RhbCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW92ZXMgPiB0b3RhbCkge1xuICAgICAgdW5zZWxlY3QoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2F0ID0gZmluZENhdGVnb3J5KHNlbGVjdGlvbikgfHwgY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgIGNvbnN0IGZpcnN0ID0gdXAgPyAnbGFzdENoaWxkJyA6ICdmaXJzdENoaWxkJztcbiAgICBjb25zdCBsYXN0ID0gdXAgPyAnZmlyc3RDaGlsZCcgOiAnbGFzdENoaWxkJztcbiAgICBjb25zdCBuZXh0ID0gdXAgPyAncHJldmlvdXNTaWJsaW5nJyA6ICduZXh0U2libGluZyc7XG4gICAgY29uc3QgcHJldiA9IHVwID8gJ25leHRTaWJsaW5nJyA6ICdwcmV2aW91c1NpYmxpbmcnO1xuICAgIGNvbnN0IGxpID0gZmluZE5leHQoKTtcbiAgICBzZWxlY3QobGkpO1xuXG4gICAgaWYgKGhpZGRlbihsaSkpIHtcbiAgICAgIG1vdmUodXAsIG1vdmVzID8gbW92ZXMgKyAxIDogMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZENhdGVnb3J5IChlbCkge1xuICAgICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIGlmIChzZWt0b3IubWF0Y2hlc1NlbGVjdG9yKGVsLnBhcmVudEVsZW1lbnQsICcuc2V5LWNhdGVnb3J5JykpIHtcbiAgICAgICAgICByZXR1cm4gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kTmV4dCAoKSB7XG4gICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgIGlmIChzZWxlY3Rpb25bbmV4dF0pIHtcbiAgICAgICAgICByZXR1cm4gc2VsZWN0aW9uW25leHRdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYXRbbmV4dF0gJiYgZmluZExpc3QoY2F0W25leHRdKVtmaXJzdF0pIHtcbiAgICAgICAgICByZXR1cm4gZmluZExpc3QoY2F0W25leHRdKVtmaXJzdF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5kTGlzdChjYXRlZ29yaWVzW2ZpcnN0XSlbZmlyc3RdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGUgKCkge1xuICAgIGV5ZS5zbGVlcCgpO1xuICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSBjb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktc2hvdy9nLCAnJyk7XG4gICAgdW5zZWxlY3QoKTtcbiAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktaGlkZScpO1xuICAgIGlmIChlbC52YWx1ZSA9PT0gbGFzdFByZWZpeCkge1xuICAgICAgZWwudmFsdWUgPSAnJztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBrZXlkb3duIChlKSB7XG4gICAgY29uc3Qgc2hvd24gPSB2aXNpYmxlKCk7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9ET1dOKSB7XG4gICAgICBpZiAoYW55SW5wdXQgJiYgby5hdXRvU2hvd09uVXBEb3duKSB7XG4gICAgICAgIHNob3coKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaG93bikge1xuICAgICAgICBtb3ZlKCk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX1VQKSB7XG4gICAgICBpZiAoYW55SW5wdXQgJiYgby5hdXRvU2hvd09uVXBEb3duKSB7XG4gICAgICAgIHNob3coKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaG93bikge1xuICAgICAgICBtb3ZlKHRydWUpO1xuICAgICAgICBzdG9wKGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IEtFWV9CQUNLU1BBQ0UpIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc2hvd24pIHtcbiAgICAgIGlmICh3aGljaCA9PT0gS0VZX0VOVEVSKSB7XG4gICAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKHNlbGVjdGlvbiwgJ2NsaWNrJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfRVNDKSB7XG4gICAgICAgIGhpZGUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Tm9SZXN1bHRzICgpIHtcbiAgICBpZiAobm9uZU1hdGNoKSB7XG4gICAgICBub25lTWF0Y2guY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTm9SZXN1bHRzICgpIHtcbiAgICBpZiAobm9uZU1hdGNoKSB7XG4gICAgICBub25lTWF0Y2guY2xhc3NMaXN0LmFkZCgnc2V5LWhpZGUnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJpbmcgKCkge1xuICAgIGlmICghdmlzaWJsZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlYm91bmNlZExvYWRpbmcodHJ1ZSk7XG4gICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LWZpbHRlcicpO1xuICAgIGNvbnN0IHZhbHVlID0gcmVhZElucHV0KCk7XG4gICAgaWYgKCFvLmJsYW5rU2VhcmNoICYmICF2YWx1ZSkge1xuICAgICAgaGlkZSgpOyByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5vbWF0Y2ggPSBub01hdGNoZXMoeyBxdWVyeTogdmFsdWUgfSk7XG4gICAgbGV0IGNvdW50ID0gd2Fsa0NhdGVnb3JpZXMoKTtcbiAgICBpZiAoY291bnQgPT09IDAgJiYgbm9tYXRjaCAmJiBoYXNJdGVtcykge1xuICAgICAgc2hvd05vUmVzdWx0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWRlTm9SZXN1bHRzKCk7XG4gICAgfVxuICAgIGlmICghc2VsZWN0aW9uKSB7XG4gICAgICBtb3ZlKCk7XG4gICAgfVxuICAgIGlmICghc2VsZWN0aW9uICYmICFub21hdGNoKSB7XG4gICAgICBoaWRlKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdhbGtDYXRlZ29yaWVzICgpIHtcbiAgICAgIGxldCBjYXRlZ29yeSA9IGNhdGVnb3JpZXMuZmlyc3RDaGlsZDtcbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICB3aGlsZSAoY2F0ZWdvcnkpIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IGZpbmRMaXN0KGNhdGVnb3J5KTtcbiAgICAgICAgY29uc3QgcGFydGlhbCA9IHdhbGtDYXRlZ29yeShsaXN0KTtcbiAgICAgICAgaWYgKHBhcnRpYWwgPT09IDApIHtcbiAgICAgICAgICBjYXRlZ29yeS5jbGFzc0xpc3QuYWRkKCdzZXktaGlkZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhdGVnb3J5LmNsYXNzTGlzdC5yZW1vdmUoJ3NleS1oaWRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnQgKz0gcGFydGlhbDtcbiAgICAgICAgY2F0ZWdvcnkgPSBjYXRlZ29yeS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3VudDtcbiAgICB9XG4gICAgZnVuY3Rpb24gd2Fsa0NhdGVnb3J5ICh1bCkge1xuICAgICAgbGV0IGxpID0gdWwuZmlyc3RDaGlsZDtcbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICB3aGlsZSAobGkpIHtcbiAgICAgICAgaWYgKGNvdW50ID49IGxpbWl0KSB7XG4gICAgICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShsaSwgJ2hvcnNleS1oaWRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShsaSwgJ2hvcnNleS1maWx0ZXInKTtcbiAgICAgICAgICBpZiAobGkuY2xhc3NOYW1lLmluZGV4T2YoJ3NleS1oaWRlJykgPT09IC0xKSB7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgaWYgKGhpZ2hsaWdodGVyKSB7XG4gICAgICAgICAgICAgIGhpZ2hsaWdodChsaSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaSA9IGxpLm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmVycmVkRmlsdGVyaW5nTm9FbnRlciAoZSkge1xuICAgIGNvbnN0IHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVmZXJyZWRGaWx0ZXJpbmcoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmVycmVkU2hvdyAoZSkge1xuICAgIGNvbnN0IHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIgfHwgd2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0VGltZW91dChzaG93LCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF1dG9jb21wbGV0ZUV2ZW50VGFyZ2V0IChlKSB7XG4gICAgbGV0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgIGlmICh0YXJnZXQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB3aGlsZSAodGFyZ2V0KSB7XG4gICAgICBpZiAodGFyZ2V0ID09PSBjb250YWluZXIgfHwgdGFyZ2V0ID09PSBhdHRhY2htZW50KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU9uQmx1ciAoZSkge1xuICAgIGNvbnN0IHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfVEFCKSB7XG4gICAgICBoaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU9uQ2xpY2sgKGUpIHtcbiAgICBpZiAoYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQoZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGlkZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5wdXRFdmVudHMgKHJlbW92ZSkge1xuICAgIGNvbnN0IG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgICBpZiAoZXllKSB7XG4gICAgICBleWUuZGVzdHJveSgpO1xuICAgICAgZXllID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFyZW1vdmUpIHtcbiAgICAgIGV5ZSA9IGJ1bGxzZXllKGNvbnRhaW5lciwgYXR0YWNobWVudCwge1xuICAgICAgICBjYXJldDogYW55SW5wdXQgJiYgYXR0YWNobWVudC50YWdOYW1lICE9PSAnSU5QVVQnLFxuICAgICAgICBjb250ZXh0OiBvLmFwcGVuZFRvXG4gICAgICB9KTtcbiAgICAgIGlmICghdmlzaWJsZSgpKSB7IGV5ZS5zbGVlcCgpOyB9XG4gICAgfVxuICAgIGlmIChyZW1vdmUgfHwgKGFueUlucHV0ICYmIGRvYy5hY3RpdmVFbGVtZW50ICE9PSBhdHRhY2htZW50KSkge1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAnZm9jdXMnLCBsb2FkaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9hZGluZygpO1xuICAgIH1cbiAgICBpZiAoYW55SW5wdXQpIHtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleXByZXNzJywgZGVmZXJyZWRTaG93KTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleXByZXNzJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGRlZmVycmVkRmlsdGVyaW5nTm9FbnRlcik7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdwYXN0ZScsIGRlZmVycmVkRmlsdGVyaW5nKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICAgIGlmIChvLmF1dG9IaWRlT25CbHVyKSB7IGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBoaWRlT25CbHVyKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdjbGljaycsIHRvZ2dsZXIpO1xuICAgICAgY3Jvc3N2ZW50W29wXShkb2NFbGVtZW50LCAna2V5ZG93bicsIGtleWRvd24pO1xuICAgIH1cbiAgICBpZiAoby5hdXRvSGlkZU9uQ2xpY2spIHsgY3Jvc3N2ZW50W29wXShkb2MsICdjbGljaycsIGhpZGVPbkNsaWNrKTsgfVxuICAgIGlmIChmb3JtKSB7IGNyb3NzdmVudFtvcF0oZm9ybSwgJ3N1Ym1pdCcsIGhpZGUpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBpbnB1dEV2ZW50cyh0cnVlKTtcbiAgICBpZiAocGFyZW50LmNvbnRhaW5zKGNvbnRhaW5lcikpIHsgcGFyZW50LnJlbW92ZUNoaWxkKGNvbnRhaW5lcik7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRTZXR0ZXIgKHZhbHVlKSB7XG4gICAgaWYgKHRleHRJbnB1dCkge1xuICAgICAgaWYgKHNldEFwcGVuZHMgPT09IHRydWUpIHtcbiAgICAgICAgZWwudmFsdWUgKz0gJyAnICsgdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyA9PT0gdHJ1ZSkge1xuICAgICAgICBlbC5pbm5lckhUTUwgKz0gJyAnICsgdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0SXRlbVJlbmRlcmVyIChsaSwgc3VnZ2VzdGlvbikge1xuICAgIHRleHQobGksIGdldFRleHQoc3VnZ2VzdGlvbikpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIgKGRpdiwgZGF0YSkge1xuICAgIGlmIChkYXRhLmlkICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIGNvbnN0IGlkID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3J5LWlkJyk7XG4gICAgICBkaXYuYXBwZW5kQ2hpbGQoaWQpO1xuICAgICAgdGV4dChpZCwgZGF0YS5pZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdEZpbHRlciAocSwgc3VnZ2VzdGlvbikge1xuICAgIGNvbnN0IG5lZWRsZSA9IHEudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB0ZXh0ID0gZ2V0VGV4dChzdWdnZXN0aW9uKSB8fCAnJztcbiAgICBpZiAoZnV6enlzZWFyY2gobmVlZGxlLCB0ZXh0LnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShzdWdnZXN0aW9uKSB8fCAnJztcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZnV6enlzZWFyY2gobmVlZGxlLCB2YWx1ZS50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb3BiYWNrVG9BbmNob3IgKHRleHQsIHApIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgbGV0IGFuY2hvcmVkID0gZmFsc2U7XG4gICAgbGV0IHN0YXJ0ID0gcC5zdGFydDtcbiAgICB3aGlsZSAoYW5jaG9yZWQgPT09IGZhbHNlICYmIHN0YXJ0ID49IDApIHtcbiAgICAgIHJlc3VsdCA9IHRleHQuc3Vic3RyKHN0YXJ0IC0gMSwgcC5zdGFydCAtIHN0YXJ0ICsgMSk7XG4gICAgICBhbmNob3JlZCA9IHJhbmNob3JsZWZ0LnRlc3QocmVzdWx0KTtcbiAgICAgIHN0YXJ0LS07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiBhbmNob3JlZCA/IHJlc3VsdCA6IG51bGwsXG4gICAgICBzdGFydFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbmNob3JlZFRleHQgKHEsIHN1Z2dlc3Rpb24pIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHNlbGwoZWwpO1xuICAgIGNvbnN0IGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihxLCBwb3NpdGlvbikudGV4dDtcbiAgICBpZiAoaW5wdXQpIHtcbiAgICAgIHJldHVybiB7IGlucHV0LCBzdWdnZXN0aW9uIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dCAodmFsdWUpIHtcbiAgICBjb25zdCBjdXJyZW50ID0gZWwudmFsdWU7XG4gICAgY29uc3QgcG9zaXRpb24gPSBzZWxsKGVsKTtcbiAgICBjb25zdCBpbnB1dCA9IGxvb3BiYWNrVG9BbmNob3IoY3VycmVudCwgcG9zaXRpb24pO1xuICAgIGNvbnN0IGxlZnQgPSBjdXJyZW50LnN1YnN0cigwLCBpbnB1dC5zdGFydCk7XG4gICAgY29uc3QgcmlnaHQgPSBjdXJyZW50LnN1YnN0cihpbnB1dC5zdGFydCArIGlucHV0LnRleHQubGVuZ3RoICsgKHBvc2l0aW9uLmVuZCAtIHBvc2l0aW9uLnN0YXJ0KSk7XG4gICAgY29uc3QgYmVmb3JlID0gbGVmdCArIHZhbHVlICsgJyAnO1xuXG4gICAgZWwudmFsdWUgPSBiZWZvcmUgKyByaWdodDtcbiAgICBzZWxsKGVsLCB7IHN0YXJ0OiBiZWZvcmUubGVuZ3RoLCBlbmQ6IGJlZm9yZS5sZW5ndGggfSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbmNob3JlZEhUTUwgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW5jaG9yaW5nIGluIGVkaXRhYmxlIGVsZW1lbnRzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQuJyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRIVE1MICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuY2hvcmluZyBpbiBlZGl0YWJsZSBlbGVtZW50cyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0LicpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluZExpc3QgKGNhdGVnb3J5KSB7IHJldHVybiBzZWt0b3IoJy5zZXktbGlzdCcsIGNhdGVnb3J5KVswXTsgfVxufVxuXG5mdW5jdGlvbiBpc0lucHV0IChlbCkgeyByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnOyB9XG5cbmZ1bmN0aW9uIHRhZyAodHlwZSwgY2xhc3NOYW1lKSB7XG4gIGNvbnN0IGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodHlwZSk7XG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBkZWZlciAoZm4pIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHsgc2V0VGltZW91dChmbiwgMCk7IH07IH1cbmZ1bmN0aW9uIHRleHQgKGVsLCB2YWx1ZSkgeyBlbC5pbm5lclRleHQgPSBlbC50ZXh0Q29udGVudCA9IHZhbHVlOyB9XG5cbmZ1bmN0aW9uIGlzRWRpdGFibGUgKGVsKSB7XG4gIGNvbnN0IHZhbHVlID0gZWwuZ2V0QXR0cmlidXRlKCdjb250ZW50RWRpdGFibGUnKTtcbiAgaWYgKHZhbHVlID09PSAnZmFsc2UnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh2YWx1ZSA9PT0gJ3RydWUnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGVsLnBhcmVudEVsZW1lbnQpIHtcbiAgICByZXR1cm4gaXNFZGl0YWJsZShlbC5wYXJlbnRFbGVtZW50KTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9yc2V5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdG9hIChhLCBuKSB7IHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhLCBuKTsgfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG52YXIgdGFpbG9ybWFkZSA9IHJlcXVpcmUoJy4vdGFpbG9ybWFkZScpO1xuXG5mdW5jdGlvbiBidWxsc2V5ZSAoZWwsIHRhcmdldCwgb3B0aW9ucykge1xuICB2YXIgbyA9IG9wdGlvbnM7XG4gIHZhciBkb21UYXJnZXQgPSB0YXJnZXQgJiYgdGFyZ2V0LnRhZ05hbWU7XG5cbiAgaWYgKCFkb21UYXJnZXQgJiYgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIG8gPSB0YXJnZXQ7XG4gIH1cbiAgaWYgKCFkb21UYXJnZXQpIHtcbiAgICB0YXJnZXQgPSBlbDtcbiAgfVxuICBpZiAoIW8pIHsgbyA9IHt9OyB9XG5cbiAgdmFyIGRlc3Ryb3llZCA9IGZhbHNlO1xuICB2YXIgdGhyb3R0bGVkV3JpdGUgPSB0aHJvdHRsZSh3cml0ZSwgMzApO1xuICB2YXIgdGFpbG9yT3B0aW9ucyA9IHsgdXBkYXRlOiBvLmF1dG91cGRhdGVUb0NhcmV0ICE9PSBmYWxzZSAmJiB1cGRhdGUgfTtcbiAgdmFyIHRhaWxvciA9IG8uY2FyZXQgJiYgdGFpbG9ybWFkZSh0YXJnZXQsIHRhaWxvck9wdGlvbnMpO1xuXG4gIHdyaXRlKCk7XG5cbiAgaWYgKG8udHJhY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgY3Jvc3N2ZW50LmFkZCh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRXcml0ZSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlYWQ6IHJlYWROdWxsLFxuICAgIHJlZnJlc2g6IHdyaXRlLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3ksXG4gICAgc2xlZXA6IHNsZWVwXG4gIH07XG5cbiAgZnVuY3Rpb24gc2xlZXAgKCkge1xuICAgIHRhaWxvck9wdGlvbnMuc2xlZXBpbmcgPSB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZE51bGwgKCkgeyByZXR1cm4gcmVhZCgpOyB9XG5cbiAgZnVuY3Rpb24gcmVhZCAocmVhZGluZ3MpIHtcbiAgICB2YXIgYm91bmRzID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIGlmICh0YWlsb3IpIHtcbiAgICAgIHJlYWRpbmdzID0gdGFpbG9yLnJlYWQoKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IChyZWFkaW5ncy5hYnNvbHV0ZSA/IDAgOiBib3VuZHMubGVmdCkgKyByZWFkaW5ncy54LFxuICAgICAgICB5OiAocmVhZGluZ3MuYWJzb2x1dGUgPyAwIDogYm91bmRzLnRvcCkgKyBzY3JvbGxUb3AgKyByZWFkaW5ncy55ICsgMjBcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB4OiBib3VuZHMubGVmdCxcbiAgICAgIHk6IGJvdW5kcy50b3AgKyBzY3JvbGxUb3BcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChyZWFkaW5ncykge1xuICAgIHdyaXRlKHJlYWRpbmdzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlIChyZWFkaW5ncykge1xuICAgIGlmIChkZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnVsbHNleWUgY2FuXFwndCByZWZyZXNoIGFmdGVyIGJlaW5nIGRlc3Ryb3llZC4gQ3JlYXRlIGFub3RoZXIgaW5zdGFuY2UgaW5zdGVhZC4nKTtcbiAgICB9XG4gICAgaWYgKHRhaWxvciAmJiAhcmVhZGluZ3MpIHtcbiAgICAgIHRhaWxvck9wdGlvbnMuc2xlZXBpbmcgPSBmYWxzZTtcbiAgICAgIHRhaWxvci5yZWZyZXNoKCk7IHJldHVybjtcbiAgICB9XG4gICAgdmFyIHAgPSByZWFkKHJlYWRpbmdzKTtcbiAgICBpZiAoIXRhaWxvciAmJiB0YXJnZXQgIT09IGVsKSB7XG4gICAgICBwLnkgKz0gdGFyZ2V0Lm9mZnNldEhlaWdodDtcbiAgICB9XG4gICAgdmFyIGNvbnRleHQgPSBvLmNvbnRleHQ7XG4gICAgZWwuc3R5bGUubGVmdCA9IHAueCArICdweCc7XG4gICAgZWwuc3R5bGUudG9wID0gKGNvbnRleHQgPyBjb250ZXh0Lm9mZnNldEhlaWdodCA6IHAueSkgKyAncHgnO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgaWYgKHRhaWxvcikgeyB0YWlsb3IuZGVzdHJveSgpOyB9XG4gICAgY3Jvc3N2ZW50LnJlbW92ZSh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRXcml0ZSk7XG4gICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1bGxzZXllO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VsbCA9IHJlcXVpcmUoJ3NlbGwnKTtcbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciBzZWxlY2Npb24gPSByZXF1aXJlKCdzZWxlY2Npb24nKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciBnZXRTZWxlY3Rpb24gPSBzZWxlY2Npb24uZ2V0O1xudmFyIHByb3BzID0gW1xuICAnZGlyZWN0aW9uJyxcbiAgJ2JveFNpemluZycsXG4gICd3aWR0aCcsXG4gICdoZWlnaHQnLFxuICAnb3ZlcmZsb3dYJyxcbiAgJ292ZXJmbG93WScsXG4gICdib3JkZXJUb3BXaWR0aCcsXG4gICdib3JkZXJSaWdodFdpZHRoJyxcbiAgJ2JvcmRlckJvdHRvbVdpZHRoJyxcbiAgJ2JvcmRlckxlZnRXaWR0aCcsXG4gICdwYWRkaW5nVG9wJyxcbiAgJ3BhZGRpbmdSaWdodCcsXG4gICdwYWRkaW5nQm90dG9tJyxcbiAgJ3BhZGRpbmdMZWZ0JyxcbiAgJ2ZvbnRTdHlsZScsXG4gICdmb250VmFyaWFudCcsXG4gICdmb250V2VpZ2h0JyxcbiAgJ2ZvbnRTdHJldGNoJyxcbiAgJ2ZvbnRTaXplJyxcbiAgJ2ZvbnRTaXplQWRqdXN0JyxcbiAgJ2xpbmVIZWlnaHQnLFxuICAnZm9udEZhbWlseScsXG4gICd0ZXh0QWxpZ24nLFxuICAndGV4dFRyYW5zZm9ybScsXG4gICd0ZXh0SW5kZW50JyxcbiAgJ3RleHREZWNvcmF0aW9uJyxcbiAgJ2xldHRlclNwYWNpbmcnLFxuICAnd29yZFNwYWNpbmcnXG5dO1xudmFyIHdpbiA9IGdsb2JhbDtcbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBmZiA9IHdpbi5tb3pJbm5lclNjcmVlblggIT09IG51bGwgJiYgd2luLm1veklubmVyU2NyZWVuWCAhPT0gdm9pZCAwO1xuXG5mdW5jdGlvbiB0YWlsb3JtYWRlIChlbCwgb3B0aW9ucykge1xuICB2YXIgdGV4dElucHV0ID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnO1xuICB2YXIgdGhyb3R0bGVkUmVmcmVzaCA9IHRocm90dGxlKHJlZnJlc2gsIDMwKTtcbiAgdmFyIG8gPSBvcHRpb25zIHx8IHt9O1xuXG4gIGJpbmQoKTtcblxuICByZXR1cm4ge1xuICAgIHJlYWQ6IHJlYWRQb3NpdGlvbixcbiAgICByZWZyZXNoOiB0aHJvdHRsZWRSZWZyZXNoLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3lcbiAgfTtcblxuICBmdW5jdGlvbiBub29wICgpIHt9XG4gIGZ1bmN0aW9uIHJlYWRQb3NpdGlvbiAoKSB7IHJldHVybiAodGV4dElucHV0ID8gY29vcmRzVGV4dCA6IGNvb3Jkc0hUTUwpKCk7IH1cblxuICBmdW5jdGlvbiByZWZyZXNoICgpIHtcbiAgICBpZiAoby5zbGVlcGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gKG8udXBkYXRlIHx8IG5vb3ApKHJlYWRQb3NpdGlvbigpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc1RleHQgKCkge1xuICAgIHZhciBwID0gc2VsbChlbCk7XG4gICAgdmFyIGNvbnRleHQgPSBwcmVwYXJlKCk7XG4gICAgdmFyIHJlYWRpbmdzID0gcmVhZFRleHRDb29yZHMoY29udGV4dCwgcC5zdGFydCk7XG4gICAgZG9jLmJvZHkucmVtb3ZlQ2hpbGQoY29udGV4dC5taXJyb3IpO1xuICAgIHJldHVybiByZWFkaW5ncztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvb3Jkc0hUTUwgKCkge1xuICAgIHZhciBzZWwgPSBnZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoc2VsLnJhbmdlQ291bnQpIHtcbiAgICAgIHZhciByYW5nZSA9IHNlbC5nZXRSYW5nZUF0KDApO1xuICAgICAgdmFyIG5lZWRzVG9Xb3JrQXJvdW5kTmV3bGluZUJ1ZyA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVOYW1lID09PSAnUCcgJiYgcmFuZ2Uuc3RhcnRPZmZzZXQgPT09IDA7XG4gICAgICBpZiAobmVlZHNUb1dvcmtBcm91bmROZXdsaW5lQnVnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgeDogcmFuZ2Uuc3RhcnRDb250YWluZXIub2Zmc2V0TGVmdCxcbiAgICAgICAgICB5OiByYW5nZS5zdGFydENvbnRhaW5lci5vZmZzZXRUb3AsXG4gICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChyYW5nZS5nZXRDbGllbnRSZWN0cykge1xuICAgICAgICB2YXIgcmVjdHMgPSByYW5nZS5nZXRDbGllbnRSZWN0cygpO1xuICAgICAgICBpZiAocmVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByZWN0c1swXS5sZWZ0LFxuICAgICAgICAgICAgeTogcmVjdHNbMF0udG9wLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHg6IDAsIHk6IDAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUZXh0Q29vcmRzIChjb250ZXh0LCBwKSB7XG4gICAgdmFyIHJlc3QgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciBtaXJyb3IgPSBjb250ZXh0Lm1pcnJvcjtcbiAgICB2YXIgY29tcHV0ZWQgPSBjb250ZXh0LmNvbXB1dGVkO1xuXG4gICAgd3JpdGUobWlycm9yLCByZWFkKGVsKS5zdWJzdHJpbmcoMCwgcCkpO1xuXG4gICAgaWYgKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgIG1pcnJvci50ZXh0Q29udGVudCA9IG1pcnJvci50ZXh0Q29udGVudC5yZXBsYWNlKC9cXHMvZywgJ1xcdTAwYTAnKTtcbiAgICB9XG5cbiAgICB3cml0ZShyZXN0LCByZWFkKGVsKS5zdWJzdHJpbmcocCkgfHwgJy4nKTtcblxuICAgIG1pcnJvci5hcHBlbmRDaGlsZChyZXN0KTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZXN0Lm9mZnNldExlZnQgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyTGVmdFdpZHRoJ10pLFxuICAgICAgeTogcmVzdC5vZmZzZXRUb3AgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyVG9wV2lkdGgnXSlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoZWwpIHtcbiAgICByZXR1cm4gdGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUw7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVwYXJlICgpIHtcbiAgICB2YXIgY29tcHV0ZWQgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUoZWwpIDogZWwuY3VycmVudFN0eWxlO1xuICAgIHZhciBtaXJyb3IgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN0eWxlID0gbWlycm9yLnN0eWxlO1xuXG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQobWlycm9yKTtcblxuICAgIGlmIChlbC50YWdOYW1lICE9PSAnSU5QVVQnKSB7XG4gICAgICBzdHlsZS53b3JkV3JhcCA9ICdicmVhay13b3JkJztcbiAgICB9XG4gICAgc3R5bGUud2hpdGVTcGFjZSA9ICdwcmUtd3JhcCc7XG4gICAgc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICBwcm9wcy5mb3JFYWNoKGNvcHkpO1xuXG4gICAgaWYgKGZmKSB7XG4gICAgICBzdHlsZS53aWR0aCA9IHBhcnNlSW50KGNvbXB1dGVkLndpZHRoKSAtIDIgKyAncHgnO1xuICAgICAgaWYgKGVsLnNjcm9sbEhlaWdodCA+IHBhcnNlSW50KGNvbXB1dGVkLmhlaWdodCkpIHtcbiAgICAgICAgc3R5bGUub3ZlcmZsb3dZID0gJ3Njcm9sbCc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgfVxuICAgIHJldHVybiB7IG1pcnJvcjogbWlycm9yLCBjb21wdXRlZDogY29tcHV0ZWQgfTtcblxuICAgIGZ1bmN0aW9uIGNvcHkgKHByb3ApIHtcbiAgICAgIHN0eWxlW3Byb3BdID0gY29tcHV0ZWRbcHJvcF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKGVsLCB2YWx1ZSkge1xuICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgIGVsLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJpbmQgKHJlbW92ZSkge1xuICAgIHZhciBvcCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2tleWRvd24nLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAna2V5dXAnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnaW5wdXQnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAncGFzdGUnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAnY2hhbmdlJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBiaW5kKHRydWUpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGFpbG9ybWFkZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdGhyb3R0bGUgKGZuLCBib3VuZGFyeSkge1xuICB2YXIgbGFzdCA9IC1JbmZpbml0eTtcbiAgdmFyIHRpbWVyO1xuICByZXR1cm4gZnVuY3Rpb24gYm91bmNlZCAoKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuYm91bmQoKTtcblxuICAgIGZ1bmN0aW9uIHVuYm91bmQgKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIHZhciBuZXh0ID0gbGFzdCArIGJvdW5kYXJ5O1xuICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICBpZiAobm93ID4gbmV4dCkge1xuICAgICAgICBsYXN0ID0gbm93O1xuICAgICAgICBmbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHVuYm91bmQsIG5leHQgLSBub3cpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRpY2t5ID0gcmVxdWlyZSgndGlja3knKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkge1xuICBpZiAoIWZuKSB7IHJldHVybjsgfVxuICB0aWNreShmdW5jdGlvbiBydW4gKCkge1xuICAgIGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXRvYSA9IHJlcXVpcmUoJ2F0b2EnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBldnQgPSB7fTtcbiAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICB0aGluZy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmICghZXZ0W3R5cGVdKSB7XG4gICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgIH0gZWxzZSB7XG4gICAgICBldnRbdHlwZV0ucHVzaChmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGZuLl9vbmNlID0gdHJ1ZTsgLy8gdGhpbmcub2ZmKGZuKSBzdGlsbCB3b3JrcyFcbiAgICB0aGluZy5vbih0eXBlLCBmbik7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vZmYgPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGMgPT09IDEpIHtcbiAgICAgIGRlbGV0ZSBldnRbdHlwZV07XG4gICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICBldnQgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgaWYgKCFldCkgeyByZXR1cm4gdGhpbmc7IH1cbiAgICAgIGV0LnNwbGljZShldC5pbmRleE9mKGZuKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGF0b2EoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdGhpbmcuZW1pdHRlclNuYXBzaG90KGFyZ3Muc2hpZnQoKSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG4gIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGV0ID0gKGV2dFt0eXBlXSB8fCBbXSkuc2xpY2UoMCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgdmFyIGN0eCA9IHRoaXMgfHwgdGhpbmc7XG4gICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0Lmxlbmd0aCkgeyB0aHJvdyBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzOyB9XG4gICAgICBldC5mb3JFYWNoKGZ1bmN0aW9uIGVtaXR0ZXIgKGxpc3Rlbikge1xuICAgICAgICBpZiAob3B0cy5hc3luYykgeyBkZWJvdW5jZShsaXN0ZW4sIGFyZ3MsIGN0eCk7IH0gZWxzZSB7IGxpc3Rlbi5hcHBseShjdHgsIGFyZ3MpOyB9XG4gICAgICAgIGlmIChsaXN0ZW4uX29uY2UpIHsgdGhpbmcub2ZmKHR5cGUsIGxpc3Rlbik7IH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gIH07XG4gIHJldHVybiB0aGluZztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjdXN0b21FdmVudCA9IHJlcXVpcmUoJ2N1c3RvbS1ldmVudCcpO1xudmFyIGV2ZW50bWFwID0gcmVxdWlyZSgnLi9ldmVudG1hcCcpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBsaXN0ZW5lciA9IHVud3JhcChlbCwgdHlwZSwgZm4pO1xuICBpZiAobGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUsIG1vZGVsKSB7XG4gIHZhciBlID0gZXZlbnRtYXAuaW5kZXhPZih0eXBlKSA9PT0gLTEgPyBtYWtlQ3VzdG9tRXZlbnQoKSA6IG1ha2VDbGFzc2ljRXZlbnQoKTtcbiAgaWYgKGVsLmRpc3BhdGNoRXZlbnQpIHtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUNsYXNzaWNFdmVudCAoKSB7XG4gICAgdmFyIGU7XG4gICAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiBlO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDdXN0b21FdmVudCAoKSB7XG4gICAgcmV0dXJuIG5ldyBjdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogbW9kZWwgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZS53aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBldmVudG1hcCA9IFtdO1xudmFyIGV2ZW50bmFtZSA9ICcnO1xudmFyIHJvbiA9IC9eb24vO1xuXG5mb3IgKGV2ZW50bmFtZSBpbiBnbG9iYWwpIHtcbiAgaWYgKHJvbi50ZXN0KGV2ZW50bmFtZSkpIHtcbiAgICBldmVudG1hcC5wdXNoKGV2ZW50bmFtZS5zbGljZSgyKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudG1hcDtcbiIsIlxudmFyIE5hdGl2ZUN1c3RvbUV2ZW50ID0gZ2xvYmFsLkN1c3RvbUV2ZW50O1xuXG5mdW5jdGlvbiB1c2VOYXRpdmUgKCkge1xuICB0cnkge1xuICAgIHZhciBwID0gbmV3IE5hdGl2ZUN1c3RvbUV2ZW50KCdjYXQnLCB7IGRldGFpbDogeyBmb286ICdiYXInIH0gfSk7XG4gICAgcmV0dXJuICAnY2F0JyA9PT0gcC50eXBlICYmICdiYXInID09PSBwLmRldGFpbC5mb287XG4gIH0gY2F0Y2ggKGUpIHtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3Jvc3MtYnJvd3NlciBgQ3VzdG9tRXZlbnRgIGNvbnN0cnVjdG9yLlxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudC5DdXN0b21FdmVudFxuICpcbiAqIEBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZU5hdGl2ZSgpID8gTmF0aXZlQ3VzdG9tRXZlbnQgOlxuXG4vLyBJRSA+PSA5XG4nZnVuY3Rpb24nID09PSB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRXZlbnQgPyBmdW5jdGlvbiBDdXN0b21FdmVudCAodHlwZSwgcGFyYW1zKSB7XG4gIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICB9IGVsc2Uge1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgdm9pZCAwKTtcbiAgfVxuICByZXR1cm4gZTtcbn0gOlxuXG4vLyBJRSA8PSA4XG5mdW5jdGlvbiBDdXN0b21FdmVudCAodHlwZSwgcGFyYW1zKSB7XG4gIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgZS50eXBlID0gdHlwZTtcbiAgaWYgKHBhcmFtcykge1xuICAgIGUuYnViYmxlcyA9IEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpO1xuICAgIGUuY2FuY2VsYWJsZSA9IEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpO1xuICAgIGUuZGV0YWlsID0gcGFyYW1zLmRldGFpbDtcbiAgfSBlbHNlIHtcbiAgICBlLmJ1YmJsZXMgPSBmYWxzZTtcbiAgICBlLmNhbmNlbGFibGUgPSBmYWxzZTtcbiAgICBlLmRldGFpbCA9IHZvaWQgMDtcbiAgfVxuICByZXR1cm4gZTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZnV6enlzZWFyY2ggKG5lZWRsZSwgaGF5c3RhY2spIHtcbiAgdmFyIHRsZW4gPSBoYXlzdGFjay5sZW5ndGg7XG4gIHZhciBxbGVuID0gbmVlZGxlLmxlbmd0aDtcbiAgaWYgKHFsZW4gPiB0bGVuKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChxbGVuID09PSB0bGVuKSB7XG4gICAgcmV0dXJuIG5lZWRsZSA9PT0gaGF5c3RhY2s7XG4gIH1cbiAgb3V0ZXI6IGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IHFsZW47IGkrKykge1xuICAgIHZhciBuY2ggPSBuZWVkbGUuY2hhckNvZGVBdChpKTtcbiAgICB3aGlsZSAoaiA8IHRsZW4pIHtcbiAgICAgIGlmIChoYXlzdGFjay5jaGFyQ29kZUF0KGorKykgPT09IG5jaCkge1xuICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1enp5c2VhcmNoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBwYWQgKGhhc2gsIGxlbikge1xuICB3aGlsZSAoaGFzaC5sZW5ndGggPCBsZW4pIHtcbiAgICBoYXNoID0gJzAnICsgaGFzaDtcbiAgfVxuICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gZm9sZCAoaGFzaCwgdGV4dCkge1xuICB2YXIgaTtcbiAgdmFyIGNocjtcbiAgdmFyIGxlbjtcbiAgaWYgKHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gdGV4dC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGNociA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgaGFzaCB8PSAwO1xuICB9XG4gIHJldHVybiBoYXNoIDwgMCA/IGhhc2ggKiAtMiA6IGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvbGRPYmplY3QgKGhhc2gsIG8sIHNlZW4pIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG8pLnNvcnQoKS5yZWR1Y2UoZm9sZEtleSwgaGFzaCk7XG4gIGZ1bmN0aW9uIGZvbGRLZXkgKGhhc2gsIGtleSkge1xuICAgIHJldHVybiBmb2xkVmFsdWUoaGFzaCwgb1trZXldLCBrZXksIHNlZW4pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvbGRWYWx1ZSAoaW5wdXQsIHZhbHVlLCBrZXksIHNlZW4pIHtcbiAgdmFyIGhhc2ggPSBmb2xkKGZvbGQoZm9sZChpbnB1dCwga2V5KSwgdG9TdHJpbmcodmFsdWUpKSwgdHlwZW9mIHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZvbGQoaGFzaCwgJ251bGwnKTtcbiAgfVxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmb2xkKGhhc2gsICd1bmRlZmluZWQnKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIGZvbGQoaGFzaCwgJ1tDaXJjdWxhcl0nICsga2V5KTtcbiAgICB9XG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gZm9sZE9iamVjdChoYXNoLCB2YWx1ZSwgc2Vlbik7XG4gIH1cbiAgcmV0dXJuIGZvbGQoaGFzaCwgdmFsdWUudG9TdHJpbmcoKSk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyaW5nIChvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cbmZ1bmN0aW9uIHN1bSAobykge1xuICByZXR1cm4gcGFkKGZvbGRWYWx1ZSgwLCBvLCAnJywgW10pLnRvU3RyaW5nKDE2KSwgOCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VtO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4vbm93JyksXG4gICAgdG9OdW1iZXIgPSByZXF1aXJlKCcuL3RvTnVtYmVyJyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvblxuICogdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHNcbiAqIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpcyBpbnZva2VkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHJlc3VsdCA9IHdhaXQgLSB0aW1lU2luY2VMYXN0Q2FsbDtcblxuICAgIHJldHVybiBtYXhpbmcgPyBuYXRpdmVNaW4ocmVzdWx0LCBtYXhXYWl0IC0gdGltZVNpbmNlTGFzdEludm9rZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJbnZva2UodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWU7XG5cbiAgICAvLyBFaXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgY2FsbCwgYWN0aXZpdHkgaGFzIHN0b3BwZWQgYW5kIHdlJ3JlIGF0IHRoZVxuICAgIC8vIHRyYWlsaW5nIGVkZ2UsIHRoZSBzeXN0ZW0gdGltZSBoYXMgZ29uZSBiYWNrd2FyZHMgYW5kIHdlJ3JlIHRyZWF0aW5nXG4gICAgLy8gaXQgYXMgdGhlIHRyYWlsaW5nIGVkZ2UsIG9yIHdlJ3ZlIGhpdCB0aGUgYG1heFdhaXRgIGxpbWl0LlxuICAgIHJldHVybiAobGFzdENhbGxUaW1lID09PSB1bmRlZmluZWQgfHwgKHRpbWVTaW5jZUxhc3RDYWxsID49IHdhaXQpIHx8XG4gICAgICAodGltZVNpbmNlTGFzdENhbGwgPCAwKSB8fCAobWF4aW5nICYmIHRpbWVTaW5jZUxhc3RJbnZva2UgPj0gbWF4V2FpdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZXJFeHBpcmVkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCk7XG4gICAgaWYgKHNob3VsZEludm9rZSh0aW1lKSkge1xuICAgICAgcmV0dXJuIHRyYWlsaW5nRWRnZSh0aW1lKTtcbiAgICB9XG4gICAgLy8gUmVzdGFydCB0aGUgdGltZXIuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCByZW1haW5pbmdXYWl0KHRpbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWlsaW5nRWRnZSh0aW1lKSB7XG4gICAgdGltZXJJZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIE9ubHkgaW52b2tlIGlmIHdlIGhhdmUgYGxhc3RBcmdzYCB3aGljaCBtZWFucyBgZnVuY2AgaGFzIGJlZW5cbiAgICAvLyBkZWJvdW5jZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBpZiAodHJhaWxpbmcgJiYgbGFzdEFyZ3MpIHtcbiAgICAgIHJldHVybiBpbnZva2VGdW5jKHRpbWUpO1xuICAgIH1cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGFuZCB3ZWFrIG1hcCBjb25zdHJ1Y3RvcnMsXG4gIC8vIGFuZCBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuIiwiLyoqXG4gKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2VcbiAqIHRoZSBVbml4IGVwb2NoICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBEYXRlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lc3RhbXAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZGVmZXIoZnVuY3Rpb24oc3RhbXApIHtcbiAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcbiAqIH0sIF8ubm93KCkpO1xuICogLy8gPT4gTG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgaW52b2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gbm93KCkge1xuICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBub3c7XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBOQU4gPSAwIC8gMDtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJhZCBzaWduZWQgaGV4YWRlY2ltYWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmFkSGV4ID0gL15bLStdMHhbMC05YS1mXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmluYXJ5ID0gL14wYlswMV0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb2N0YWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4vKiogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgd2l0aG91dCBhIGRlcGVuZGVuY3kgb24gYHJvb3RgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gaXNGdW5jdGlvbih2YWx1ZS52YWx1ZU9mKSA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHBhbmRvID0gJ3Nla3Rvci0nICsgRGF0ZS5ub3coKTtcbnZhciByc2libGluZ3MgPSAvWyt+XS87XG52YXIgZG9jdW1lbnQgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgZGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHt9O1xudmFyIG1hdGNoID0gKFxuICBkZWwubWF0Y2hlcyB8fFxuICBkZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm9NYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIG5ldmVyXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNla3Rvcjtcblxuc2VrdG9yLm1hdGNoZXMgPSBtYXRjaGVzO1xuc2VrdG9yLm1hdGNoZXNTZWxlY3RvciA9IG1hdGNoZXNTZWxlY3RvcjtcblxuZnVuY3Rpb24gcXNhIChzZWxlY3RvciwgY29udGV4dCkge1xuICB2YXIgZXhpc3RlZCwgaWQsIHByZWZpeCwgcHJlZml4ZWQsIGFkYXB0ZXIsIGhhY2sgPSBjb250ZXh0ICE9PSBkb2N1bWVudDtcbiAgaWYgKGhhY2spIHsgLy8gaWQgaGFjayBmb3IgY29udGV4dC1yb290ZWQgcXVlcmllc1xuICAgIGV4aXN0ZWQgPSBjb250ZXh0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICBpZCA9IGV4aXN0ZWQgfHwgZXhwYW5kbztcbiAgICBwcmVmaXggPSAnIycgKyBpZCArICcgJztcbiAgICBwcmVmaXhlZCA9IHByZWZpeCArIHNlbGVjdG9yLnJlcGxhY2UoLywvZywgJywnICsgcHJlZml4KTtcbiAgICBhZGFwdGVyID0gcnNpYmxpbmdzLnRlc3Qoc2VsZWN0b3IpICYmIGNvbnRleHQucGFyZW50Tm9kZTtcbiAgICBpZiAoIWV4aXN0ZWQpIHsgY29udGV4dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpOyB9XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gKGFkYXB0ZXIgfHwgY29udGV4dCkucXVlcnlTZWxlY3RvckFsbChwcmVmaXhlZCB8fCBzZWxlY3Rvcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGV4aXN0ZWQgPT09IG51bGwpIHsgY29udGV4dC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZWt0b3IgKHNlbGVjdG9yLCBjdHgsIGNvbGxlY3Rpb24sIHNlZWQpIHtcbiAgdmFyIGVsZW1lbnQ7XG4gIHZhciBjb250ZXh0ID0gY3R4IHx8IGRvY3VtZW50O1xuICB2YXIgcmVzdWx0cyA9IGNvbGxlY3Rpb24gfHwgW107XG4gIHZhciBpID0gMDtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBpZiAoY29udGV4dC5ub2RlVHlwZSAhPT0gMSAmJiBjb250ZXh0Lm5vZGVUeXBlICE9PSA5KSB7XG4gICAgcmV0dXJuIFtdOyAvLyBiYWlsIGlmIGNvbnRleHQgaXMgbm90IGFuIGVsZW1lbnQgb3IgZG9jdW1lbnRcbiAgfVxuICBpZiAoc2VlZCkge1xuICAgIHdoaWxlICgoZWxlbWVudCA9IHNlZWRbaSsrXSkpIHtcbiAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIHFzYShzZWxlY3RvciwgY29udGV4dCkpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzIChzZWxlY3RvciwgZWxlbWVudHMpIHtcbiAgcmV0dXJuIHNla3RvcihzZWxlY3RvciwgbnVsbCwgbnVsbCwgZWxlbWVudHMpO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IgKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gIHJldHVybiBtYXRjaC5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gbmV2ZXIgKCkgeyByZXR1cm4gZmFsc2U7IH1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbjtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgZ2V0U2VsZWN0aW9uUmF3ID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25SYXcnKTtcbnZhciBnZXRTZWxlY3Rpb25OdWxsT3AgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvbk51bGxPcCcpO1xudmFyIGdldFNlbGVjdGlvblN5bnRoZXRpYyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uU3ludGhldGljJyk7XG52YXIgaXNIb3N0ID0gcmVxdWlyZSgnLi9pc0hvc3QnKTtcbmlmIChpc0hvc3QubWV0aG9kKGdsb2JhbCwgJ2dldFNlbGVjdGlvbicpKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblJhdztcbn0gZWxzZSBpZiAodHlwZW9mIGRvYy5zZWxlY3Rpb24gPT09ICdvYmplY3QnICYmIGRvYy5zZWxlY3Rpb24pIHtcbiAgZ2V0U2VsZWN0aW9uID0gZ2V0U2VsZWN0aW9uU3ludGhldGljO1xufSBlbHNlIHtcbiAgZ2V0U2VsZWN0aW9uID0gZ2V0U2VsZWN0aW9uTnVsbE9wO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFNlbGVjdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbm9vcCAoKSB7fVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25OdWxsT3AgKCkge1xuICByZXR1cm4ge1xuICAgIHJlbW92ZUFsbFJhbmdlczogbm9vcCxcbiAgICBhZGRSYW5nZTogbm9vcFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFNlbGVjdGlvbk51bGxPcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uUmF3ICgpIHtcbiAgcmV0dXJuIGdsb2JhbC5nZXRTZWxlY3Rpb24oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb25SYXc7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByYW5nZVRvVGV4dFJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZVRvVGV4dFJhbmdlJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGJvZHkgPSBkb2MuYm9keTtcbnZhciBHZXRTZWxlY3Rpb25Qcm90byA9IEdldFNlbGVjdGlvbi5wcm90b3R5cGU7XG5cbmZ1bmN0aW9uIEdldFNlbGVjdGlvbiAoc2VsZWN0aW9uKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG5cbiAgdGhpcy5fc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xuICB0aGlzLl9yYW5nZXMgPSBbXTtcblxuICBpZiAoc2VsZWN0aW9uLnR5cGUgPT09ICdDb250cm9sJykge1xuICAgIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsZik7XG4gIH0gZWxzZSBpZiAoaXNUZXh0UmFuZ2UocmFuZ2UpKSB7XG4gICAgdXBkYXRlRnJvbVRleHRSYW5nZShzZWxmLCByYW5nZSk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlRW1wdHlTZWxlY3Rpb24oc2VsZik7XG4gIH1cbn1cblxuR2V0U2VsZWN0aW9uUHJvdG8ucmVtb3ZlQWxsUmFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGV4dFJhbmdlO1xuICB0cnkge1xuICAgIHRoaXMuX3NlbGVjdGlvbi5lbXB0eSgpO1xuICAgIGlmICh0aGlzLl9zZWxlY3Rpb24udHlwZSAhPT0gJ05vbmUnKSB7XG4gICAgICB0ZXh0UmFuZ2UgPSBib2R5LmNyZWF0ZVRleHRSYW5nZSgpO1xuICAgICAgdGV4dFJhbmdlLnNlbGVjdCgpO1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgdXBkYXRlRW1wdHlTZWxlY3Rpb24odGhpcyk7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5hZGRSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgPT09ICdDb250cm9sJykge1xuICAgIGFkZFJhbmdlVG9Db250cm9sU2VsZWN0aW9uKHRoaXMsIHJhbmdlKTtcbiAgfSBlbHNlIHtcbiAgICByYW5nZVRvVGV4dFJhbmdlKHJhbmdlKS5zZWxlY3QoKTtcbiAgICB0aGlzLl9yYW5nZXNbMF0gPSByYW5nZTtcbiAgICB0aGlzLnJhbmdlQ291bnQgPSAxO1xuICAgIHRoaXMuaXNDb2xsYXBzZWQgPSB0aGlzLl9yYW5nZXNbMF0uY29sbGFwc2VkO1xuICAgIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHRoaXMsIHJhbmdlLCBmYWxzZSk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLnNldFJhbmdlcyA9IGZ1bmN0aW9uIChyYW5nZXMpIHtcbiAgdGhpcy5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgdmFyIHJhbmdlQ291bnQgPSByYW5nZXMubGVuZ3RoO1xuICBpZiAocmFuZ2VDb3VudCA+IDEpIHtcbiAgICBjcmVhdGVDb250cm9sU2VsZWN0aW9uKHRoaXMsIHJhbmdlcyk7XG4gIH0gZWxzZSBpZiAocmFuZ2VDb3VudCkge1xuICAgIHRoaXMuYWRkUmFuZ2UocmFuZ2VzWzBdKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZ2V0UmFuZ2VBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMucmFuZ2VDb3VudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignZ2V0UmFuZ2VBdCgpOiBpbmRleCBvdXQgb2YgYm91bmRzJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhbmdlc1tpbmRleF0uY2xvbmVSYW5nZSgpO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5yZW1vdmVSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgIT09ICdDb250cm9sJykge1xuICAgIHJlbW92ZVJhbmdlTWFudWFsbHkodGhpcywgcmFuZ2UpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgY29udHJvbFJhbmdlID0gdGhpcy5fc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciByYW5nZUVsZW1lbnQgPSBnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKHJhbmdlKTtcbiAgdmFyIG5ld0NvbnRyb2xSYW5nZSA9IGJvZHkuY3JlYXRlQ29udHJvbFJhbmdlKCk7XG4gIHZhciBlbDtcbiAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGVsID0gY29udHJvbFJhbmdlLml0ZW0oaSk7XG4gICAgaWYgKGVsICE9PSByYW5nZUVsZW1lbnQgfHwgcmVtb3ZlZCkge1xuICAgICAgbmV3Q29udHJvbFJhbmdlLmFkZChjb250cm9sUmFuZ2UuaXRlbShpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBuZXdDb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24odGhpcyk7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5lYWNoUmFuZ2UgPSBmdW5jdGlvbiAoZm4sIHJldHVyblZhbHVlKSB7XG4gIHZhciBpID0gMDtcbiAgdmFyIGxlbiA9IHRoaXMuX3Jhbmdlcy5sZW5ndGg7XG4gIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChmbih0aGlzLmdldFJhbmdlQXQoaSkpKSB7XG4gICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gICAgfVxuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5nZXRBbGxSYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByYW5nZXMgPSBbXTtcbiAgdGhpcy5lYWNoUmFuZ2UoZnVuY3Rpb24gKHJhbmdlKSB7XG4gICAgcmFuZ2VzLnB1c2gocmFuZ2UpO1xuICB9KTtcbiAgcmV0dXJuIHJhbmdlcztcbn07XG5cbkdldFNlbGVjdGlvblByb3RvLnNldFNpbmdsZVJhbmdlID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIHRoaXMucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHRoaXMuYWRkUmFuZ2UocmFuZ2UpO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlQ29udHJvbFNlbGVjdGlvbiAoc2VsLCByYW5nZXMpIHtcbiAgdmFyIGNvbnRyb2xSYW5nZSA9IGJvZHkuY3JlYXRlQ29udHJvbFJhbmdlKCk7XG4gIGZvciAodmFyIGkgPSAwLCBlbCwgbGVuID0gcmFuZ2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgZWwgPSBnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKHJhbmdlc1tpXSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnRyb2xSYW5nZS5hZGQoZWwpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignc2V0UmFuZ2VzKCk6IEVsZW1lbnQgY291bGQgbm90IGJlIGFkZGVkIHRvIGNvbnRyb2wgc2VsZWN0aW9uJyk7XG4gICAgfVxuICB9XG4gIGNvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWwpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSYW5nZU1hbnVhbGx5IChzZWwsIHJhbmdlKSB7XG4gIHZhciByYW5nZXMgPSBzZWwuZ2V0QWxsUmFuZ2VzKCk7XG4gIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHJhbmdlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICghaXNTYW1lUmFuZ2UocmFuZ2UsIHJhbmdlc1tpXSkpIHtcbiAgICAgIHNlbC5hZGRSYW5nZShyYW5nZXNbaV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbC5yYW5nZUNvdW50KSB7XG4gICAgdXBkYXRlRW1wdHlTZWxlY3Rpb24oc2VsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZSAoc2VsLCByYW5nZSkge1xuICB2YXIgYW5jaG9yUHJlZml4ID0gJ3N0YXJ0JztcbiAgdmFyIGZvY3VzUHJlZml4ID0gJ2VuZCc7XG4gIHNlbC5hbmNob3JOb2RlID0gcmFuZ2VbYW5jaG9yUHJlZml4ICsgJ0NvbnRhaW5lciddO1xuICBzZWwuYW5jaG9yT2Zmc2V0ID0gcmFuZ2VbYW5jaG9yUHJlZml4ICsgJ09mZnNldCddO1xuICBzZWwuZm9jdXNOb2RlID0gcmFuZ2VbZm9jdXNQcmVmaXggKyAnQ29udGFpbmVyJ107XG4gIHNlbC5mb2N1c09mZnNldCA9IHJhbmdlW2ZvY3VzUHJlZml4ICsgJ09mZnNldCddO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVFbXB0eVNlbGVjdGlvbiAoc2VsKSB7XG4gIHNlbC5hbmNob3JOb2RlID0gc2VsLmZvY3VzTm9kZSA9IG51bGw7XG4gIHNlbC5hbmNob3JPZmZzZXQgPSBzZWwuZm9jdXNPZmZzZXQgPSAwO1xuICBzZWwucmFuZ2VDb3VudCA9IDA7XG4gIHNlbC5pc0NvbGxhcHNlZCA9IHRydWU7XG4gIHNlbC5fcmFuZ2VzLmxlbmd0aCA9IDA7XG59XG5cbmZ1bmN0aW9uIHJhbmdlQ29udGFpbnNTaW5nbGVFbGVtZW50IChyYW5nZU5vZGVzKSB7XG4gIGlmICghcmFuZ2VOb2Rlcy5sZW5ndGggfHwgcmFuZ2VOb2Rlc1swXS5ub2RlVHlwZSAhPT0gMSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKHZhciBpID0gMSwgbGVuID0gcmFuZ2VOb2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICghaXNBbmNlc3Rvck9mKHJhbmdlTm9kZXNbMF0sIHJhbmdlTm9kZXNbaV0pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlIChyYW5nZSkge1xuICB2YXIgbm9kZXMgPSByYW5nZS5nZXROb2RlcygpO1xuICBpZiAoIXJhbmdlQ29udGFpbnNTaW5nbGVFbGVtZW50KG5vZGVzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZSgpOiByYW5nZSBkaWQgbm90IGNvbnNpc3Qgb2YgYSBzaW5nbGUgZWxlbWVudCcpO1xuICB9XG4gIHJldHVybiBub2Rlc1swXTtcbn1cblxuZnVuY3Rpb24gaXNUZXh0UmFuZ2UgKHJhbmdlKSB7XG4gIHJldHVybiByYW5nZSAmJiByYW5nZS50ZXh0ICE9PSB2b2lkIDA7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUZyb21UZXh0UmFuZ2UgKHNlbCwgcmFuZ2UpIHtcbiAgc2VsLl9yYW5nZXMgPSBbcmFuZ2VdO1xuICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZShzZWwsIHJhbmdlLCBmYWxzZSk7XG4gIHNlbC5yYW5nZUNvdW50ID0gMTtcbiAgc2VsLmlzQ29sbGFwc2VkID0gcmFuZ2UuY29sbGFwc2VkO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDb250cm9sU2VsZWN0aW9uIChzZWwpIHtcbiAgc2VsLl9yYW5nZXMubGVuZ3RoID0gMDtcbiAgaWYgKHNlbC5fc2VsZWN0aW9uLnR5cGUgPT09ICdOb25lJykge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbCk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGNvbnRyb2xSYW5nZSA9IHNlbC5fc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gICAgaWYgKGlzVGV4dFJhbmdlKGNvbnRyb2xSYW5nZSkpIHtcbiAgICAgIHVwZGF0ZUZyb21UZXh0UmFuZ2Uoc2VsLCBjb250cm9sUmFuZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWwucmFuZ2VDb3VudCA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7XG4gICAgICB2YXIgcmFuZ2U7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbC5yYW5nZUNvdW50OyArK2kpIHtcbiAgICAgICAgcmFuZ2UgPSBkb2MuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShjb250cm9sUmFuZ2UuaXRlbShpKSk7XG4gICAgICAgIHNlbC5fcmFuZ2VzLnB1c2gocmFuZ2UpO1xuICAgICAgfVxuICAgICAgc2VsLmlzQ29sbGFwc2VkID0gc2VsLnJhbmdlQ291bnQgPT09IDEgJiYgc2VsLl9yYW5nZXNbMF0uY29sbGFwc2VkO1xuICAgICAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2Uoc2VsLCBzZWwuX3Jhbmdlc1tzZWwucmFuZ2VDb3VudCAtIDFdLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFkZFJhbmdlVG9Db250cm9sU2VsZWN0aW9uIChzZWwsIHJhbmdlKSB7XG4gIHZhciBjb250cm9sUmFuZ2UgPSBzZWwuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgcmFuZ2VFbGVtZW50ID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZSk7XG4gIHZhciBuZXdDb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29udHJvbFJhbmdlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgbmV3Q29udHJvbFJhbmdlLmFkZChjb250cm9sUmFuZ2UuaXRlbShpKSk7XG4gIH1cbiAgdHJ5IHtcbiAgICBuZXdDb250cm9sUmFuZ2UuYWRkKHJhbmdlRWxlbWVudCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZFJhbmdlKCk6IEVsZW1lbnQgY291bGQgbm90IGJlIGFkZGVkIHRvIGNvbnRyb2wgc2VsZWN0aW9uJyk7XG4gIH1cbiAgbmV3Q29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbCk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZVJhbmdlIChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gKFxuICAgIGxlZnQuc3RhcnRDb250YWluZXIgPT09IHJpZ2h0LnN0YXJ0Q29udGFpbmVyICYmXG4gICAgbGVmdC5zdGFydE9mZnNldCA9PT0gcmlnaHQuc3RhcnRPZmZzZXQgJiZcbiAgICBsZWZ0LmVuZENvbnRhaW5lciA9PT0gcmlnaHQuZW5kQ29udGFpbmVyICYmXG4gICAgbGVmdC5lbmRPZmZzZXQgPT09IHJpZ2h0LmVuZE9mZnNldFxuICApO1xufVxuXG5mdW5jdGlvbiBpc0FuY2VzdG9yT2YgKGFuY2VzdG9yLCBkZXNjZW5kYW50KSB7XG4gIHZhciBub2RlID0gZGVzY2VuZGFudDtcbiAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUgPT09IGFuY2VzdG9yKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgR2V0U2VsZWN0aW9uKGdsb2JhbC5kb2N1bWVudC5zZWxlY3Rpb24pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFNlbGVjdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaXNIb3N0TWV0aG9kIChob3N0LCBwcm9wKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGhvc3RbcHJvcF07XG4gIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8ICEhKHR5cGUgPT09ICdvYmplY3QnICYmIGhvc3RbcHJvcF0pIHx8IHR5cGUgPT09ICd1bmtub3duJztcbn1cblxuZnVuY3Rpb24gaXNIb3N0UHJvcGVydHkgKGhvc3QsIHByb3ApIHtcbiAgcmV0dXJuIHR5cGVvZiBob3N0W3Byb3BdICE9PSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gbWFueSAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFyZUhvc3RlZCAoaG9zdCwgcHJvcHMpIHtcbiAgICB2YXIgaSA9IHByb3BzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZiAoIWZuKGhvc3QsIHByb3BzW2ldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0aG9kOiBpc0hvc3RNZXRob2QsXG4gIG1ldGhvZHM6IG1hbnkoaXNIb3N0TWV0aG9kKSxcbiAgcHJvcGVydHk6IGlzSG9zdFByb3BlcnR5LFxuICBwcm9wZXJ0aWVzOiBtYW55KGlzSG9zdFByb3BlcnR5KVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG5cbmZ1bmN0aW9uIHJhbmdlVG9UZXh0UmFuZ2UgKHApIHtcbiAgaWYgKHAuY29sbGFwc2VkKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB9XG4gIHZhciBzdGFydFJhbmdlID0gY3JlYXRlQm91bmRhcnlUZXh0UmFuZ2UoeyBub2RlOiBwLnN0YXJ0Q29udGFpbmVyLCBvZmZzZXQ6IHAuc3RhcnRPZmZzZXQgfSwgdHJ1ZSk7XG4gIHZhciBlbmRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5lbmRDb250YWluZXIsIG9mZnNldDogcC5lbmRPZmZzZXQgfSwgZmFsc2UpO1xuICB2YXIgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgdGV4dFJhbmdlLnNldEVuZFBvaW50KCdTdGFydFRvU3RhcnQnLCBzdGFydFJhbmdlKTtcbiAgdGV4dFJhbmdlLnNldEVuZFBvaW50KCdFbmRUb0VuZCcsIGVuZFJhbmdlKTtcbiAgcmV0dXJuIHRleHRSYW5nZTtcbn1cblxuZnVuY3Rpb24gaXNDaGFyYWN0ZXJEYXRhTm9kZSAobm9kZSkge1xuICB2YXIgdCA9IG5vZGUubm9kZVR5cGU7XG4gIHJldHVybiB0ID09PSAzIHx8IHQgPT09IDQgfHwgdCA9PT0gOCA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlIChwLCBzdGFydGluZykge1xuICB2YXIgYm91bmQ7XG4gIHZhciBwYXJlbnQ7XG4gIHZhciBvZmZzZXQgPSBwLm9mZnNldDtcbiAgdmFyIHdvcmtpbmdOb2RlO1xuICB2YXIgY2hpbGROb2RlcztcbiAgdmFyIHJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgdmFyIGRhdGEgPSBpc0NoYXJhY3RlckRhdGFOb2RlKHAubm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICBib3VuZCA9IHAubm9kZTtcbiAgICBwYXJlbnQgPSBib3VuZC5wYXJlbnROb2RlO1xuICB9IGVsc2Uge1xuICAgIGNoaWxkTm9kZXMgPSBwLm5vZGUuY2hpbGROb2RlcztcbiAgICBib3VuZCA9IG9mZnNldCA8IGNoaWxkTm9kZXMubGVuZ3RoID8gY2hpbGROb2Rlc1tvZmZzZXRdIDogbnVsbDtcbiAgICBwYXJlbnQgPSBwLm5vZGU7XG4gIH1cblxuICB3b3JraW5nTm9kZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIHdvcmtpbmdOb2RlLmlubmVySFRNTCA9ICcmI2ZlZmY7JztcblxuICBpZiAoYm91bmQpIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHdvcmtpbmdOb2RlLCBib3VuZCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHdvcmtpbmdOb2RlKTtcbiAgfVxuXG4gIHJhbmdlLm1vdmVUb0VsZW1lbnRUZXh0KHdvcmtpbmdOb2RlKTtcbiAgcmFuZ2UuY29sbGFwc2UoIXN0YXJ0aW5nKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHdvcmtpbmdOb2RlKTtcblxuICBpZiAoZGF0YSkge1xuICAgIHJhbmdlW3N0YXJ0aW5nID8gJ21vdmVTdGFydCcgOiAnbW92ZUVuZCddKCdjaGFyYWN0ZXInLCBvZmZzZXQpO1xuICB9XG4gIHJldHVybiByYW5nZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5nZVRvVGV4dFJhbmdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb24nKTtcbnZhciBzZXRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL3NldFNlbGVjdGlvbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0OiBnZXRTZWxlY3Rpb24sXG4gIHNldDogc2V0U2VsZWN0aW9uXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb24nKTtcbnZhciByYW5nZVRvVGV4dFJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZVRvVGV4dFJhbmdlJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuXG5mdW5jdGlvbiBzZXRTZWxlY3Rpb24gKHApIHtcbiAgaWYgKGRvYy5jcmVhdGVSYW5nZSkge1xuICAgIG1vZGVyblNlbGVjdGlvbigpO1xuICB9IGVsc2Uge1xuICAgIG9sZFNlbGVjdGlvbigpO1xuICB9XG5cbiAgZnVuY3Rpb24gbW9kZXJuU2VsZWN0aW9uICgpIHtcbiAgICB2YXIgc2VsID0gZ2V0U2VsZWN0aW9uKCk7XG4gICAgdmFyIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgaWYgKCFwLnN0YXJ0Q29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwLmVuZENvbnRhaW5lcikge1xuICAgICAgcmFuZ2Uuc2V0RW5kKHAuZW5kQ29udGFpbmVyLCBwLmVuZE9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlLnNldEVuZChwLnN0YXJ0Q29udGFpbmVyLCBwLnN0YXJ0T2Zmc2V0KTtcbiAgICB9XG4gICAgcmFuZ2Uuc2V0U3RhcnQocC5zdGFydENvbnRhaW5lciwgcC5zdGFydE9mZnNldCk7XG4gICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbGRTZWxlY3Rpb24gKCkge1xuICAgIHJhbmdlVG9UZXh0UmFuZ2UocCkuc2VsZWN0KCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXQgPSBlYXN5R2V0O1xudmFyIHNldCA9IGVhc3lTZXQ7XG5cbmlmIChkb2N1bWVudC5zZWxlY3Rpb24gJiYgZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKSB7XG4gIGdldCA9IGhhcmRHZXQ7XG4gIHNldCA9IGhhcmRTZXQ7XG59XG5cbmZ1bmN0aW9uIGVhc3lHZXQgKGVsKSB7XG4gIHJldHVybiB7XG4gICAgc3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LFxuICAgIGVuZDogZWwuc2VsZWN0aW9uRW5kXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhcmRHZXQgKGVsKSB7XG4gIHZhciBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlICE9PSBlbCkge1xuICAgIGVsLmZvY3VzKCk7XG4gIH1cblxuICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIGJvb2ttYXJrID0gcmFuZ2UuZ2V0Qm9va21hcmsoKTtcbiAgdmFyIG9yaWdpbmFsID0gZWwudmFsdWU7XG4gIHZhciBtYXJrZXIgPSBnZXRVbmlxdWVNYXJrZXIob3JpZ2luYWwpO1xuICB2YXIgcGFyZW50ID0gcmFuZ2UucGFyZW50RWxlbWVudCgpO1xuICBpZiAocGFyZW50ID09PSBudWxsIHx8ICFpbnB1dHMocGFyZW50KSkge1xuICAgIHJldHVybiByZXN1bHQoMCwgMCk7XG4gIH1cbiAgcmFuZ2UudGV4dCA9IG1hcmtlciArIHJhbmdlLnRleHQgKyBtYXJrZXI7XG5cbiAgdmFyIGNvbnRlbnRzID0gZWwudmFsdWU7XG5cbiAgZWwudmFsdWUgPSBvcmlnaW5hbDtcbiAgcmFuZ2UubW92ZVRvQm9va21hcmsoYm9va21hcmspO1xuICByYW5nZS5zZWxlY3QoKTtcblxuICByZXR1cm4gcmVzdWx0KGNvbnRlbnRzLmluZGV4T2YobWFya2VyKSwgY29udGVudHMubGFzdEluZGV4T2YobWFya2VyKSAtIG1hcmtlci5sZW5ndGgpO1xuXG4gIGZ1bmN0aW9uIHJlc3VsdCAoc3RhcnQsIGVuZCkge1xuICAgIGlmIChhY3RpdmUgIT09IGVsKSB7IC8vIGRvbid0IGRpc3J1cHQgcHJlLWV4aXN0aW5nIHN0YXRlXG4gICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgIGFjdGl2ZS5mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuYmx1cigpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBzdGFydDogc3RhcnQsIGVuZDogZW5kIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VW5pcXVlTWFya2VyIChjb250ZW50cykge1xuICB2YXIgbWFya2VyO1xuICBkbyB7XG4gICAgbWFya2VyID0gJ0BAbWFya2VyLicgKyBNYXRoLnJhbmRvbSgpICogbmV3IERhdGUoKTtcbiAgfSB3aGlsZSAoY29udGVudHMuaW5kZXhPZihtYXJrZXIpICE9PSAtMSk7XG4gIHJldHVybiBtYXJrZXI7XG59XG5cbmZ1bmN0aW9uIGlucHV0cyAoZWwpIHtcbiAgcmV0dXJuICgoZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyAmJiBlbC50eXBlID09PSAndGV4dCcpIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQScpO1xufVxuXG5mdW5jdGlvbiBlYXN5U2V0IChlbCwgcCkge1xuICBlbC5zZWxlY3Rpb25TdGFydCA9IHBhcnNlKGVsLCBwLnN0YXJ0KTtcbiAgZWwuc2VsZWN0aW9uRW5kID0gcGFyc2UoZWwsIHAuZW5kKTtcbn1cblxuZnVuY3Rpb24gaGFyZFNldCAoZWwsIHApIHtcbiAgdmFyIHJhbmdlID0gZWwuY3JlYXRlVGV4dFJhbmdlKCk7XG5cbiAgaWYgKHAuc3RhcnQgPT09ICdlbmQnICYmIHAuZW5kID09PSAnZW5kJykge1xuICAgIHJhbmdlLmNvbGxhcHNlKGZhbHNlKTtcbiAgICByYW5nZS5zZWxlY3QoKTtcbiAgfSBlbHNlIHtcbiAgICByYW5nZS5jb2xsYXBzZSh0cnVlKTtcbiAgICByYW5nZS5tb3ZlRW5kKCdjaGFyYWN0ZXInLCBwYXJzZShlbCwgcC5lbmQpKTtcbiAgICByYW5nZS5tb3ZlU3RhcnQoJ2NoYXJhY3RlcicsIHBhcnNlKGVsLCBwLnN0YXJ0KSk7XG4gICAgcmFuZ2Uuc2VsZWN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2UgKGVsLCB2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09ICdlbmQnID8gZWwudmFsdWUubGVuZ3RoIDogdmFsdWUgfHwgMDtcbn1cblxuZnVuY3Rpb24gc2VsbCAoZWwsIHApIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBzZXQoZWwsIHApO1xuICB9XG4gIHJldHVybiBnZXQoZWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNlbGw7XG4iLCJ2YXIgc2kgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nLCB0aWNrO1xuaWYgKHNpKSB7XG4gIHRpY2sgPSBmdW5jdGlvbiAoZm4pIHsgc2V0SW1tZWRpYXRlKGZuKTsgfTtcbn0gZWxzZSB7XG4gIHRpY2sgPSBmdW5jdGlvbiAoZm4pIHsgc2V0VGltZW91dChmbiwgMCk7IH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGljazsiXX0=
