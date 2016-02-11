/* AUXILIARY FUNCTIONS */

var test_re = function(r) {
  var re = new RegExp(r);
  return function(line) {
    return re.test(line);
  };
};

var html_escape = function(t) {
  return $('<div/>').text(t).html();
  // return t.replace(/&/g, '&amp;')...;
};

var noop = function () {};

var debug = 0;

/* CONTEXT */

// TODO: pass in the closure?
var id_n = 1;

// TODO: this depends on formatting and should be a injected {
// TODO: which is faster?
var toggle1 = function(event) {
  debug && console.log("id clicked", ni);
  event.stopPropagation();
  $(this).toggleClass("expanded collapsed");
  //$(this).children(".folded").toggle();
  //$(this).children(".unfolded").toggle();
  // this is incorrecty anyway!
};

var folded_click = function(event) {
  var e = $(this);
  debug && console.log("clicked", e);
  event.stopPropagation();
  e.parent().toggleClass("expanded collapsed");
};

var unfolded_click = function(event) {
  var e = $(this);
  debug && console.log("clicked", e);
  event.stopPropagation();
  e.parent().toggleClass("expanded collapsed");
};
// } see TODO above

var constant = function(n) { return function() { return n; }; }

var new_context;
var base_context = function(id, next, hl, a) {
  return {
    "id": id,
    "level": 0,
    "a": a,
    "_next": next,
    "highlight": hl,
    "check": function (line) { return true; },
    "next": function (line) {
      debug && console.log("next", line);
      var i, n;
      for (i in this._next) {
        n = this._next[i];
        debug && console.log("checking ", n, n.re(line));
        if (n.re(line)) {
          var ni = this.new_id(n.id);
          // TODO: use dependency injection to pass this in as a function {
          // TODO: should be open or collapsed?
          var collapsed;
          if (n.collapsed) {
            collapsed=n.collapsed(this.level+1) ? "collapsed" : "expanded";
          } else {
            collapsed=this.level > 0 ? "expanded" : "collapsed";
          }
          var cs = ["fold", collapsed, "level"+(this.level+1)].concat(n.classes || []).join(" ");
          this.append("<div id='"+ni+"' class='"+cs+"'><span class='folder before'/><span class='folded'>"+line+"</span><span class='unfolded'/><span class='folder after'/></div>");
          // TODO: if there are error messages: ??? break the span? or keep them all open? opene by default, but allow closing by clicking?
          var b = this.a.children("#"+ni);
          /*
          b.click(toggle1);
          */
          /* return b.children(".unfolded")/*[0]*/
          /* } */
          var nc = new_context(n.re, ni, n.next, n.re_end, n.highlight, b.children(".unfolded")/*[0]*/);
          nc.level = this.level+1;
          nc.parent = this;
          debug && console.log("next returning", nc);
          return nc;
        }
      }
      return null;
    },
    "new_id": function (n_id) { return this.id + n_id + "_" + id_n++; },
    "append": function (line) {
      // debug && console.log(this.a);
      /* this.a is an optimalization of `$("#"+this.id+" > .unfolded")` which
       * was freaking slow traversing whole huge tree */
      this.a.append(line);
    }
  };
};

new_context = function(re, id, next, re_end, hl, a, collapsed) {
  var nc = base_context(id, next, hl, a);
  nc.re = re;
  nc.re_end = re_end;
  nc.check = function(line) {
    if (re_end) {
      // TODO: The last line should be included too.
      // Need much better logic - not only to allow including one more line, but to
      // allow checking parent(s),...
      debug && console.log("re_end", re_end, re_end(line));
      return !re_end(line);
    } else {
      debug && console.log("re", re, re(line));
      return re(line);
    }
  };
  return nc;
};


/* MAIN CYCLE */

var _close_context = function(n, cn) {
  // TODO: should this be property of context?
  cn.last_line = n-1;
  var p = cn.a.parent();
  if (n - cn.first_line < 4) {
    p.removeClass("expanded collapsed").addClass("small");
  } else {
    p.click(toggle1);
  }
  p.children(".folder").html("<span class='lines'>"+cn.first_line+"-"+cn.last_line+"</span>");
};

var close_all_contexts = function(n, context) {
  if (context.length > 1) {
    console.warning("Not all contexts were closed. Popping them...");
    cn = context.pop();
    _close_context(n, cn);
    debug && console.log("pop", cn);
  }
};

var parseline = function(line, n, context) {
  var cl = context.length;
  var cc = context[cl-1];
  var cn = null;
  var nn = 1; // need new line?
  debug && console.log("processing", line);
  while (cl > 1) {
    if (cc.check(line)) {
      debug && console.log("checked OK");
      break;
    } else {
      cn = context.pop();
      _close_context(n, cn);
      debug && console.log("pop", cn);
      cl -= 1;
      cc = context[cl-1];
      nn = 0;
    }
  }
  debug && console.log("checking after pop", cc);
  cn = cc.next(line);
  while (cn) {
    nn = 0;
    cn.first_line = n;
    /* cc.append("<span id='"+cn.id+"' class='fold'/>"); */
    debug && console.log("push", cn);
    context.push(cn);
    cc = cn;
    // TODO: need function to append line to first-line (display when collapsed)
    cn = cc.next(line);
  }
  debug && console.log("checking after push", cc);
  //nn && cc.append("\n");
  // TODO: this should be a part of display function!
  cc.append("<div id='L"+n+"' class='line'><span class='lines'>"+n+" </span>"+cc.highlight(line)+"</div>");
  //cc.append(line);
};

