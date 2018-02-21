

class TextAreaHandler {
  constructor($el, options = {}) {
    this.$el = $el;
    this.$original = $el.clone();

    this.options = Object.assign({
      rightText: 'Lorem ipsum dolor sit amet consectetur adipisicing elit Adipisci asperiores dolor illo libero quod quos Asperiores at id molestiae sapiente',
    }, options);

    this.KEYS = {
      BACKSPACE: 	8,
      SPACE: 		32,
    };
    this.CHAR_CODES = {
      SPACE: 		160,
    };

    this.eventsList = { invalid: $.noop, valid: $.noop, done: $.noop, update: $.noop };
    this.words = { right: this._parseToWords(this.options.rightText), typed: [], model: [] };
    this.status = 'idle';

    this.init();
  }

  on(event, cb) {
    if (this.eventsList[event]) {
      this.eventsList[event] = cb;
    }
  }

  off(event) {
    if (this.eventsList[event]) {
      this.eventsList[event] = $.noop;
    }
  }

  init() {
    $.fn.replaceWithPush = function (a) {
      var $a = $(a);
      this.replaceWith($a);
      return $a;
    };

    // Replace any input element to container
    this.$el = this.$el.replaceWithPush('<div />');

    this.$placeholder = $('<div />').addClass('tah-placeholder tah-layer').text(this.options.rightText);
    this.$textarea = $('<div autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" />').addClass('tah-textarea tah-layer');

    this.$el.append(this.$placeholder, this.$textarea);

    this.$el.addClass('tah-item');
    this.$textarea.on('keyup focus blur', (e) => this.handle(e));
    this.$textarea.on('keydown', (e) => this.update(e));

    this.$el.on('click', (e) => this.onContainerClick(e));
    this.$textarea.on('blur', () => this.setActive(false));

    // Render placeholder div
    this.render();
  }

  onContainerClick(e) {
    this.setActive(true);

    if (!$(e.target).is('.tah-textarea') && !$(e.target).parent().is('.tah-textarea') || !this.$textarea.text().length) {
      this.$textarea.focus();
      this._moveCaretToEnd(this.$textarea.get(0));
    }
  }

  setActive(state) {
    if (state) {
      this.$el.addClass('active');
    } else if (!this.$textarea.text().length) {
      this.$el.removeClass('active');
    }
  }

  update(e) {
    // console.log(this._getCaretPosition(this.$textarea[0]));

    /*if (
      e.keyCode === this.KEYS.SPACE

    ) {
      e.preventDefault();
    }*/
  }

  handle(e) {
    this.words.model = this._parseToWords(this.$textarea.text());

    // Check the last word
    e.isLastLetter = (
      // Check words count typed and defined
      // (this.words.model.length === this.words.right.length) &&
      // Check length both of last words

      // If we have that word in defined words array
      (this.words.right[this.words.model.length - 1]) &&
      // Check length of last words
      this.words.model[this.words.model.length - 1].word.length >= this.words.right[this.words.model.length - 1].word.length
    );

    e.cursorPosition = this._getCaretPosition(this.$textarea[0]);

    /*if (
      e.keyCode === this.KEYS.BACKSPACE ||
      e.keyCode === this.KEYS.SPACE ||
      e.type === 'blur' ||
      e.isLastWordAndLetter
    ) {
      this.parse(e);
    }*/

    this.parse(e);
  }

  parse(e) {
    let typed = this.$textarea.text();

    // Set default valid state
    this.words.right.forEach(item => item.valid = null);

    // Check validation of words
    this.words.typed = this._parseToWords(typed);

    if (
      !e.isLastLetter &&
      (typed.length && typed[typed.length - 1].charCodeAt(0) !== this.CHAR_CODES.SPACE)
    ) {
      // Remove last word from validation
      this.words.typed.splice(-1, 1);
    }

    this.words.typed.forEach((item, i) => {
      // written more words than needed
      if (!this.words.right[i]) { return; }

    let valid = (this._preCompareWord(item.word) === this._preCompareWord(this.words.right[i].word));
    this.words.right[i].valid = item.valid = valid;
    this.eventsList[valid ? 'valid' : 'invalid'](item);
  });

    // We done all words right!
    if (
      this.words.typed.length === this.words.right.length &&
      !this.words.typed.filter((item) => item.valid === false).length
  ) {
      this.eventsList['done']();
      this.status = 'done';
      this.eventsList['update'](this.status);
    } else if (this.words.typed.filter((item) => item.valid === false).length) {
      this.status = 'wrong';
      this.eventsList['update'](this.status);
    } else {
      this.status = 'typing';
      this.eventsList['update'](this.status);
    }


    this.render(e);
  }

  render(e) {
    let spaceSymbol = ' ';

    this.$placeholder.html(this.words.right.map((item) => ((item.valid !== null ? `<span class="tah-word-${item.valid ? 'valid' : 'invalid'}">${item.word}</span>` : item.word) + spaceSymbol)));

    // Render textarea block only when we've pressed space button or leaved the textarea or it's the last word in input
    /*if (e && (e.keyCode === this.KEYS.SPACE || e.type === 'blur' || e.isLastWordAndLetter)) {
      this.$textarea.html(
        this.words.typed.map(
          (item, index) =>
            ((item.valid ? item.word : `<span class="tah-word-invalid">${item.word}</span>`) + (index === this.words.typed.length - 1 ? '' : spaceSymbol))
        )
      );

      // Append space on the end of input's text
      if (!e.isLastWordAndLetter && this.words.typed.length && (this.words.typed.length !== this.words.right.length)) {
        this.$textarea.append('<span>&nbsp;</span>');
      }
    }

    if (e && e.type !== 'blur') {
      this._moveCaretToEnd(this.$textarea.get(0));
    }*/
  }

  destroy() {
    this.$textarea.off();
    this.$el.off();

    this.$el.removeClass('tah-item');
    this.$el.replaceWith(this.$original);
  }

  /**
   * Private's methods
   */

  _preCompareWord(word) {
    return word.replace(/í/, 'i')
      .toLowerCase();
  }

  _parseToWords(str) {
    if (!str || !str.trim().length) { return []; }
    return str.match(/\S+/g)
      .map((item) => ({ word: item, valid: null }));
  }

  _getLastWord(str) {
    if (!str || !str.length) { return ''; }
    return str.match(/\S+$/)[0];
  }

  // Move cursor to the end
  // @url https://stackoverflow.com/a/3866442
  _moveCaretToEnd(contentEditableElement) {
    var range,selection;
    if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
      range = document.createRange();//Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection();//get the selection object (allows you to change selection)
      selection.removeAllRanges();//remove any selections already made
      selection.addRange(range);//make the range you have just created the visible selection
    }
    else if (document.selection)//IE 8 and lower
    {
      range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
      range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      range.select();//Select the range (make it the visible selection
    }
  }

  _getCaretPosition(contentEditableElement) {
    if (!window.getSelection() || window.getSelection().rangeCount <= 0) {
      return null;
    }

    var range1 = window.getSelection().getRangeAt(0),
      range2 = range1.cloneRange();
    range2.selectNodeContents(contentEditableElement);
    range2.setEnd(range1.endContainer, range1.endOffset);
    return range2.toString().length;
  }
}
