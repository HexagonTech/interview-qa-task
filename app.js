((window) => {
  let textareahandler = new TextAreaHandler($('.textarea-wrapper textarea'), {
    rightText: window.TEXT_TO_VALIDATE
  });
  textareahandler.on('update', status => {
    $('.textarea-wrapper').attr('state', status);
  });
})(window);