var _highlight = function(lines, first, last, context, stat) {
  var i;
  if (stat) stat("Processing "+lines.length+" lines...");
  var ts1 = Date.now();
  for (i=first; i<=last; i++) {
    parseline(html_escape(lines[i]), i, context);
  }
  if (stat) stat("Processed "+lines.length+" lines in "+(Date.now()-ts1)+"ms");
  close_all_contexts(i, context);
}

var highlight = function(lines, first, last, context, stat) {
  var ln = lines.length;

  if (!first) { first = 0; } else {
    if (first < 0) { first = ln+first; if (first < 0) { first = 0; } }
  }
  if (first >= ln) return;
  
  if (!last) { last = ln-1; } else {
    if ( last < 0) { last = ln+last; if (last >= ln) { last = ln-1; } }
  }
  if (last < 0) return;

  _highlight(lines, first, last, context, stat);
};

var highlight_tail = function(lines, max_lines, min_lines, context, stat) {
  var ln = lines.length;
  if (ln > max_lines) {
    _highlight(lines, ln-min_lines, ln-1, context, stat);
  } else if (ln > 0) {
    _highlight(lines, 0, ln-1, context, stat);
  }
};

var unfold = function(o) {
    o.parents(".collapsed").toggleClass("expanded collapsed");
};

var expand_highlighted = function() {
  unfold($(".highlighted"));
};

var navigation = function(lines, header) {
  var b;
  var d = $("<div class='result'/>");

  if (header) {
    b = $("<h2/>");
    b.append(header);
    d.append(b);
  }

  lines.each(function (i, e) {
    var c = $("<div/>");
    c.append("<a href='#"+e.id+"'>#"+e.id+"</a> ");
    c.append($(this).find(".any").text());
    d.append(c);
  });

  var b = $("<span class='button'>Close</span>");
  b.click(function() { d.remove(); });
  d.append(b);
  d.append("\n");

  return d;
};

var unfolding_jump = function() { // hash) {
  var hash = window.location.hash.slice(1);
  var e;
  /*
  if (!hash) {
    hash = window.location.hash.slice(1);
  }
  */
  if (hash == "" || hash == "$") {
    // go to last (highlighted/error/warning) line
    var l = $(".line");
    var lh = [];
    if (hash == "") {
      lhs = l.filter(function (i, e) { return $(this).filter(".highlighted").length > 0 || $(this).has(".error, .warning").length > 0; });
      //console.log(lhs);
      lh = lhs.last();
      if (lh.length > 0) e = lh;
    }
    if (!e && l.length > 0) e = l.last();
  } else {
    if (hash.indexOf("L") != 0) {
      hash = "L"+hash;
    }
    e = $("#"+hash);
  }
  if (e) {
    e.addClass("highlighted");
    unfold(e);
    //console.log(e);
    //e.scrollTo(0); // new in jQuery 1.9
    //e.scrollTop(0); // works
    if (e[0]) e[0].scrollIntoView(true); // pure JS
  }
};

var maxtimes = function(n, callback) {
  var first = n;
  return function() {
    if (n > 0) {
      a = [n--].concat(arguments);
      return callback.apply({}, a);
    };
  };
};

var maxprint = function(message, n) {
  return maxtimes(n, function(i, a) { console.log([message, i, arguments]); });
};

var search = function(top, term, isRe, results) {
  //console.log(["term", term]);
  if (isRe) {
    term = RegExp(term, "g");
    //console.log(["re", term, term.toString()]);
  }

  var matches = top.find(".line .any").filter(isRe ? function() {
      return term.test($(this).text());
    } : function() {
      return $(this).text().indexOf(term) >= 0;
    });
  // console.log("searching:", term, "matches:", matches);
  if (matches.length > 0) {

    matches.html(function (i, old) {
      // FIXME?/NOTE: This will override syntax highlighting
      return $(this).text().replace(term, function(m) {
        var d = $("<div/>");
        var n = $("<span class='search'/>").text(m);
        d.append(n);
        return d.html();
      });
    });

    matching_lines = matches.parent(".line");
    matching_lines.addClass("highlighted");

    unfold(matching_lines);

    if (results) {
      var r = navigation(matching_lines, "Search results for "+term).append("<span class='counter'>Found "+matches.length+" time(s) on "+matching_lines.length+" line(s).</span>\n");
      results.append(r);
      r[0].scrollIntoView(true);
    } else {
      matching_lines.last()[0].scrollIntoView(true);
    }
  }
};

