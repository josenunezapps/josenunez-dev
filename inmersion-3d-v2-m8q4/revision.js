(function () {
  'use strict';
  document.querySelectorAll('a[href^="#c"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var chapter = document.querySelector(a.getAttribute('href'));
      var chapters = Array.from(document.querySelectorAll('.ch'));
      if (!chapter || !window.Fly) return;
      e.preventDefault(); window.Fly.goTo(chapters.indexOf(chapter));
    });
  });
  var dialog = document.getElementById('screen-detail');
  document.querySelectorAll('.view-screen').forEach(function(button) {
    button.addEventListener('click', function() {
      var chapter = button.closest('.ch');
      var i = Array.from(document.querySelectorAll('.ch')).indexOf(chapter);
      var image = document.querySelectorAll('#screen .scr')[i].querySelector('img');
      document.getElementById('screen-title').textContent = chapter.querySelector('.kicker').textContent;
      document.getElementById('screen-description').textContent = chapter.querySelector('.one').textContent;
      document.getElementById('screen-contact').href = chapter.querySelector('.open').href;
      document.getElementById('detail-image').src = image.src;
      document.getElementById('detail-image').alt = 'Pantalla de ' + chapter.querySelector('.kicker').textContent;
      dialog.showModal();
    });
  });
  dialog.querySelector('.close-detail').addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('click', function(e) { if(e.target===dialog) { var r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } });
})();
