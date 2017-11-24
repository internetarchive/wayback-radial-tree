var pluginName = "radialtree";
/**
 * Radial Tree Library
 * 
 * @param {Object} option
 */
function RadialTree(element, option){
    this.element = element;
    this.option = option;

    
    if (!option.url) return;

    Init(element);
    GetData(option.url, function(success, err, allYears, yearData){
        if (!success) return;

        CreateYearButtons(element, allYears, yearData);
    });

    function Init(container){
        var content = document.createElement("div");
        content.setAttribute("class", "radial-tree-content");
        var span = document.createElement("button");
        span.innerHTML = "&times";
        span.setAttribute("class", "rt-close");
        var divBtn = document.createElement("div");
        divBtn.setAttribute("id", "divBtn");
        var message = document.createElement("div");
        message.setAttribute("id", "message");

        var main = document.createElement("div");
        var sequence = document.createElement("p");
        var chart = document.createElement("div");
        sequence.setAttribute("id", "sequence");
        chart.setAttribute("id", "chart");
        main.setAttribute("id", "main");
        
        content.appendChild(divBtn);
        content.appendChild(span);
        content.appendChild(sequence);
        content.appendChild(chart);
        content.appendChild(message);
        content.style.display = "block";

        container.appendChild(content);

        span.onclick = function(){
            container.style.display = "none";
        }
    }

    function GetData(url, cb){
        var RequestURL = "https://web.archive.org/web/timemap/json?" + 
            "url=" + url + "/&" + 
            "fl=timestamp:4,original,urlkey&" + 
            "matchType=prefix&" + 
            "filter=statuscode:200&" + 
            "filter=mimetype:text/html&" + 
            "collapse=urlkey&" + 
            "collapse=timestamp:4";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", RequestURL, true);
		xhr.onerror = function(){
            cb(false, "An error occured. Please refresh the page and try again");
		};
		xhr.ontimeout = function(){
			cb(false, "Timeout, Please refresh the page and try again");
        }
        xhr.onload = function(){
            var response = JSON.parse(xhr.responseText);
            if (response.length == 0) cb(true, []);
            
            var array_Year = (function(){
                var ret = new Array();
                var index_Year = 0;
                for (var i=1; i<response.length; i++) {
                    if (response[i][1].match(/jpg|pdf|png|form|gif/)) {
                        continue;
                    }
    
                    response[i][1] = (function(){
                        var tmpAry = response[i][2].split(",");
                        var domain = "";
                        var url = "";
        
                        for (var k=0; k<tmpAry.length-1; k++) {
                            if (k == 0) {
                                domain = tmpAry[0];
                            } else {
                                domain = tmpAry[k] + "." + domain;
                            } 
                        }
    
                        return tmpAry[tmpAry.length - 1].slice(-1) == "/" ? 
                            "http://www." + tmpAry[tmpAry.length - 1].replace(")/", "." + domain + "/") :
                            "http://www." + url + "/" + tmpAry[tmpAry.length - 1].replace(")/", "." + domain + "/");
                    }());
    
                    if (i == 1) {
                        ret[0] = new Array();
                        ret[0].push(response[1][1]);
                        ret[0].push(response[1][0]);
                    } else if (response[i-1][1] == response[i][1]) {
                        ret[index_Year].push(response[i][0]);
                    } else {
                        index_Year ++;
                        ret[index_Year] = new Array();
                        ret[index_Year].push(response[i][1]);
                        ret[index_Year].push(response[i][0]);
                    }
                }

                return ret;
            }());

            var years = (function(){
                var ret = new Array();
                for (var i=1; i<array_Year[0].length; i++) {
                    ret[i-1] = new Array();
                    ret[i-1].push(array_Year[0][i]);
                }
                for (var i=0; i<array_Year.length; i++) {
                    var url = array_Year[i][0];
                    for (var j=1; j<array_Year[i].length; j++) {
                        var date = array_Year[i][j];
                        var k = 0; 
                        if (ret[k] != undefined) {
                            while(ret[k] != undefined && ret[k][0] != date) {
                                k++;
                            }
                            if (ret[k] != undefined) {
                                ret[k].push(url);
                            }
                        }
                    }
                }
                for (var i=0; i<ret.length; i++) {
                    for (var j=1; j<ret[i].length; j++) {
                        var url;
                        if (ret[i][j].includes("http")) { 
                            url = ret[i][j].substring(7);
                        } else if (ret[i][j].includes("https")) {
                            url = ret[i][j].sugstring(8);
                        }
                        url = url.slice(0, -1);
                        if (url.includes('//')) {
                            url = url.split('//').join('/');
                        }
                        url = url.split('/').join('/');
                        ret[i][j] = url;
                    }
                }

                return ret;
            }());
            
            var all_years = (function(){
                var ret = new Array();
                for (var i = 0; i < years.length; i++) {
                    if (years[i].length > 1) {
                        ret.push(years[i][0]);
                    }
                }

                return ret;
            }());

            cb(true, null, all_years, years);
        }
        xhr.send();
    }

    function CreateYearButtons(element, allYears, yearData){
        var GlobYear = 0;
        var divBtn = element.querySelector("#divBtn");
        if (!element.querySelector(".year-btn")){
            allYears.forEach(function(year, i){
                var btn = document.createElement("button");
                btn.setAttribute("class", "year-btn");
                btn.setAttribute("id", allYears[i]);
                btn.innerHTML = allYears[i];
                btn.onclick = function(evt){
                    var target = evt.target;
                    if (element.querySelector(".active-btn")) {
                        element.querySelector(".active-btn")[0].classList.remove("active-btn");
                    }
                    target.classList.add("active-btn");
                    GlobYear = target.id;
                    var num = allYears.indexOf(target.id);
                    var text = MakeNewText(num, yearData);
                    DrawChart(element, text);
                };
                divBtn.appendChild(btn);
            });
        }
    }

    function DrawChart(element, text){
        // Dimensions of sunburst.
        element.querySelector('#sequence').innerHTML    = "";
        element.querySelector('#chart').innerHTML       = "";
        element.querySelector('#message').innerHTML     = "";
        var width = window.offsetWidth - 150;
        var height = window.innerHeight - 150;
        var radius = Math.min(width, height) / 2;
        // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
        var b = {
            w: 100,
            h: 30,
            s: 3,
            t: 10
        };
        var colors = d3.scaleOrdinal(d3.schemeCategory20b);
        // Total size of all segments; we set this later, after loading the data.
        var totalSize = 0;
        var vis = d3.select("#chart").append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("id", "container").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        var partition = d3.partition().size([2 * Math.PI, radius * radius]);
        var arc = d3.arc().startAngle(function(d) { return d.x0; }).endAngle(function(d) { return d.x1; }).innerRadius(function(d) { return Math.sqrt(d.y0); }).outerRadius(function(d) { return Math.sqrt(d.y1); });
        // Use d3.text and d3.csvParseRows so that we do not need to have a header
        // row, and can receive the csv as an array of arrays.
        var csv = d3.csvParseRows(text);
        var json = buildHierarchy(csv);
        createVisualization(json);
        // Main function to draw and set up the visualization, once we have the data.
        function createVisualization(json) {
            // Bounding circle underneath the sunburst, to make it easier to detect
            // when the mouse leaves the parent g.
            vis.append("svg:circle").attr("r", radius).style("opacity", 0);
            // Turn the data into a d3 hierarchy and calculate the sums.
            var root = d3.hierarchy(json).sum(function(d) { return d.size; }).sort(function(a, b) { return b.value - a.value; });
            // For efficiency, filter nodes to keep only those large enough to see.
            var nodes = partition(root).descendants()
            var path = vis.data([json]).selectAll("path").data(nodes).enter().append("svg:path").attr("display", function(d) { return d.depth ? null : "none"; }).attr("d", arc).attr("fill-rule", "evenodd").style("fill", function(d) {
                if (d.data.name == 'end') { return '#000000'; } else {
                    return colors((d.children ? d : d.parent).data.name);
                }
            }).style("opacity", 1).style("cursor", 'pointer').on("mouseover", mouseover).on("click", openTheUrl);
            // Add the mouseleave handler to the bounding circle.
            d3.select("#container").on("mouseleave", mouseleave);
            // Get total size of the tree = value of root node from partition.
            totalSize = path.datum().value;
        };

        function openTheUrl(d) {
            var year = GlobYear;
            var anc = d.ancestors().reverse();
            var url = "";
            for (var i = 1; i < anc.length; i++) {
                if (anc[i].data.name == 'end') {
                    break;
                }
                url = url + '/' + anc[i].data.name;
            }
            var wb_url = "https://web.archive.org/web/" + year + "0630";
            window.open = wb_url;
        }
        // Fade all but the current sequence, and show it in the breadcrumb trail.
        function mouseover(d) {
            var sequenceArray = d.ancestors().reverse();
            sequenceArray.shift(); // remove root node from the array
            updateBreadcrumbs(sequenceArray);
            // Fade all the segments.
            d3.selectAll("path").style("opacity", 0.3);
            // Then highlight only those that are an ancestor of the current segment.
            vis.selectAll("path").filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
            }).style("opacity", 1);
        }
        // Restore everything to full opacity when moving off the visualization.
        function mouseleave(d) {
            element.querySelector("#sequence").innerHTML = "";
            // Deactivate all segments during transition.
            d3.selectAll("path").on("mouseover", null);
            // Transition each segment to full opacity and then reactivate it.
            d3.selectAll("path").transition().style("opacity", 1).on("end", function() {
                d3.select(this).on("mouseover", mouseover);
            });
        }
        // Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray) {
            var anc_arr = nodeArray;
            // Data join; key function combines name and depth (= position in sequence).
            var trail = element.querySelector("#sequence");
            var text = "";
            var symb = document.createElement('span');
            symb.setAttribute('class', 'symb');
            symb.innerHTML = "/";
            for (var i = 0; i < anc_arr.length; i++) {
                if (i == 0) {
                    text = " " + anc_arr[i].data.name;
                } else {
                    text = text + symb.innerHTML + anc_arr[i].data.name;
                }
            }
            trail.innerHTML = text;
            // Make the breadcrumb trail visible, if it's hidden.
        }
        // Take a 2-column CSV and transform it into a hierarchical structure suitable
        // for a partition layout. The first column is a sequence of step names, from
        // root to leaf, separated by hyphens. The second column is a count of how 
        // often that sequence occurred.
        function buildHierarchy(csv) {
            csv.sort(function(a, b) {
                return a[0].length - b[0].length || a[0].localeCompare(b[0]);
            });
            var real_urls = {};
            real_urls[base_url] = 1;
            if (base_url.slice(-1) != '/') {
                real_urls[base_url + '/'] = 1;
            }
            for (var i = 0, length = csv.length; i < length; i++) {
                var key = String(csv[i][0]).trim().replace(":80/", "/");
                real_urls[key] = 1;
                if (key.slice(-1) != '/') {
                    real_urls[key + '/'] = 1;
                }
            }
            // Add DELIMITER instead of '/' for NOT real URLs.
            var DELIMITER = '|';

            function filter_real_url(url) {
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
            var root = { "name": "root", "children": [] };
            for (var i = 0; i < length; i++) {
                var sequence = filter_real_url(csv[i][0]);
                var size = +csv[i][1];
                if (isNaN(size)) { // e.g. if this is a header row
                    continue;
                }
                var parts = sequence.split("/");
                parts = parts.map(function(s) { return s.replace(/\|/g, '/'); });
                var currentNode = root;
                for (var j = 0; j < parts.length; j++) {
                    var children = currentNode["children"];
                    var nodeName = parts[j];
                    var childNode;
                    if (j + 1 < parts.length) {
                        // Not yet at the end of the sequence; move down the tree.
                        var foundChild = false;
                        for (var k = 0; k < children.length; k++) {
                            if (children[k]["name"] == nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        // If we don't already have a child node for this branch, create it.
                        if (!foundChild) {
                            childNode = { "name": nodeName, "children": [] };
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        // Reached the end of the sequence; create a leaf node.
                        childNode = { "name": nodeName, "size": size };
                        children.push(childNode);
                    }
                }
            }
            return root;
        }
    }

    function MakeNewText(n, yearData){
        var text = "";
        var x = 2;
        if (yearData[n].length == 2) {
            x = 1;
        }
        for (var i = x; i < yearData[n].length; i++) {
            if (i != (yearData[n].length - 1)) {
                text = text + yearData[n][i] + " ,1" + "\n";
            } else {
                text = text + yearData[n][i] + " ,1";
            }
        }
        return text;
    }
}

/**
 * Show Radial Tree element
 */
RadialTree.prototype.show = function(){
    this.element.style.display = "block";
}

/**
 * Hide Radial Tree element
 */
RadialTree.prototype.hide = function(){
    this.element.style.display = "none";
}

$.fn[pluginName] = function(options){
    this.each(function(){
        if (!$.data(this, pluginName)){
            $.data(this, pluginName, new RadialTree(this, options));
        }
    });

    return this;
}