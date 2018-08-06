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
try {
    var pins = [].slice.call(document.getElementsByClassName('static'));
    var gridWidth = document.getElementsByClassName('gridCentered')[0].clientWidth;
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
    window.didEarlyGridRender = true;
} catch (e) {}
