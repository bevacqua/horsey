void function () {
  'use strict';

  horsey(document.querySelector('#hy'), {
    suggestions: ['banana', 'apple', 'orange']
  });

  horsey(document.querySelector('#ly'), {
    suggestions: function (value, done) {
      var items = [ 'banana', 'apple', 'orange' ];
      var start = new Date();
      lyr.innerText = 'Loading...';
      setTimeout(function () {
        lyr.innerText = 'Loaded in ' + (new Date() - start) + 'ms!';
        done(items.filter(function(item) {
          return item.indexOf(value) !== -1;
        }));
      }, 2000);
    }
  });

  horsey(document.querySelector('#kv'), {
    suggestions: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'lemon', text: 'Juicy lemons from the rich Amalfitan Coast' }
    ]
  });

  horsey(document.querySelector('#ig'), {
    suggestions: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ],
    render: function (li, suggestion) {
      var image = '<img class="autofruit" src="example/fruits/' + suggestion.value + '.png" /> ';
      li.innerHTML = image + suggestion.text;
    }
  });

  horsey(document.querySelector('#il'), {
    suggestions: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'banana-boat', text: 'Banana Boat' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'apple-cider', text: 'Red apple cider beer' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'orange-vodka', text: 'Classic vodka and oranges cocktali' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ],
    limit: 2
  });

  horsey(document.querySelector('#ta'), {
    suggestions: [
      { value: '@michael', text: 'Michael Jackson' },
      { value: '@jack', text: 'Jack Johnson' },
      { value: '@ozzy', text: 'Ozzy Osbourne' }
    ],
    anchor: '@'
  });

  horsey(document.querySelector('#ddl'), {
    suggestions: [
      { value: 'banana', text: 'Bananas from Amazon Rainforest' },
      { value: 'banana-boat', text: 'Banana Boat' },
      { value: 'apple', text: 'Red apples from New Zealand' },
      { value: 'apple-cider', text: 'Red apple cider beer' },
      { value: 'orange', text: 'Oranges from Moscow' },
      { value: 'orange-vodka', text: 'Classic vodka and oranges cocktali' },
      { value: 'lemon', text: 'Juicy lemons from Amalfitan Coast' }
    ]
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
