'use strict';

var sell = require('sell');
var crossvent = require('crossvent');
var bullseye = require('bullseye');
var fuzzysearch = require('fuzzysearch');
var KEY_ENTER = 13;
var KEY_ESC = 27;
var KEY_UP = 38;
var KEY_DOWN = 40;
var cache = [];
var doc = document;
var docElement = doc.documentElement;
var win = global;
var rparagraph = /^<p>|<\/p>\n?$/g;

function find (el) {
  var entry;
  var i;
  for (i = 0; i < cache.length; i++) {
    entry = cache[i];
    if (entry.el === el) {
      return entry.api;
    }
  }
  return null;
}

function horsey (el, options) {
  var cached = find(el);
  if (cached) {
    return cached;
  }

  var o = options || {};
  var parent = o.appendTo || doc.body;
  var render = o.render || defaultRenderer;
  var getText = o.getText || defaultGetText;
  var getValue = o.getValue || defaultGetValue;
  var getSelection = o.getSelection || win.getSelection;
  var form = o.form;
  var limit = typeof o.limit === 'number' ? o.limit : Infinity;
  var suggestions = o.suggestions;
  var userFilter = o.filter || defaultFilter;
  var userSet = o.set || defaultSetter;
  var ul = tag('ul', 'sey-list');
  var selection = null;
  var oneload = once(loading);
  var eye;
  var deferredFiltering = defer(filtering);
  var attachment = el;
  var editor = o.editor;
  var textInput;
  var anyInput;
  var cachedChunks;
  var cachedNeedle;
  var ranchorleft;
  var ranchorright;

  if (o.autoHideOnBlur === void 0) { o.autoHideOnBlur = true; }
  if (o.autoHideOnClick === void 0) { o.autoHideOnClick = true; }
  if (o.autoShowOnUpDown === void 0) { o.autoShowOnUpDown = el.tagName === 'INPUT'; }
  if (o.anchor) {
    ranchorleft = new RegExp('^' + o.anchor);
    ranchorright = new RegExp(o.anchor + '$');
  }

  var api = {
    add: add,
    clear: clear,
    show: show,
    hide: hide,
    toggle: toggle,
    destroy: destroy,
    refreshPosition: refreshPosition,
    defaultRenderer: defaultRenderer,
    defaultGetText: defaultGetText,
    defaultGetValue: defaultGetValue,
    defaultSetter: defaultSetter,
    defaultFilter: defaultFilter,
    retarget: retarget,
    attachment: attachment,
    list: ul,
    suggestions: []
  };
  var entry = { el: el, api: api };

  retarget(el);
  cache.push(entry);
  parent.appendChild(ul);
  el.setAttribute('autocomplete', 'off');

  if (Array.isArray(suggestions)) {
    loaded(suggestions);
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

  function loading () {
    crossvent.remove(attachment, 'focus', oneload);
    suggestions(loaded);
  }

  function loaded (suggestions) {
    suggestions.forEach(add);
    api.suggestions = suggestions;
  }

  function clear () {
    while (ul.lastChild) {
      ul.removeChild(ul.lastChild);
    }
  }

  function add (suggestion) {
    var li = tag('li', 'sey-item');
    render(li, suggestion);
    crossvent.add(li, 'click', clickedSuggestion);
    crossvent.add(li, 'horsey-filter', filterItem);
    crossvent.add(li, 'horsey-hide', hideItem);
    ul.appendChild(li);
    api.suggestions.push(suggestion);
    return li;

    function clickedSuggestion () {
      var value = getValue(suggestion);
      set(value);
      hide();
      attachment.focus();
      crossvent.fabricate(attachment, 'horsey-selected', value);
    }

    function filterItem () {
      var value = textInput ? el.value : el.innerHTML;
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

  function set (value) {
    if (o.anchor) {
      return (isText() ? appendText : appendHTML)(value);
    }
    userSet(value);
  }

  function filter (value, suggestion) {
    if (o.anchor) {
      return (isText() ? filterAnchoredText : filterAnchoredHTML)(value, suggestion);
    }
    return userFilter(value, suggestion);
  }

  function isText () { return !editor || isInput(attachment);}
  function visible () { return ul.className.indexOf('sey-show') !== -1; }
  function hidden (li) { return li.className.indexOf('sey-hide') !== -1; }

  function show () {
    if (!visible()) {
      ul.className += ' sey-show';
      eye.refresh();
      crossvent.fabricate(attachment, 'horsey-show');
    }
  }

  function toggler (e) {
    var left = e.which === 1 && !e.metaKey && !e.ctrlKey;
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

  function select (suggestion) {
    unselect();
    if (suggestion) {
      selection = suggestion;
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
    var total = ul.children.length;
    if (total < moves) {
      unselect();
      return;
    }
    if (total === 0) {
      return;
    }
    var first = up ? 'lastChild' : 'firstChild';
    var next = up ? 'previousSibling' : 'nextSibling';
    var suggestion = selection && selection[next] || ul[first];

    select(suggestion);

    if (hidden(suggestion)) {
      move(up, moves ? moves + 1 : 1);
    }
  }

  function hide () {
    eye.sleep();
    ul.className = ul.className.replace(/ sey-show/g, '');
    unselect();
    crossvent.fabricate(attachment, 'horsey-hide');
  }

  function keydown (e) {
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

  function filtering () {
    if (!visible()) {
      return;
    }
    crossvent.fabricate(attachment, 'horsey-filter');
    var li = ul.firstChild;
    var count = 0;
    while (li) {
      if (count >= limit) {
        crossvent.fabricate(li, 'horsey-hide');
      }
      if (count < limit) {
        crossvent.fabricate(li, 'horsey-filter');
        if (li.className.indexOf('sey-hide') === -1) {
          count++;
        }
      }
      li = li.nextSibling;
    }
    if (!selection) {
      move();
    }
    if (!selection) {
      hide();
    }
  }

  function deferredFilteringNoEnter (e) {
    var which = e.which || e.keyCode;
    if (which === KEY_ENTER) {
      return;
    }
    deferredFiltering();
  }

  function deferredShow (e) {
    var which = e.which || e.keyCode;
    if (which === KEY_ENTER) {
      return;
    }
    setTimeout(show, 0);
  }

  function horseyEventTarget (e) {
    var target = e.target;
    if (target === attachment) {
      return true;
    }
    while (target) {
      if (target === ul || target === attachment) {
        return true;
      }
      target = target.parentNode;
    }
  }

  function hideOnBlur (e) {
    if (horseyEventTarget(e)) {
      return;
    }
    hide();
  }

  function hideOnClick (e) {
    if (horseyEventTarget(e)) {
      return;
    }
    hide();
  }

  function inputEvents (remove) {
    var op = remove ? 'remove' : 'add';
    if (eye) {
      eye.destroy();
      eye = null;
    }
    if (!remove) {
      eye = bullseye(ul, attachment, { caret: anyInput && attachment.tagName !== 'INPUT', getSelection: getSelection });
      if (!visible()) { eye.sleep(); }
    }
    if (typeof suggestions === 'function' && !oneload.used) {
      if (remove || (anyInput && doc.activeElement !== attachment)) {
        crossvent[op](attachment, 'focus', oneload);
      } else {
        oneload();
      }
    }
    if (editor) {
      crossvent[op](editor.editable, 'horsey-filter', getChunksForFilters);
    }
    if (anyInput) {
      crossvent[op](attachment, 'keypress', deferredShow);
      crossvent[op](attachment, 'keypress', deferredFiltering);
      crossvent[op](attachment, 'keydown', deferredFilteringNoEnter);
      crossvent[op](attachment, 'paste', deferredFiltering);
      crossvent[op](attachment, 'keydown', keydown);
      if (o.autoHideOnBlur) { crossvent[op](docElement, 'focus', hideOnBlur, true); }
    } else {
      crossvent[op](attachment, 'click', toggler);
      crossvent[op](docElement, 'keydown', keydown);
    }
    if (o.autoHideOnClick) { crossvent[op](doc, 'click', hideOnClick); }
    if (form) { crossvent[op](form, 'submit', hide); }
  }

  function destroy () {
    inputEvents(true);
    if (parent.contains(ul)) { parent.removeChild(ul); }
    cache.splice(cache.indexOf(entry), 1);
  }

  function defaultSetter (value) {
    if (textInput) {
      el.value = value;
    } else {
      el.innerHTML = value;
    }
  }

  function defaultRenderer (li, suggestion) {
    li.innerText = li.textContent = getText(suggestion);
  }

  function defaultFilter (q, suggestion) {
    var text = getText(suggestion) || '';
    var value = getValue(suggestion) || '';
    return fuzzysearch(q, text.toLowerCase()) || fuzzysearch(q, value.toLowerCase());
  }

  function loopbackToAnchor (text, p) {
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

  function getChunksForFilters () {
    editor.runCommand(function gotContext (chunks) {
      var text = chunks.before + chunks.selection;
      var anchored = false;
      var start = text.length;
      while (anchored === false && start >= 0) {
        cachedNeedle = text.substr(start - 1, text.length - start + 1);
        anchored = ranchorleft.test(cachedNeedle);
        start--;
      }
      if (anchored === false) {
        cachedNeedle = null;
      }
      cachedChunks = chunks;
    });
  }

  function filterAnchoredText (q, suggestion) {
    var position = sell(el);
    var input = loopbackToAnchor(q, position).text;
    if (input) {
      return userFilter(input, suggestion);
    }
  }

  function filterAnchoredHTML (q, suggestion) {
    if (cachedNeedle) {
      return userFilter(cachedNeedle, suggestion);
    }
  }

  function entitize (value) {
    if (editor && editor.mode !== 'markdown') {
      return editor.parseMarkdown(value).replace(rparagraph, '');
    }
    return value;
  }

  function appendText (value) {
    var entity = entitize(value);
    var current = el.value;
    var position = sell(el);
    var input = loopbackToAnchor(current, position);
    var left = current.substr(0, input.start);
    var right = current.substr(input.start + input.text.length + (position.end - position.start));
    var before = left + entity + ' ';

    el.value = before + right;
    sell(el, {
      start: before.length, end: before.length
    });
  }

  function appendHTML (value) {
    editor.runCommand(setEntity);
    function setEntity (chunks) {
      var entity = entitize(value);
      var left = cachedChunks.before;
      var len = left.length - 1;
      while (len > 0 && !ranchorright.test(left)) {
        left = left.substr(0, --len);
      }
      chunks.before = left.substr(0, len) + entity + '&nbsp;';
      chunks.after = cachedChunks.selection + cachedChunks.after;
      chunks.selection = '';
    }
  }
}

function isInput (el) { return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'; }

function defaultGetValue (suggestion) {
  return typeof suggestion === 'string' ? suggestion : suggestion.value;
}

function defaultGetText (suggestion) {
  return typeof suggestion === 'string' ? suggestion : suggestion.text;
}

function tag (type, className) {
  var el = doc.createElement(type);
  el.className = className;
  return el;
}

function once (fn) {
  var disposed;
  function disposable () {
    if (disposed) { return; }
    disposable.used = disposed = true;
    (fn || noop).apply(null, arguments);
  }
  return disposable;
}
function defer (fn) { return function () { setTimeout(fn, 0); }; }
function noop () {}

function isEditable (el) {
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

horsey.find = find;
module.exports = horsey;
