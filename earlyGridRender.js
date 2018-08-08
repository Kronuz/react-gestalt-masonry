try {
	function shortest(a, b) { return a < b }
	function longest(a, b) { return a > b }
	function mindex(arr, cmp) {
		var idx = 0;
		for (var i = 1; i < arr.length; i++) {
			if (cmp(arr[i], arr[idx])) {
				idx = i;
			}
		}
		return idx;
	}
	var grids = document.getElementsByClassName('Masonry');
	for (var j = 0; j < grids.length; j++) {
		var grid = grids[j];
		var width = grid.clientWidth;
		var gutter = 14;
		var minCols = 3;
		var items = [].slice.call(grid.getElementsByClassName('static'));
		var columnWidth = items[0].clientWidth;
		var columnWidthAndGutter = columnWidth + gutter;
		var columnCount = Math.max(Math.floor((width + gutter) / columnWidthAndGutter), minCols);
		// the total height of each column
		var heights = new Array(columnCount).fill(0);
		var centerOffset = Math.max(Math.floor((width - columnWidthAndGutter * columnCount + gutter) / 2), 0);
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var height = item.clientHeight;
			var heightAndGutter = height + gutter;
			var col = mindex(heights, shortest);
			item.style.top = heights[col] + 'px';
			item.style.left = (col * columnWidthAndGutter + centerOffset) + 'px';
			item.style.visibility = 'visible';
			heights[col] += heightAndGutter;
		}
		var longestColumn = mindex(heights, longest);
		grid.style.height = heights[longestColumn] + 'px';
	}
} catch (e) {}
