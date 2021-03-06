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
	function widthToBreakpoint(w) {
		return w >= 1200 ? 'xl' : w >= 992 ? 'lg' : w >= 768 ? 'md' : w >= 576 ? 'sm' : 'xs';
	}
	function breakpointNumber(obj, bp) {
		if (typeof obj !== 'object') {
			return obj;
		}
		switch (bp) {
			case 'xl':
				if (obj.xl) return obj.xl;
			case 'lg':
				if (obj.lg) return obj.lg;
			case 'md':
				if (obj.md) return obj.md;
			case 'sm':
				if (obj.sm) return obj.sm;
			case 'xs':
				if (obj.xs) return obj.xs;
		}
	}
	var breakpoint = widthToBreakpoint(window.innerWidth);
	var grids = document.getElementsByClassName('Masonry');
	for (var j = 0; j < grids.length; j++) {
		var grid = grids[j];
		var width = grid.clientWidth;
		var masonry = JSON.parse(grid.getAttribute('data-masonry'));
		switch (masonry.layout) {
			case 'fullWidth': {
				var gutter = masonry.gutter || 0;
				var minCols = masonry.minCols || 2;
				var maxCols = masonry.maxCols || Infinity;
				var idealColumnWidth = masonry.idealColumnWidth || 240;

				// "This is kind of crazy!" - you
				// Yes, indeed. The "guessing" here is meant to replicate the pass that the
				// original implementation takes with CSS.
				var colguess = Math.floor(width / idealColumnWidth);
				var columnCount = Math.min(Math.max(
					Math.floor((width - colguess * gutter) / idealColumnWidth),
					minCols
				), maxCols);
				var columnWidth = breakpointNumber(Math.floor(width / columnCount), breakpoint);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					item.style.width = columnWidth + 'px';
					var height = item.clientHeight;

					var col = mindex(heights, shortest);
					var _top = heights[col];
					var _left = col * columnWidth + gutter / 2;

					heights[col] += height;

					item.style.top = _top + 'px';
					item.style.left = _left + 'px';
					item.style.visibility = 'visible';
				}
				var longestColumn = mindex(heights, longest);
				grid.style.height = heights[longestColumn] + 'px';
				break;
			}
			case 'uniformRow': {
				var columnWidth = masonry.columnWidth || 236;
				var gutter = masonry.gutter || 14;
				var minCols = masonry.minCols || 3;
				var maxCols = masonry.maxCols || Infinity;

				var columnWidth = breakpointNumber(columnWidth, breakpoint);

				var columnWidthAndGutter = columnWidth + gutter;
				var columnCount = Math.min(Math.max(
					Math.floor((width + gutter) / columnWidthAndGutter),
					minCols
				), maxCols);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					item.style.width = columnWidth + 'px';
					var height = item.clientHeight;

					var column = i % columnCount;
					var row = Math.floor(i / columnCount);

					if (column === 0 || height > heights[row]) {
						heights[row] = height;
					}

					var _top =
						row > 0
							? heights.slice(0, row).reduce((sum, y) => sum + y + gutter, 0)
							: 0;
					var _left = column * columnWidthAndGutter;

					item.style.top = _top + 'px';
					item.style.left = _left + 'px';
					item.style.visibility = 'visible';
				}
				var longestColumn = mindex(heights, longest);
				grid.style.height = heights[longestColumn] + 'px';
				break;
			}
			default: {
				var columnWidth = masonry.columnWidth || 236;
				var gutter = masonry.gutter || 14;
				var minCols = masonry.minCols || 2;
				var maxCols = masonry.maxCols || Infinity;

				columnWidth = breakpointNumber(columnWidth, breakpoint);

				var columnWidthAndGutter = columnWidth + gutter;
				var columnCount = Math.min(Math.max(
					Math.floor((width + gutter) / columnWidthAndGutter),
					minCols
				), maxCols);
				// the total height of each column
				var heights = new Array(columnCount).fill(0);
				var centerOffset = Math.max(Math.floor((width - columnWidthAndGutter * columnCount + gutter) / 2), 0);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					item.style.width = columnWidth + 'px';
					var height = item.clientHeight;

					var heightAndGutter = height + gutter;
					var col = mindex(heights, shortest);
					var _top = heights[col];
					var _left = col * columnWidthAndGutter + centerOffset;

					heights[col] += heightAndGutter;

					item.style.top = _top + 'px';
					item.style.left = _left + 'px';
					item.style.visibility = 'visible';
				}
				var longestColumn = mindex(heights, longest);
				grid.style.height = heights[longestColumn] + 'px';
				break;
			}
		}
	}
} catch (e) {}
