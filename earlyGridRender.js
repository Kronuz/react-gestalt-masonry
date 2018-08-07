try {
	function getShortestColumn(colHeights) {
		var shortestIndex = 0;
		var minHeight = colHeights[0];
		for (var i = 1; i < colHeights.length; i++) {
			if (colHeights[i] < colHeights[shortestIndex]) {
				shortestIndex = i;
				minHeight = colHeights[i];
			}
		}
		return shortestIndex;
	}
	var grids = document.getElementsByClassName('Masonry');
	for (var j = 0; j < grids.length; j++) {
		var grid = grids[j];
		var gridWidth = grid.clientWidth;
		var pins = [].slice.call(grid.getElementsByClassName('static'));
		var pinWidth = pins[0].clientWidth;
		var numCols = gridWidth / pinWidth;
		var colHeights = new Array(numCols);
		for (var i = 0; i < pins.length; i++) {
			if (i < numCols) {
				colHeights[i] = 0;
			}
			var pin = pins[i];
			var shortestColumn = getShortestColumn(colHeights);
			pin.style.top = colHeights[shortestColumn] + 'px';
			pin.style.left = shortestColumn * pin.clientWidth + 'px';
			pin.style.visibility = 'visible';
			colHeights[shortestColumn] = colHeights[shortestColumn] + pin.clientHeight;
		}
	}
} catch (e) {}
