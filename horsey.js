'use strict';

import sum from 'hash-sum';
import sell from 'sell';
import sektor from 'sektor';
import emitter from 'contra/emitter';
import bullseye from 'bullseye';
import crossvent from 'crossvent';
import fuzzysearch from 'fuzzysearch';
import debounce from 'lodash/debounce';
const KEY_BACKSPACE = 8;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_TAB = 9;
const doc = document;
const docElement = doc.documentElement;

function horsey (el, options = {}) {
  const {
    setAppends,
    set,
    filter,
    source,
    cache = {},
    predictNextSearch,
    renderItem,
    renderCategory,
    blankSearch,
    appendTo,
    anchor,
    debounce
  } = options;
  const caching = options.cache !== false;
  if (!source) {
    return;
  }

  const userGetText = options.getText;
  const userGetValue = options.getValue;
  const getText = (
    typeof userGetText === 'string' ? d => d[userGetText] :
    typeof userGetText === 'function' ? userGetText :
    d => d.toString()
  );
  const getValue = (
    typeof userGetValue === 'string' ? d => d[userGetValue] :
    typeof userGetValue === 'function' ? userGetValue :
    d => d
  );

  let previousSuggestions = [];
  let previousSelection = null;
  const limit = Number(options.limit) || Infinity;
  const completer = autocomplete(el, {
    source: sourceFunction,
    limit,
    getText,
    getValue,
    setAppends,
    predictNextSearch,
    renderItem,
    renderCategory,
    appendTo,
    anchor,
    noMatches,
    noMatchesText: options.noMatches,
    blankSearch,
    debounce,
    set (s) {
      if (setAppends !== true) {
        el.value = '';
      }
      previousSelection = s;
      (set || completer.defaultSetter)(getText(s), s);
      completer.emit('afterSet');
    },
    filter
  });
  return completer;
  function noMatches (data) {
    if (!options.noMatches) {
      return false;
    }
    return data.query.length;
  }
  function sourceFunction (data, done) {
    const {query, limit} = data;
    if (!options.blankSearch && query.length === 0) {
      done(null, [], true); return;
    }
    if (completer) {
      completer.emit('beforeUpdate');
    }
    const hash = sum(query); // fast, case insensitive, prevents collisions
    if (caching) {
      const entry = cache[hash];
      if (entry) {
        const start = entry.created.getTime();
        const duration = cache.duration || 60 * 60 * 24;
        const diff = duration * 1000;
        const fresh = new Date(start + diff) > new Date();
        if (fresh) {
          done(null, entry.items.slice()); return;
        }
      }
    }
    var sourceData = {
      previousSuggestions: previousSuggestions.slice(),
      previousSelection,
      input: query,
      renderItem,
      renderCategory,
      limit
    };
    if (typeof options.source === 'function') {
      options.source(sourceData, sourced);
    } else {
      sourced(null, options.source);
    }
    function sourced (err, result) {
      if (err) {
        console.log('Autocomplete source error.', err, el);
        done(err, []);
      }
      const items = Array.isArray(result) ? result : [];
      if (caching) {
        cache[hash] = { created: new Date(), items };
      }
      previousSuggestions = items;
      done(null, items.slice());
    }
  }
}

