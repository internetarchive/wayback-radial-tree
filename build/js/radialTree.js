/**
 * Radial Tree Library
 * 
 * @param {Object} option
 */
function RadialTree(option){
    var defaults = {

    }

    this.option = option;
    this.onChange = this.onChange.bind(this);
    this.onShown = this.onShown.bind(this);
    this.onHidden = this.onHidden.bind(this);
}

/**
 * Show Radial Tree element
 */
RadialTree.prototype.show = function(){
    console.log("show()");
}

/**
 * Hide Radial Tree element
 */
RadialTree.prototype.hide = function(){
    console.log("hide()");
}

/**
 * On Shown event 
 */
RadialTree.prototype.onShown = function(event){
    console.log("onShown event");
}

/**
 * On Hidden event
 */
RadialTree.prototype.onHidden = function(event){
    console.log("onHidden event");
}

RadialTree.prototype.onChange = function(event){
    
}


