////////////////////////////////////////////////////////////////////////////////
// Highlighting
////////////////////////////////////////////////////////////////////////////////
var hlLine = function(line, c) {
  return "<span class='"+c+"'>"+line+"</span>";
};

var hlNone = function(line) {
  return hlLine(line, "any");
};

var hlTop = function(line) {
  if (line.match("^== .* ==") || line.match("^# .*")) {
    return hlLine(hlNone(line), "header1");
  }
  if (line.match("^=== .* ===") || line.match("^## .*")) {
    return hlLine(hlNone(line), "header2");
  }
  if (line.match("^==== .* ====") || line.match("^### .*")) {
    return hlLine(hlNone(line), "header3");
  }
  return hlNone(line);
};

////////////////////////////////////////////////////////////////////////////////
// Marker Folding
////////////////////////////////////////////////////////////////////////////////
var _vim_context = function(next) {
  return [
    {"re": test_re(/{{{/), "id": "_span", "highlight": hlTop, "next": next||[], "re_end": test_re(/}}}/)}
  ];
};

var _vim_context_n = function(n) {
  return n <= 0 ? [] : _vim_context(_vim_context_n(n-1));
};

var vim_context = function(id, element, n) {
  var b;
  if (n && n>=0) {
    b = _vim_context_n(n);
  } else {
    b = _vim_context();
    // NOTE: Creating cyclic structure! Do not try to print it!
    b[0].next = b;
  }
  return [base_context(id, b, hlTop, element)];
};

////////////////////////////////////////////////////////////////////////////////
// Marker with Explicit Level Folding
////////////////////////////////////////////////////////////////////////////////
var _vim_contextX = function(i, next) {
  return [
    {"re": test_re("{{{["+i.toString()+"-9]"), "id": "_span", "highlight": hlTop, "next": next||[], "re_end": test_re("(?:}}}|{{{)[1-"+i.toString()+"]")}
  ];
};

var _vim_contextX_n = function(i, n) {
  return i > n ? [] : _vim_contextX(i, _vim_contextX_n(i+1, n));
};

var vim_contextX = function(id, element, n) {
  var b;
  if (n && n>=0) {
    b = _vim_contextX_n(1, n);
  } else {
    b = _vim_contextX_n(1, 1);
    // NOTE: Creating cyclic structure! Do not try to print it!
    b[0].next = b;
  }
  return [base_context(id, b, hlTop, element)];
};

////////////////////////////////////////////////////////////////////////////////
// Fold by Indentation
////////////////////////////////////////////////////////////////////////////////
var _indent_context = function(indent, next) {
  return [
    {"re": test_re("^"+indent), "id": "_span", "highlight": hlTop, "next": next||[]}
  ];
};

var indent_context = function(id, element, indent, n) {
  var single_indent = indent;
  if (!indent || indent <= 0) {
    //console.log("Negative or zero indentation requested! Using 4 as default.");
    single_indent = 4;
  }
  single_indent = " ".repeat(single_indent);
  var nn = n;
  if (!n || n <= 0) {
    //console.log("Negative or zero levels requested! Using max (9) as default.");
    nn = 9;
  }
  var _indent_context_n = function(i, n) {
    return i > n ? [] : _indent_context(single_indent.repeat(i), _indent_context_n(i+1, n));
  };
  return [base_context(id, _indent_context_n(1, nn), hlTop, element)];
};