var folding_nav = function(navid, topid, results) {

  var nav = $("#"+navid);
  var top = $("#"+topid);

  var b;
  var c;

  b = $('<span class="button">Collapse top-level</span>');
  b.click(function() {
      $("#"+topid+" > .expanded").toggleClass("expanded collapsed");
      if (!$("#"+navid+"_ch").val()) expand_highlighted(top);
  });
  nav.append(b).append(" ");
  b = $('<span class="button">Collapse all</span>');
  b.click(function() {
      $("#"+topid+" .expanded").toggleClass("expanded collapsed");
      if (!$("#"+navid+"_ch").prop("checked")) expand_highlighted(top);
  });
  nav.append(b).append(" ");
  b = $('<span class="button">Expand all</span>');
  b.click(function() {
      $("#"+topid+" .collapsed").toggleClass("expanded collapsed");
  });
  nav.append(b).append(" ");
  b = $('<span class="button">Expand top-level</span>');
  b.click(function() {
      $("#"+topid+" > .collapsed").toggleClass("expanded collapsed");
  });
  nav.append(b).append(" ");

  b = $("<form><input id='"+navid+"_ch' type='checkbox'/> <label for='"+navid+"_ch'>Collapse highlighted</label></form>");
  nav.append(b).append(" ");

  b = $("<form><input id='"+navid+"_search'/> </form>");
  c = $("<input type='button' value='Search RegExp'/>");
  c.click(function() { search(top, $("#"+navid+"_search").val(), 1, results); });
  b.append(c);
  c = $("<input type='button' value='Search Text'/>");
  c.click(function() { search(top, $("#"+navid+"_search").val(), 0, results); });
  b.append(c);
  nav.append(b).append(" ");
};


/******************************************************************************\
* URL arguments processing
\******************************************************************************/

var proc_url = function(url, defaults, f) {
  var args = {};
  var _url = url || window.location.toString();

  var u, p;
  if (window.urlObject) {
    var u = urlObject(_url);
  }
  if (u) {
    p = u.parameters;
  } else if (window.Arg) {
    p = Arg.parse(_url);
    if (!p) {
      alert("No parameters object found...")
      p = {};
    };
    var i = _url.indexOf("#");
    u = {"hash": _url.substring(i+1), "parameters": p};
  } else {
    alert("Missing urlObject or Arg for parsing URL.");
    p = {};
  }
  console.log(u);

  var proc_int = function(key, def) {
    args[key] = p[key] ? Number.parseInt(p[key]) : defaults[key] ? defaults[key] : def;
  };

  var proc_context = proc_int;

  // input file:
  // TODO: if array of strings: warning. display only the first (last) one.
  // TODO: file picker(?)
  args.f = p.f || f || defaults.f;

  // range(s) to display:
  args.r = null; // will use highlight_tail (how?)
  if (p.r) {
    r = p.r.join(",").split(",");
  } else {
    r = defaults.r || ["0-1000/40000", "-32000-/40000", "-$/-40000"]; // max. last 32k lines if more than 40k
  }


  // lines to unfold and highlight:
  // format: same as ranges
  args.l = null;
  if (p.l) {
    args.l = p.l.join(",").split(",");
  }
  // lc - line context: >= 0 - number of lines above and below; <0 - ignore if not in ranges
  proc_context("lc");
  // lu - line context: >= 0 - number of lines above and below; <0 - ignore if not in ranges
  proc_context("lu");


  // line to visit and highlight:
  args.g="$";
  if (u.hash) {
    // format: L<N> or <N> or -<N> or $?
    args.g = u.hash;
  } else if (p.g) {
    // TODO: is array: warning
    // format: L<nnn> or <nnn> or 
    args.g = p.g;
  }
  // if not specified: context for ``l'' will be used.
  // gc - line context: >= 0 - number of lines above and below; <0 - ignore if not in ranges
  proc_context("gc");
  // gu - line context: >= 0 - number of lines above and below; <0 - ignore if not in ranges
  proc_context("gu");

  // gap - minimal gap between included lines
  proc_int("gap");

  /*
  // TODO: Not implemented yet:
  // search(es) to unfold and highlight:
  args.s = p.s;
  // TODO: sc - search context: >= 0 - number of lines above and below; <0 - ignore if not in ranges
  */

  /*
  // TODO: Not implemented yet:
  // lines to collapse:
  // format: same as ranges
  args.c = null;
  if (p.c) {
    args.c = p.c.join(",").split(",");
  }
  // collapse more top-level lines (?) - unless the fold is explicitly expanded for some reason

  // default context to display for lines to show which are not in r
  args._u = p._u || 5;
  args._c = p._c || 5;
  */

  return args;
};


var proc_args = function(args, lines) {
  if (0) { // FIXME: ranges are not used yet!
    args.r = proc_ranges(args.r || ["-1000/40000-", "-32000-/40000-", "-$/-40000"], lines);
    args.l = proc_ranges(args.l, lines);
    args.c = proc_ranges(args.c, lines);
  }
  return args;
};

