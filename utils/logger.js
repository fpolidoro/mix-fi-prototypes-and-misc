window.console = {
	log: function(str){
		var node = document.createElement("div");
		var span = document.createElement("span")
		span.className = "timestamp"
		span.appendChild(document.createTextNode(`${moment().format('HH:mm:ss.SSS')}: `))
		node.appendChild(span)
		node.appendChild(document.createTextNode(str))
		document.getElementById("log").prepend(node);
	},
	warn: function(str){
		var node = document.createElement("div")
		node.className = "warn"
		var span = document.createElement("span")
		span.className = "timestamp"
		span.appendChild(document.createTextNode(`${moment().format('HH:mm:ss.SSS')}: `))
		node.appendChild(span)
		node.appendChild(document.createTextNode(str))
		document.getElementById("log").prepend(node)
	}
}