function autocomplete (el, options = {}) {
  const o = options;
  const parent = o.appendTo || doc.body;
  const {
    getText,
    getValue,
    form,
    source,
    noMatches,
    noMatchesText,
    highlighter = true,
    highlightCompleteWords = true,
    renderItem = defaultItemRenderer,
    renderCategory = defaultCategoryRenderer,
    setAppends
  } = o;
  const limit = typeof o.limit === 'number' ? o.limit : Infinity;
  const userFilter = o.filter || defaultFilter;
  const userSet = o.set || defaultSetter;
  const categories = tag('div', 'sey-categories');
  const container = tag('div', 'sey-container');
  const deferredFiltering = defer(filtering);
  const state = { counter: 0, query: null };
  let categoryMap = Object.create(null);
  let selection = null;
  let eye;
  let attachment = el;
  let noneMatch;
  let textInput;
  let anyInput;
  let ranchorleft;
  let ranchorright;
  let lastPrefix = '';
  const debounceTime = o.debounce || 300;
  const debouncedLoading = debounce(loading, debounceTime);

  if (o.autoHideOnBlur === void 0) { o.autoHideOnBlur = true; }
  if (o.autoHideOnClick === void 0) { o.autoHideOnClick = true; }
  if (o.autoShowOnUpDown === void 0) { o.autoShowOnUpDown = el.tagName === 'INPUT'; }
  if (o.anchor) {
    ranchorleft = new RegExp('^' + o.anchor);
    ranchorright = new RegExp(o.anchor + '$');
  }

  let hasItems = false;
  const api = emitter({
    anchor: o.anchor,
    clear,
    show,
    hide,
    toggle,
    destroy,
    refreshPosition,
    appendText,
    appendHTML,
    filterAnchoredText,
    filterAnchoredHTML,
    defaultAppendText: appendText,
    defaultFilter,
    defaultItemRenderer,
    defaultCategoryRenderer,
    defaultSetter,
    retarget,
    attachment,
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

  function retarget (el) {
    inputEvents(true);
    attachment = api.attachment = el;
    textInput = attachment.tagName === 'INPUT' || attachment.tagName === 'TEXTAREA';
    anyInput = textInput || isEditable(attachment);
    inputEvents();
  }

  function refreshPosition () {
    if (eye) { eye.refresh(); }
  }

  function loading (forceShow) {
    if (typeof source !== 'function') {
      return;
    }
    crossvent.remove(attachment, 'focus', loading);
    const query = readInput();
    if (query === state.query) {
      return;
    }
    hasItems = false;
    state.query = query;

    const counter = ++state.counter;

    source({ query, limit }, sourced);

    function sourced (err, result, blankQuery) {
      if (state.counter !== counter) {
        return;
      }
      loaded(result, forceShow);
      if (err || blankQuery) {
        hasItems = false;
      }
    }
  }

  function loaded (categories, forceShow) {
    clear();
    hasItems = true;
    api.source = [];
    categories.forEach(cat => cat.list.forEach(suggestion => add(suggestion, cat)));
    if (forceShow) {
      show();
    }
    filtering();
  }

  function clear () {
    unselect();
    while (categories.lastChild) {
      categories.removeChild(categories.lastChild);
    }
    categoryMap = Object.create(null);
    hasItems = false;
  }

  function readInput () {
    return (textInput ? el.value : el.innerHTML).trim();
  }

  function getCategory (data) {
    if (!data.id) {
      data.id = 'default';
    }
    if (!categoryMap[data.id]) {
      categoryMap[data.id] = createCategory();
    }
    return categoryMap[data.id];
    function createCategory () {
      const category = tag('div', 'sey-category');
      const ul = tag('ul', 'sey-list');
      renderCategory(category, data);
      category.appendChild(ul);
      categories.appendChild(category);
      return { data, ul };
    }
  }

  function add (suggestion, categoryData) {
    const cat = getCategory(categoryData);
    const li = tag('li', 'sey-item');
    renderItem(li, suggestion);
    if (highlighter) {
      breakupForHighlighter(li);
    }
    crossvent.add(li, 'mouseenter', hoverSuggestion);
    crossvent.add(li, 'click', clickedSuggestion);
    crossvent.add(li, 'horsey-filter', filterItem);
    crossvent.add(li, 'horsey-hide', hideItem);
    cat.ul.appendChild(li);
    api.source.push(suggestion);
    return li;

    function hoverSuggestion () {
      select(li);
    }

    function clickedSuggestion () {
      const input = getText(suggestion);
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

    function filterItem () {
      const value = readInput();
      if (filter(value, suggestion)) {
        li.className = li.className.replace(/ sey-hide/g, '');
      } else {
        crossvent.fabricate(li, 'horsey-hide');
      }
    }

    function hideItem () {
      if (!hidden(li)) {
        li.className += ' sey-hide';
        if (selection === li) {
          unselect();
        }
      }
    }
  }

  function breakupForHighlighter (el) {
    getTextChildren(el).forEach(el => {
      const parent = el.parentElement;
      const text = el.textContent || el.nodeValue || '';
      if (text.length === 0) {
        return;
      }
      for (let char of text) {
        parent.insertBefore(spanFor(char), el);
      }
      parent.removeChild(el);
      function spanFor (char) {
        const span = doc.createElement('span');
        span.className = 'sey-char';
        span.textContent = span.innerText = char;
        return span;
      }
    });
  }

  function highlight (el, needle) {
    const rword = /[\s,._\[\]{}()-]/g;
    const words = needle.split(rword).filter(w => w.length);
    const elems = [...el.querySelectorAll('.sey-char')];
    let chars;
    let startIndex = 0;

    balance();
    if (highlightCompleteWords) {
      whole();
    }
    fuzzy();
    clearRemainder();

    function balance () {
      chars = elems.map(el => el.innerText || el.textContent);
    }

    function whole () {
      for (let word of words) {
        let tempIndex = startIndex;
        retry: while (tempIndex !== -1) {
          let init = true;
          let prevIndex = tempIndex;
          for (let char of word) {
            const i = chars.indexOf(char, prevIndex + 1);
            const fail = i === -1 || (!init && prevIndex + 1 !== i);
            if (init) {
              init = false;
              tempIndex = i;
            }
            if (fail) {
              continue retry;
            }
            prevIndex = i;
          }
          for (let el of elems.splice(tempIndex, 1 + prevIndex - tempIndex)) {
            on(el);
          }
          balance();
          needle = needle.replace(word, '');
          break;
        }
      }
    }

    function fuzzy () {
      for (let input of needle) {
        while (elems.length) {
          let el = elems.shift();
          if ((el.innerText || el.textContent) === input) {
            on(el);
            break;
          } else {
            off(el);
          }
        }
      }
    }

    function clearRemainder () {
      while (elems.length) {
        off(elems.shift());
      }
    }

    function on (ch) {
      ch.classList.add('sey-char-highlight');
    }
    function off (ch) {
      ch.classList.remove('sey-char-highlight');
    }
  }

  function getTextChildren (el) {
    const texts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      texts.push(node);
    }
    return texts;
  }

  function set (value) {
    if (o.anchor) {
      return (isText() ? api.appendText : api.appendHTML)(getValue(value));
    }
    userSet(value);
  }

  function filter (value, suggestion) {
    if (o.anchor) {
      const il = (isText() ? api.filterAnchoredText : api.filterAnchoredHTML)(value, suggestion);
      return il ? userFilter(il.input, il.suggestion) : false;
    }
    return userFilter(value, suggestion);
  }

  function isText () { return isInput(attachment); }
  function visible () { return container.className.indexOf('sey-show') !== -1; }
  function hidden (li) { return li.className.indexOf('sey-hide') !== -1; }

  function show () {
    eye.refresh();
    if (!visible()) {
      container.className += ' sey-show';
      crossvent.fabricate(attachment, 'horsey-show');
    }
  }

  function toggler (e) {
    const left = e.which === 1 && !e.metaKey && !e.ctrlKey;
    if (left === false) {
      return; // we only care about honest to god left-clicks
    }
    toggle();
  }

  function toggle () {
    if (!visible()) {
      show();
    } else {
      hide();
    }
  }

  function select (li) {
    unselect();
    if (li) {
      selection = li;
      selection.className += ' sey-selected';
    }
  }

  function unselect () {
    if (selection) {
      selection.className = selection.className.replace(/ sey-selected/g, '');
      selection = null;
    }
  }

  function move (up, moves) {
    const total = api.source.length;
    if (total === 0) {
      return;
    }
    if (moves > total) {
      unselect();
      return;
    }
    const cat = findCategory(selection) || categories.firstChild;
    const first = up ? 'lastChild' : 'firstChild';
    const last = up ? 'firstChild' : 'lastChild';
    const next = up ? 'previousSibling' : 'nextSibling';
    const prev = up ? 'nextSibling' : 'previousSibling';
    const li = findNext();
    select(li);

    if (hidden(li)) {
      move(up, moves ? moves + 1 : 1);
    }

    function findCategory (el) {
      while (el) {
        if (sektor.matchesSelector(el.parentElement, '.sey-category')) {
          return el.parentElement;
        }
        el = el.parentElement;
      }
      return null;
    }

    function findNext () {
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

  function hide () {
    eye.sleep();
    container.className = container.className.replace(/ sey-show/g, '');
    unselect();
    crossvent.fabricate(attachment, 'horsey-hide');
    if (el.value === lastPrefix) {
      el.value = '';
    }
  }

  function keydown (e) {
    const shown = visible();
    const which = e.which || e.keyCode;
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
          crossvent.fabricate(selection, 'click');
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

  function stop (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function showNoResults () {
    if (noneMatch) {
      noneMatch.classList.remove('sey-hide');
    }
  }

  function hideNoResults () {
    if (noneMatch) {
      noneMatch.classList.add('sey-hide');
    }
  }

  function filtering () {
    if (!visible()) {
      return;
    }
    debouncedLoading(true);
    crossvent.fabricate(attachment, 'horsey-filter');
    const value = readInput();
    if (!o.blankSearch && !value) {
      hide(); return;
    }
    const nomatch = noMatches({ query: value });
    let count = walkCategories();
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
    function walkCategories () {
      let category = categories.firstChild;
      let count = 0;
      while (category) {
        const list = findList(category);
        const partial = walkCategory(list);
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
    function walkCategory (ul) {
      let li = ul.firstChild;
      let count = 0;
      while (li) {
        if (count >= limit) {
          crossvent.fabricate(li, 'horsey-hide');
        } else {
          crossvent.fabricate(li, 'horsey-filter');
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

  function deferredFilteringNoEnter (e) {
    const which = e.which || e.keyCode;
    if (which === KEY_ENTER) {
      return;
    }
    deferredFiltering();
  }

  function deferredShow (e) {
    const which = e.which || e.keyCode;
    if (which === KEY_ENTER || which === KEY_TAB) {
      return;
    }
    setTimeout(show, 0);
  }

  function autocompleteEventTarget (e) {
    let target = e.target;
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

  function hideOnBlur (e) {
    const which = e.which || e.keyCode;
    if (which === KEY_TAB) {
      hide();
    }
  }

  function hideOnClick (e) {
    if (autocompleteEventTarget(e)) {
      return;
    }
    hide();
  }

  function inputEvents (remove) {
    const op = remove ? 'remove' : 'add';
    if (eye) {
      eye.destroy();
      eye = null;
    }
    if (!remove) {
      eye = bullseye(container, attachment, {
        caret: anyInput && attachment.tagName !== 'INPUT',
        context: o.appendTo
      });
      if (!visible()) { eye.sleep(); }
    }
    if (remove || (anyInput && doc.activeElement !== attachment)) {
      crossvent[op](attachment, 'focus', loading);
    } else {
      loading();
    }
    if (anyInput) {
      crossvent[op](attachment, 'keypress', deferredShow);
      crossvent[op](attachment, 'keypress', deferredFiltering);
      crossvent[op](attachment, 'keydown', deferredFilteringNoEnter);
      crossvent[op](attachment, 'paste', deferredFiltering);
      crossvent[op](attachment, 'keydown', keydown);
      if (o.autoHideOnBlur) { crossvent[op](attachment, 'keydown', hideOnBlur); }
    } else {
      crossvent[op](attachment, 'click', toggler);
      crossvent[op](docElement, 'keydown', keydown);
    }
    if (o.autoHideOnClick) { crossvent[op](doc, 'click', hideOnClick); }
    if (form) { crossvent[op](form, 'submit', hide); }
  }

  function destroy () {
    inputEvents(true);
    if (parent.contains(container)) { parent.removeChild(container); }
  }

  function defaultSetter (value) {
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

  function defaultItemRenderer (li, suggestion) {
    text(li, getText(suggestion));
  }

  function defaultCategoryRenderer (div, data) {
    if (data.id !== 'default') {
      const id = tag('div', 'sey-category-id');
      div.appendChild(id);
      text(id, data.id);
    }
  }

  function defaultFilter (q, suggestion) {
    const needle = q.toLowerCase();
    const text = getText(suggestion) || '';
    if (fuzzysearch(needle, text.toLowerCase())) {
      return true;
    }
    const value = getValue(suggestion) || '';
    if (typeof value !== 'string') {
      return false;
    }
    return fuzzysearch(needle, value.toLowerCase());
  }

  function loopbackToAnchor (text, p) {
    let result = '';
    let anchored = false;
    let start = p.start;
    while (anchored === false && start >= 0) {
      result = text.substr(start - 1, p.start - start + 1);
      anchored = ranchorleft.test(result);
      start--;
    }
    return {
      text: anchored ? result : null,
      start
    };
  }

  function filterAnchoredText (q, suggestion) {
    const position = sell(el);
    const input = loopbackToAnchor(q, position).text;
    if (input) {
      return { input, suggestion };
    }
  }

  function appendText (value) {
    const current = el.value;
    const position = sell(el);
    const input = loopbackToAnchor(current, position);
    const left = current.substr(0, input.start);
    const right = current.substr(input.start + input.text.length + (position.end - position.start));
    const before = left + value + ' ';

    el.value = before + right;
    sell(el, { start: before.length, end: before.length });
  }

  function filterAnchoredHTML () {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function appendHTML () {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function findList (category) { return sektor('.sey-list', category)[0]; }
}

function isInput (el) { return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'; }

function tag (type, className) {
  const el = doc.createElement(type);
  el.className = className;
  return el;
}

function defer (fn) { return function () { setTimeout(fn, 0); }; }
function text (el, value) { el.innerText = el.textContent = value; }

function isEditable (el) {
  const value = el.getAttribute('contentEditable');
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
