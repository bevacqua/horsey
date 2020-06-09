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
