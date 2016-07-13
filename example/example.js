void function () {
  'use strict';

  horsey(document.querySelector('#hy'), {
    source: [{ list: ['banana', 'apple', 'orange'] }]
  });

  horsey(document.querySelector('#ly'), {
    source: function (data, done) {
      var items = ['banana', 'apple', 'orange'];
      var start = new Date();
      lyr.innerText = 'Loading...';
      setTimeout(function () {
        lyr.innerText = 'Loaded in ' + (new Date() - start) + 'ms!';
        done(null, [{ list: items.filter(function(item) {
          return item.indexOf(data.input) !== -1;
        }) }]);
      }, 2000);
    }
  });

  horsey(document.querySelector('#kv'), {
    source: [{ list: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ]}],
    getText: 'text',
    getValue: 'value'
  });

  horsey(document.querySelector('#ig'), {
    source: [{ list: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ]}],
    getText: 'text',
    getValue: 'value',
    renderItem: function (li, suggestion) {
      var image = '<img class="autofruit" src="example/fruits/' + suggestion.value + '.png" /> ';
      li.innerHTML = image + suggestion.text;
    }
  });

  horsey(document.querySelector('#il'), {
    source: [{ list: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'banana-boat', text: 'Banana Boat' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'apple-cider', text: 'Red apple cider beer' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'orange-vodka', text: 'Classic vodka and oranges cocktali' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ]}],
    getText: 'text',
    getValue: 'value',
    limit: 2
  });

  horsey(document.querySelector('#ta'), {
    source: [{ list: [
      { value: '@michael', text: 'Michael Jackson' },
      { value: '@jack', text: 'Jack Johnson' },
      { value: '@ozzy', text: 'Ozzy Osbourne' }
    ]}],
    getText: 'text',
    getValue: 'value',
    anchor: '@'
  });

  horsey(document.querySelector('#ddl'), {
    source: [{ list: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'banana-boat', text: 'Banana Boat' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'apple-cider', text: 'Red apple cider beer' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'orange-vodka', text: 'Classic vodka and oranges cocktail' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ]}],
    getText: 'text',
    getValue: 'value'
  });

  function events (el, type, fn) {
    if (el.addEventListener) {
      el.addEventListener(type, fn);
    } else if (el.attachEvent) {
      el.attachEvent('on' + type, wrap(fn));
    } else {
      el['on' + type] = wrap(fn);
    }
    function wrap (originalEvent) {
      var e = originalEvent || global.event;
      e.target = e.target || e.srcElement;
      e.preventDefault  = e.preventDefault  || function preventDefault () { e.returnValue = false; };
      e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
      fn.call(el, e);
    }
  }
}();
