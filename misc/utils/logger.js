//const format = d3.time.format("%H:%M:%S.%L")
window.console = {
	log: function(str){
		var node = document.createElement("div");
		var span = document.createElement("span")
		span.className = "timestamp"
		span.appendChild(document.createTextNode(`- : `))	//format(new Date()) to display the timestamp
		node.appendChild(span)
		node.appendChild(document.createTextNode(str))
		document.getElementById("log").prepend(node);
	},
	warn: function(str){
		var node = document.createElement("div")
		node.className = "warn"
		var span = document.createElement("span")
		span.className = "timestamp"
		span.appendChild(document.createTextNode(`- : `))
		node.appendChild(span)
		node.appendChild(document.createTextNode(str))
		document.getElementById("log").prepend(node)
	},
	error: function(str){
		var node = document.createElement("div")
		node.className = "error"
		var span = document.createElement("span")
		span.className = "timestamp"
		span.appendChild(document.createTextNode(`- : `))
		node.appendChild(span)
		node.appendChild(document.createTextNode(str))
		document.getElementById("log").prepend(node)
	},
}