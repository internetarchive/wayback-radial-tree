import { arc, csvParseRows, hierarchy, partition, scaleOrdinal, schemeCategory20b, select, selectAll } from 'd3';

/**
 * Radial Tree Library
 * 
 * @param {DOMElement} element
 * @param {Object} option
 * Option baseURL defines the target Wayback Machine server.
 * Option limit defines the max number of CDX query results.
 * Option indicatorImg defines the graphic to display while loading data from
 * the Wayback Machine. If undefined, no loading graphic is displayed.
 */
function RadialTree(element, option) {
    var GlobYear = 0;
    var baseURL = 'https://web.archive.org';
    var limit;
    var indicatorImg;
    // Use typeof check to allow empty string in baseURL value
    if (typeof option.baseURL !== 'undefined') {
        baseURL = option.baseURL;
    }
    if (option.limit) {
        limit = option.limit;
    }
    if (option.indicatorImg) {
        indicatorImg = option.indicatorImg;
    }
    if (!option.url) return;

    Init(element);
    GetData(option.url, function (success, err, allYears, yearData) {
        if (indicatorImg) {
            element.querySelector(".rt-indicator").style.display = "none";
        }
        if (!success) return;

        CreateYearButtons(element, option, allYears, yearData);
    });

    function Init(container) {
        var content = document.createElement("div");
        content.setAttribute("class", "rt-content");
        var divBtn = document.createElement("div");
        divBtn.setAttribute("class", "div-btn");

        var sequence = document.createElement("p");
        sequence.setAttribute("class", "sequence");
        var chart = document.createElement("div");
        chart.setAttribute("id", "chart");
        if (indicatorImg) {
            var indicator = document.createElement("img");
            indicator.setAttribute("src", indicatorImg);
            indicator.setAttribute("class", "rt-indicator");
            chart.appendChild(indicator);
        }
        content.appendChild(divBtn);
        content.appendChild(sequence);
        content.appendChild(chart);
        content.style.display = "block";

        container.appendChild(content);
    }

    function GetData(url, cb) {
        var regexHTTP = /http:\/\//;
        var regexHTTPS = /https:\/\//;
        var regexLast = /\/$/;
        url.replace(regexHTTP, "");
        url.replace(regexHTTPS, "");
        url.replace(regexLast, "");

        var RequestURL = baseURL + "/web/timemap/json?" + "url=" + url + "/&" + "fl=timestamp:4,original&" + "matchType=prefix&" + "filter=statuscode:200&" + "filter=mimetype:text/html&" + "collapse=urlkey&" + "collapse=timestamp:4";
        if (limit) {
            RequestURL += "&limit=" + limit;
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", RequestURL, true);
        xhr.onerror = function () {
            cb(false, "An error occured. Please refresh the page and try again");
        };
        xhr.ontimeout = function () {
            cb(false, "Timeout, Please refresh the page and try again");
        };
        xhr.onload = function () {
            var response = JSON.parse(xhr.responseText);
            if (response.length == 0) cb(true, []);

            var yearUrl = [];
            for (var i = 1; i < response.length; i++) {
                if (response[i][1].match(/jpg|pdf|png|form|gif/)) {
                    continue;
                }
                response[i][1] = response[i][1].trim().replace(":80/", "/");
                if (response[i][0] in yearUrl) {
                    yearUrl[response[i][0]].push(response[i][1]);
                } else {
                    yearUrl[response[i][0]] = [response[i][1]];
                }
            }
            var ret = [];
            for (var year in yearUrl) {
                ret.push([year].concat(yearUrl[year]));
            }
            /** ret has the following format:
             *  array(
             *    array(2005, url1, url2, .... urlN),
             *    ...
             *  ) **/
            var years = function () {
                for (var i = 0; i < ret.length; i++) {
                    for (var j = 1; j < ret[i].length; j++) {
                        var url;
                        if (ret[i][j].includes("http")) {
                            url = ret[i][j].substring(7);
                        } else if (ret[i][j].includes("https")) {
                            url = ret[i][j].substring(8);
                        }
                        if (url.includes('//')) {
                            url = url.split('//').join('/');
                        }
                        url = url.split('/').join('/');
                        ret[i][j] = url;
                    }
                }

                return ret;
            }();

            var all_years = years.map(function (year) {
                if (year.length > 1) {
                    return year[0];
                }
            });

            cb(true, null, all_years, years);
        };
        xhr.send();
    }

    function CreateYearButtons(element, option, allYears, yearData) {
        var divBtn = element.querySelector(".div-btn");
        if (!element.querySelector(".year-btn")) {
            allYears.forEach(function (year, i) {
                var btn = document.createElement("button");
                btn.setAttribute("class", "year-btn");
                btn.setAttribute("id", allYears[i]);
                btn.innerHTML = allYears[i];
                btn.onclick = function (evt) {
                    var target = evt.target;
                    if (element.querySelector(".active-btn")) {
                        element.querySelector(".active-btn").classList.remove("active-btn");
                    }
                    target.classList.add("active-btn");
                    GlobYear = target.id;
                    var num = allYears.indexOf(target.id);
                    var text = MakeNewText(num, yearData);
                    DrawChart(element, option, text);
                };
                divBtn.appendChild(btn);
                if (i == allYears.length - 1) btn.click();
            });
        }
    }

    function DrawChart(element, option, text) {
        element.querySelector(".sequence").innerHTML = "";
        element.querySelector("#chart").innerHTML = "";
        var width = element.querySelector('#chart').offsetWidth;
        var height = width;
        var radius = Math.min(width, height) / 2;
        var colors = scaleOrdinal(schemeCategory20b);
        var vis = select("#chart").append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("id", "d3_container").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        var partition$$1 = partition().size([2 * Math.PI, radius * radius]);
        var arc$$1 = arc().startAngle(function (d) {
            return d.x0;
        }).endAngle(function (d) {
            return d.x1;
        }).innerRadius(function (d) {
            return Math.sqrt(d.y0);
        }).outerRadius(function (d) {
            return Math.sqrt(d.y1);
        });

        var csv = csvParseRows(text);
        var json = BuildHierarchy(csv);
        CreateVisualization(json);

        function CreateVisualization(json) {
            vis.append("svg:circle").attr("r", radius).style("opacity", 0);
            var root = hierarchy(json).sum(function (d) {
                return d.size;
            }).sort(function (a, b) {
                return b.value - a.value;
            });
            var nodes = partition$$1(root).descendants();
            var path = vis.data([json]).selectAll("path").data(nodes).enter().append("svg:path").attr("display", function (d) {
                return d.depth ? null : "none";
            }).attr("d", arc$$1).attr("fill-rule", "evenodd").style("fill", function (d) {
                if (d.data.name == 'end') {
                    return '#000000';
                } else {
                    return colors((d.children ? d : d.parent).data.name);
                }
            }).style("opacity", 1).style("cursor", 'pointer').on("mouseover", mouseover).on("click", OpenTheUrl);

            select("#d3_container").on("mouseleave", mouseleave);
        }

        function OpenTheUrl(d) {
            var year = GlobYear;
            var anc = d.ancestors().reverse();
            var url = "";
            for (var i = 1; i < anc.length; i++) {
                if (anc[i].data.name == 'end') {
                    break;
                }
                url = url + '/' + anc[i].data.name;
            }
            window.open(baseURL + "/web/" + year + "0630" + url);
        }

        function mouseover(d) {
            var sequenceArray = d.ancestors().reverse();
            sequenceArray.shift();
            UpdateBreadcrumbs(sequenceArray);
            selectAll("path").style("opacity", 0.3);
            vis.selectAll("path").filter(function (node) {
                return sequenceArray.indexOf(node) >= 0;
            }).style("opacity", 1);
        }

        function mouseleave(d) {
            element.querySelector(".sequence").innerHTML = "";
            selectAll("path").on("mouseover", null);
            selectAll("path").transition().style("opacity", 1).on("end", function () {
                select(this).on("mouseover", mouseover);
            });
        }

        function UpdateBreadcrumbs(nodeArray) {
            var text = "";
            var symb = document.createElement('span');
            symb.setAttribute('class', 'symb');
            symb.innerHTML = "/";
            for (var i = 0; i < nodeArray.length; i++) {
                if (i == 0) {
                    text = " " + nodeArray[i].data.name;
                } else {
                    text = text + symb.innerHTML + nodeArray[i].data.name;
                }
            }
            element.querySelector(".sequence").innerHTML = text;
        }

        function BuildHierarchy(csv) {
            csv.sort(function (a, b) {
                return a[0].length - b[0].length || a[0].localeCompare(b[0]);
            });
            var real_urls = {};
            real_urls[option.url] = 1;
            if (option.url.slice(-1) != '/') {
                real_urls[option.url + '/'] = 1;
            }
            for (var i = 0, length = csv.length; i < length; i++) {
                var key = String(csv[i][0]).trim().replace(":80/", "/");
                real_urls[key] = 1;
                if (key.slice(-1) != '/') {
                    real_urls[key + '/'] = 1;
                }
            }

            var DELIMITER = '|';

            function FilterRealUrl(url) {
                var parts = url.trim().split("/");
                var delimiter_index = [];
                for (var i = 1; i < parts.length; i++) {
                    var potentialUrl = parts.slice(0, i).join("/");
                    if (potentialUrl in real_urls === false && i > 0) {
                        var pos = parts.slice(0, i).join('/').length;
                        delimiter_index.push(pos);
                    }
                }
                if (delimiter_index.length > 0) {
                    var result_url = url;
                    for (var j = 1; j < delimiter_index.length; j++) {
                        var index = delimiter_index[j];
                        result_url = result_url.substr(0, index) + DELIMITER + result_url.substr(index + 1);
                    }
                    return result_url;
                }
                return url;
            }
            var root = { name: "root", children: [] };
            for (var i = 0; i < length; i++) {
                var sequence = FilterRealUrl(csv[i][0]);
                var size = +csv[i][1];
                if (isNaN(size)) {
                    continue;
                }
                var parts = sequence.split("/");
                parts = parts.map(function (s) {
                    return s.replace(/\|/g, '/');
                });
                var currentNode = root;
                for (var j = 0; j < parts.length; j++) {
                    var children = currentNode.children;
                    var nodeName = parts[j];
                    var childNode;
                    if (j + 1 < parts.length) {
                        var foundChild = false;
                        for (var k = 0; k < children.length; k++) {
                            if (children[k].name == nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        if (!foundChild) {
                            childNode = { name: nodeName, children: [] };
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        childNode = { name: nodeName, size: size };
                        children.push(childNode);
                    }
                }
            }
            return root;
        }
    }

    function MakeNewText(n, yearData) {
        var text = "";
        var x = 2;
        if (yearData[n].length == 2) {
            x = 1;
        }
        for (var i = x; i < yearData[n].length; i++) {
            if (i != yearData[n].length - 1) {
                text = text + yearData[n][i] + " ,1" + "\n";
            } else {
                text = text + yearData[n][i] + " ,1";
            }
        }
        return text;
    }
}

export { RadialTree };
//# sourceMappingURL=radial-tree.esm.js.map
