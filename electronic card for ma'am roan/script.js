var PINKS = ["#f7b8ca", "#ee92ad", "#ffd9e3", "#c2456f"];

/* ===== Sparkles (shared) ===== */
function sparkleBurst(x, y, n) {
  for (var i = 0; i < n; i++) {
    var s = document.createElement("span");
    s.className = "spark";
    var size = 8 + Math.random() * 14;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.width = s.style.height = size + "px";
    s.style.margin = (-size / 2) + "px 0 0 " + (-size / 2) + "px";
    s.style.background = PINKS[i % PINKS.length];
    document.body.appendChild(s);

    var a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 130;
    var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 30;
    var anim = s.animate([
      { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
      { transform: "translate(" + dx * 0.6 + "px," + dy * 0.6 + "px) scale(1) rotate(90deg)", opacity: 1, offset: 0.4 },
      { transform: "translate(" + dx + "px," + (dy + 40) + "px) scale(0) rotate(200deg)", opacity: 0 }
    ], { duration: 900 + Math.random() * 700, easing: "ease-out" });
    anim.onfinish = (function (el) { return function () { el.remove(); }; })(s);
  }
}

/* ===== Part 1: the hidden "one more note" inside the letter ===== */
(function () {
  var btn = document.getElementById("revealBtn");
  var secret = document.getElementById("secret");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  btn.addEventListener("click", function () {
    var r = btn.getBoundingClientRect();
    secret.classList.add("open");
    btn.setAttribute("aria-expanded", "true");

    if (!reduceMotion) {
      sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 32);
      setTimeout(function () {
        var c = document.getElementById("card").getBoundingClientRect();
        for (var i = 0; i < 5; i++) {
          setTimeout(function () {
            sparkleBurst(c.left + Math.random() * c.width, c.top + Math.random() * c.height, 5);
          }, i * 180);
        }
      }, 350);
    }
    btn.disabled = true;
  });
})();

/* ===== Part 2: envelope, Open button, and the "Do Not Open" box ===== */
(function () {
  /* ---- Settings you can tweak ---- */
  var RUN_DISTANCE = 150;   // how far (px) the box jumps each time
  var TRIGGER_RADIUS = 90;  // how close (px) the mouse can get before it runs
  var RESET_DELAY = 1400;   // ms before it slides back to its spot

  var stage = document.getElementById("stage");
  var card = document.getElementById("card");
  var dodger = document.getElementById("dodger");
  var slot = document.getElementById("dodger-slot");
  var label = document.getElementById("dodger-label");
  var openBtn = document.getElementById("openLetterBtn");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tx = 0, ty = 0, resetTimer;

  /* ---- Run away from a point (px, py) on screen ---- */
  function runFrom(px, py) {
    var r = dodger.getBoundingClientRect();
    var home = slot.getBoundingClientRect();
    var vx = r.left + r.width / 2 - px, vy = r.top + r.height / 2 - py;
    var len = Math.hypot(vx, vy) || 1;
    vx /= len; vy /= len;

    var pad = 8;
    var minX = pad - home.left, maxX = innerWidth - pad - home.right;
    var minY = pad - home.top,  maxY = innerHeight - pad - home.bottom;
    function clamp(x, y) {
      return { x: Math.min(maxX, Math.max(minX, x)), y: Math.min(maxY, Math.max(minY, y)) };
    }

    // straight away first; if a wall blocks it, slide sideways
    var tries = [[vx, vy], [-vy, vx], [vy, -vx]];
    var best = null, bestMoved = -1;
    for (var i = 0; i < tries.length; i++) {
      var c = clamp(tx + tries[i][0] * RUN_DISTANCE, ty + tries[i][1] * RUN_DISTANCE);
      var moved = Math.hypot(c.x - tx, c.y - ty);
      if (i === 0 && moved >= 70) { best = c; break; }
      if (moved > bestMoved) { best = c; bestMoved = moved; }
    }

    tx = best.x; ty = best.y;
    var tilt = reduceMotion ? 0 : Math.random() * 14 - 7;
    dodger.style.transform = "translate(" + tx + "px," + ty + "px) rotate(" + tilt + "deg)";

    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      tx = 0; ty = 0;
      dodger.style.transform = "translate(0,0) rotate(0deg)";
    }, RESET_DELAY);
  }

  /* Desktop: run when the mouse gets close */
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var r = dodger.getBoundingClientRect();
    var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    if (Math.hypot(dx, dy) < TRIGGER_RADIUS) runFrom(e.clientX, e.clientY);
  });

  /* Mobile / touch / pen: run the moment it is touched */
  dodger.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    runFrom(e.clientX, e.clientY);
  });

  /* Click and keyboard: it can never actually be opened */
  dodger.addEventListener("click", function (e) {
    e.preventDefault();
    var r = dodger.getBoundingClientRect();
    if (e.detail === 0) runFrom(r.left, r.top);
    else runFrom(e.clientX, e.clientY);
  });
  dodger.addEventListener("focus", function () {
    var r = dodger.getBoundingClientRect();
    runFrom(r.left, r.top);
  });

  /* ---- The real Open button: opens the envelope, then shows the letter ---- */
  openBtn.addEventListener("click", function () {
    openBtn.disabled = true;
    label.textContent = "Too late!";
    stage.classList.add("opening");

    if (!reduceMotion) {
      var r = openBtn.getBoundingClientRect();
      sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 30);
    }

    setTimeout(function () {
      stage.classList.add("done");
      setTimeout(function () {
        stage.style.display = "none";
        card.classList.add("show");
        window.scrollTo(0, 0);
      }, reduceMotion ? 0 : 500);
    }, reduceMotion ? 0 : 1300);
  });
})();
