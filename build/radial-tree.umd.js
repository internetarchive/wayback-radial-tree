!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("d3"),require("lodash")):"function"==typeof define&&define.amd?define(["exports","d3","lodash"],t):t((e=e||self).wb={},e.d3,e._)}(this,(function(e,t,n){"use strict";n=n&&n.hasOwnProperty("default")?n.default:n;var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=function(e){return Array.isArray(e)?e:Array.from(e)};function i(e,t,n){var r=n.targetField;return t.reduce((function(t,n){var i,u=e.getValueByName(n,r).split("/"),o=a(u),c=o[0],l=o.slice(1);return t.name=(i=c)?(i=i.slice(0,i.length-1)).split(",").reverse().join("."):i,function e(t,n){if(n&&0!==n.length){var r=a(n),i=r[0],u=r.slice(1);if(i){var o=void 0;t.children?o=t.children.filter((function(e){return e.name===i}))[0]:t.children=[],o||(o={name:i},t.children.push(o)),e(o,u)}}}(t,l),t}),{})}var u=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.fields=t[0],this.getIndexByName=n.memoize(this.getIndexByName)}return r(e,[{key:"getIndexByName",value:function(e){return this.fields.indexOf(e)}},{key:"getValueByName",value:function(e,t){return e[this.getIndexByName(t)]}}]),e}();function o(e){return e?Object.keys(e).map((function(e){return Number.parseInt(e)})).sort():e}function c(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=t.groupBy,a=t.dedupBy,i=t.orderBy;if(!e)return e;var o=new u(e),c=e.slice(1).reduce((function(e,t){var n=e[o.getValueByName(t,r)]||{};return n[o.getValueByName(t,a)]||(n[o.getValueByName(t,a)]=t),e[o.getValueByName(t,r)]=n,e}),{});return n(c).mapValues((function(e){return Object.values(e)})).mapValues((function(e){return n.sortBy(e,o.getIndexByName(i))})).value()}function l(){var e=document.createElement("div");e.setAttribute("class","rt-content");var t=document.createElement("div");t.setAttribute("class","div-btn");var n=document.createElement("p");n.setAttribute("class","sequence");var r=document.createElement("div");return r.setAttribute("id","chart"),e.appendChild(t),e.appendChild(n),e.appendChild(r),e.style.display="block",e}var s=t.arc().startAngle((function(e){return e.x0})).endAngle((function(e){return e.x1})).innerRadius((function(e){return Math.sqrt(e.y0)})).outerRadius((function(e){return Math.sqrt(e.y1)})),d=t.scaleOrdinal(t.schemePaired);function f(e,n,r,a,i,u){var o=t.partition().size([2*Math.PI,r*r])(t.hierarchy({children:[u]}).sum((function(e){return!e.children})).sort((function(e,t){return t.value-e.value}))).descendants();function c(e){for(var t=e.ancestors().reverse(),n="",r=1;r<t.length&&"end"!==t[r].data.name;r++)n=n+"/"+t[r].data.name;return a+"/web/"+i+"0630"+n}function l(r){var a=r.ancestors().reverse();a.shift();var i=c(r);!function(t,n){var r="",a=document.createElement("span");a.setAttribute("class","symb"),a.innerHTML="/";for(var i=0;i<t.length;i++)r=0===i?" "+t[i].data.name:r+a.innerHTML+t[i].data.name;r=decodeURIComponent(r),e.querySelector(".sequence").innerHTML='<a href="'+n+'">'+r+"</a>"}(a,i),t.selectAll("path").style("opacity",.3),n.selectAll("path").filter((function(e){return a.indexOf(e)>=0})).style("opacity",1)}n.selectAll("path").data(o).enter().append("a").attr("xlink:href",c).on("touchstart",(function(e){return t.event.preventDefault(),t.event.stopPropagation(),l(e),!1})).append("svg:path").attr("display",(function(e){return e.depth?null:"none"})).attr("d",s).attr("fill-rule","evenodd").style("fill",(function(e){return d((e.children?e:e.parent).data.name)})).style("opacity",1).style("cursor","pointer").on("mouseover",l),t.select("#d3_container").on("mouseleave",(function(){e.querySelector(".sequence").innerHTML="",t.selectAll("path").on("mouseover",null),t.selectAll("path").transition().style("opacity",1).on("end",(function(){t.select(this).on("mouseover",l)}))}))}function p(e,t){return e.ownerDocument.getElementById(t)}function v(e,t,n){var r=e.querySelector(".div-btn");r.onclick=function(e){return n(e.target.id)},e.querySelector(".year-btn")||t.forEach((function(e){return r.appendChild(function(e){var t=document.createElement("button");return t.setAttribute("class","year-btn"),t.setAttribute("id",e),t.innerHTML=e,t}(e))}))}e.RadialTree=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},a=r.baseURL||"https://web.archive.org",s=l();e.appendChild(s);var d=new u(n),y=c(n,{groupBy:"timestamp:4",dedupBy:"urlkey",orderBy:"urlkey"}),h=o(y);v(e,h,g);var m=h[h.length-2]||h[0];function g(t){e.querySelector(".active-btn")&&e.querySelector(".active-btn").classList.remove("active-btn"),p(e,t).classList.add("active-btn"),b(e,t)}function b(e,n){e.querySelector(".sequence").innerHTML="",e.querySelector("#chart").innerHTML="";var r=e.querySelector("#chart").offsetWidth,u=r,o=Math.min(r,u)/2,c=t.select("#chart").append("svg:svg").attr("width",r).attr("height",u).append("svg:g").attr("id","d3_container").attr("transform","translate("+r/2+","+u/2+")");c.append("svg:circle").attr("r",o).style("opacity",0);var l=y[n],s=i(d,l,{targetField:"urlkey"});f(e,c,o,a,n,s)}g(m)},Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=radial-tree.umd.js.map
