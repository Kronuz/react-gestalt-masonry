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
		var layout = grid.getAttribute('data-masonry-layout');
		switch (layout) {
			case 'fullWidth': {
				var gutter = parseInt(grid.getAttribute('data-masonry-gutter'));
				var minCols = parseInt(grid.getAttribute('data-masonry-min-cols'));
				var idealColumnWidth = parseInt(grid.getAttribute('data-masonry-ideal-column-width'));

				// "This is kind of crazy!" - you
				// Yes, indeed. The "guessing" here is meant to replicate the pass that the
				// original implementation takes with CSS.
				var colguess = Math.floor(width / idealColumnWidth);
				var columnCount = Math.max(
					Math.floor((width - colguess * gutter) / idealColumnWidth),
					minCols
				);
				var columnWidth = Math.floor(width / columnCount);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
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
				var gutter = parseInt(grid.getAttribute('data-masonry-gutter'));
				var minCols = parseInt(grid.getAttribute('data-masonry-min-cols'));
				var columnWidth = parseInt(grid.getAttribute('data-masonry-column-width'));

				var columnWidthAndGutter = columnWidth + gutter;
				var columnCount = Math.max(
					Math.floor((width + gutter) / columnWidthAndGutter),
					minCols
				);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
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
				var gutter = parseInt(grid.getAttribute('data-masonry-gutter'));
				var minCols = parseInt(grid.getAttribute('data-masonry-min-cols'));
				var columnWidth = parseInt(grid.getAttribute('data-masonry-column-width'));

				var columnWidthAndGutter = columnWidth + gutter;
				var columnCount = Math.max(Math.floor((width + gutter) / columnWidthAndGutter), minCols);
				// the total height of each column
				var heights = new Array(columnCount).fill(0);
				var centerOffset = Math.max(Math.floor((width - columnWidthAndGutter * columnCount + gutter) / 2), 0);

				var items = [].slice.call(grid.getElementsByClassName('static'));
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
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
