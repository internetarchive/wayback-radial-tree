var pluginName = "radialtree";
/**
 * Radial Tree Library
 * 
 * @param {Object} option
 */
function RadialTree(element, option){
    this.element = element;
    this.option = option;

    init(element, option);

    function init(container, option){
        var content = document.createElement("div");
        content.setAttribute("class", "radial-tree-content");
        var span = document.createElement("button");
        span.innerHTML = "&times";
        span.setAttribute("class", "RTClose");
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