/* LVM2 LOG FILE DATA */

var buildMeta = {};

var hlLine = function(line, c) {
  return "<span class='"+c+"'>"+line+"</span>";
}

var file2Prefix = {};

var lvm2Url = function(commit, file, line) {
  if (!commit) return;
  return "https://git.fedorahosted.org/cgit/lvm2.git/tree/"+file+"?id="+commit+"#n"+line;
};

var hrefFileLine = function(file, line, fl) {
  var href = lvm2Url(buildMeta.commit, file, line);
  if (!fl) fl = file+":"+line;
  if (href) return "<a href='"+href+"'>"+fl+"</a>";
  return fl;
};

var hrefFileLineSrc = function(file, line) {
  var prefix;
  var fl = file+":"+line;
  prefix = file2Prefix[file];
  if (!prefix) return fl;
  file = prefix+"/"+file;
  return hrefFileLine(file, line, fl);
};

var hrefFileLineTest = function(file, line) {
  var fl = file+":"+line;
  file = "test/shell/"+file;
  return hrefFileLine(file, line, fl);
};


var hlTop = function(line) {
  if (line.match("&lt;=+ .* =+&gt;")) {
    return hlLine(hlNone(line), "header");
  }
  if (line.match(/^\[[ 0-9]\d:\d\d\] #+[-_a-zA-Z0-9\/.]+:\d+\+ .*/)) {
    line = line.replace(/^(\[[ 0-9]\d:\d\d\] #+)([-_a-zA-Z0-9\/.]+):(\d+)(\+ .*)/, function(m, pre, file, num, post) {
      return pre+hrefFileLineTest(file, num)+post;
    });

    return hlLine(hlNone(line), "command");
    //return "<span class='command'>"+hlNone(line)+"</span>";
  }
  return hlNone(line);
};
var hlCfg = function(line) {
  return hlNone(line);
};
var hlDebug = function(line) {
  line = line.replace(/^(\[[ 0-9]\d:\d\d\] ## DEBUG\d*:[ 	]+)([-_a-zA-Z0-9\/.]+):(\d+)/, function(m, pre, file, num) {
    return pre+hrefFileLineSrc(file, num);
  });
  return hlNone(line);
};
var hlDaemonIn = function(line) {
  if (line.match(/-&gt; reason = /) || (line.match(/-&gt; response = "(?!OK")/))) {
    return hlLine(hlNone(line), "warning");
  }
  return hlNone(line);
}
var hlClvmd = function(line) {
  return hlNone(line);
};
var _a_link = function(href, text) {
  var link = "[[<a href='"+href+"'>"+(text || href)+"</a>]]";
  return link;
};
var bz_link = function(m, id, comment, text) {
  // https://bugzilla.redhat.com/show_bug.cgi?id=1212590#c1
  var c = comment || "";
  return _a_link("https://bugzilla.redhat.com/show_bug.cgi?id="+id+c, text ? text.slice(1) : "Bug "+id+c);
};
var git_commit = function(m, commit, text) {
  // https://git.fedorahosted.org/cgit/lvm2.git/commit/?id=3fc9615d156892efd8bb28b0306c2fe9c14738ff
  return _a_link("https://git.fedorahosted.org/cgit/lvm2.git/commit/?id="+commit, text ? text.slice(1) : "Commit "+commit);
};
var a_link = function(m, href, text) {
  return _a_link(href, text ? text.slice(1) : href);
};
var lvm2links = function(m, link) {
  if (link.match(/^bz:\d+(?:#c\d+)?(?:|.*)?$/)) {
    return link.replace(/^bz:(\d+)(#c\d+)?(|.*)?$/, bz_link);
  };
  if (link.match(/^commit:[0-9a-fA-F]+(?:|.*)?$/)) {
    return link.replace(/^commit:([0-9a-fA-F]+)(|.*)?$/, git_commit);
  };
  return link.replace(/^([^|\[\]]+)(|.*)?$/, a_link);
};
var hlNone = function(line) {
  if (line.match(/\[\[[^\]\[]+\]\]/)) {
    line = line.replace(/\[\[([^\]\[]+)\]\]/g, lvm2links);
  }
  if (line.match(/STACKTRACE|SKIP_THIS_TEST|&lt;backtrace&gt;|[fF]ailed|[fF]ailure|&lt;[123]&gt;\[\d+\.\d+\]|Segmentation fault|general protection/)) {
    return hlLine(line, "error any");
  }
  if (line.match(/ [123],[0-9]+,[0-9]+,-;/)) {
    return hlLine(line, "error any");
  }
  if (line.match(/&lt;[45]&gt;\[\d+\.\d+\]|WARNING:/)) {
    return hlLine(line, "warning any");
  }
  if (line.match(/ [45],[0-9]+,[0-9]+,-;/)) {
    return hlLine(line, "warning any");
  }
  return hlLine(line, "any");
};

// FIXME:
// lvmetad: pv_gone, token_update, pv_clear_all, pv_list, vg_lookup, pv_found, vg_update
// lvmpolld: hello, pvmove, progress_info
// var lvmpolld_re = test_re(/^(?:\[[ 0-9]\d:\d\d\] \)(?:&lt;-|-&gt;/);
// <- request="hello"
// ...
// -> $
// >= request="pvmove"
// ...
// -> $
// >= request="progress_info"
// ...
// -> $
// /^(?:\[[ 0-9]\d:\d\d\] \)(&lt;- request="(?:pvmove|progress_info)"|-&gt;\|LVMPOLLD: \)/;
var daemon_re = test_re(/^(?:\[[ 0-9]\d:\d\d\] |)(?:&lt;-|-&gt;|pv_clear_all$|pv_gone: \(.*\) \/ \d+|vg_lookup: uuid = |vg_lookup: updated uuid = |pv_found .*, vgid = |locking VG|unlocking VG|LVMPOLLD: )/);

var lvm2context = function(id, element) { return [base_context(
  id,
  [
    {"re": test_re(/^(?:\[[ 0-9]\d:\d\d\] |)CLVMD\[/),          "id": "_clvmd",       "class": "clvmd",       "highlight": hlClvmd,      "next": []},
    {"re": daemon_re,                                           "id": "_daemon",      "class": "daemon",      "highlight": hlNone,       "next": [
    {"re": test_re(/^(?:\[[ 0-9]\d:\d\d\] |)&lt;- /),           "id": "_out",         "class": "daemon_out",  "highlight": hlNone,       "next": []},
    {"re": test_re(/^(?:\[[ 0-9]\d:\d\d\] |)-&gt; /),           "id": "_in",          "class": "daemon_in",   "highlight": hlDaemonIn,   "next": []},
    ]},
    /*
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] lvm.conf {{{/),          "id": "_cfg",         "class": "cfg",         "highlight": hlCfg,        "next": [
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] [-a-z0-9A-Z_]* {/),      "id": "_s",                                   "highlight": hlCfg,        "next": [], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] }/)}
                                                                                                                                     ], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] .*}}}/)},
    */
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## LVMCONF:/),           "id": "_cfg",         "class": "cfg",         "highlight": hlCfg,        "next": [
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## LVMCONF:.*{$/),       "id": "_s",                                   "highlight": hlCfg,        "next": [], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] ## LVMCONF: .*}$/)}
                                                                                                                                     ]},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] +DEBUG:[ 	]+/),   "id": "_debug",       "class": "debug",       "highlight": hlDebug,      "next": []},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## DEBUG\d*:[ 	]+/),   "id": "_debug",       "class": "debug",       "highlight": hlDebug,      "next": []},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## UDEV:/),              "id": "_udev",        "class": "udev",        "highlight": hlNone,       "next": [
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## UDEV:[ 	]+P:/), "id": "_d",                                   "highlight": hlNone,       "next": [], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] ## UDEV:[ 	]+$/), "collapsed": constant(1)}
    ]},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## [A-Z]+:[ 	]/),    "id": "_info",        "class": "info",        "highlight": hlNone,       "next": []},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] ## Line: \d+/),          "id": "_info",        "class": "info",        "highlight": hlNone,       "next": []},
    {"re": test_re(/^\[[ 0-9]\d:\d\d\] .*{{{/),                 "id": "_span",                                "highlight": hlTop,        "next": [], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] .*}}}/)}
  ],
  hlTop,
  element
)]; };

